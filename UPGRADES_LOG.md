# Impromptu-AI: Production Hardening Upgrades Log
**Date:** July 23, 2026

## Overview
This document tracks all the architectural, scalability, and resilience upgrades implemented to transition the Impromptu-AI platform from a standard MVP to an enterprise-grade, fault-tolerant system. 

The primary goal of these upgrades was to handle concurrent user load, mitigate third-party API rate limits, ensure robust fallback handling for distributed microservices, and close security/cost vulnerabilities.

---

## 1. S3 Upload Constraints (Cost & Abuse Mitigation)
* **The Problem:** The AWS S3 pre-signed URL allowed users to upload files of any size. A malicious user could bypass the 2-minute frontend recording limit and upload a 5GB video file directly to S3, incurring massive storage and egress charges.
* **The Upgrade:** Implemented strict HTTP POST conditions within the S3 Pre-signed URL generation. Added a `['content-length-range', 0, 10485760]` condition to physically enforce a 10MB limit at the AWS level, regardless of frontend validation. Added content-type restrictions to only allow `audio/*`.

## 2. Distributed State Tracking & Webhook Fallbacks
* **The Problem:** If a Python worker failed mid-job (e.g., FFmpeg crash, or Groq API failure), it would crash silently. The Node.js database was completely unaware, leaving the session stuck in `processing`. The React frontend would poll infinitely, locking the user in a never-ending loading screen.
* **The Upgrade:** 
    1. Altered the PostgreSQL database schema to track explicit `status` columns (`pending`, `processing`, `failed`, `completed`).
    2. Wrapped the entire Python RQ worker job in a global `try/except` block. Upon any fatal exception, the worker now fires an HTTP POST webhook to the Node.js server with `status: failed`.
    3. Updated the React frontend polling logic to explicitly catch the `failed` state and seamlessly route the user to a polished `SpeechErrorScreen`, allowing them to return to the dashboard.

## 3. Intelligent API Retries (Exponential Backoff)
* **The Problem:** Groq (Whisper) and Google Gemini (LLM) have strict API rate limits. If two users uploaded audio at the exact same time, the second user might hit a `429 Too Many Requests` error, instantly crashing their job.
* **The Upgrade:** 
    1. Imported the `tenacity` library in Python.
    2. Wrapped Groq Whisper calls in a `@retry(wait_random_exponential)` decorator, pausing the thread for a few seconds and retrying up to 6 times before failing.
    3. Configured Langchain's `ChatGoogleGenerativeAI` with `max_retries=6`. 
    4. *Why:* This ensures that transient network outages or API rate limits automatically heal themselves without dropping the user's data.

## 4. Triple Worker Concurrency (Parallel Processing)
* **The Problem:** The Docker Compose setup only spun up 1 AI Worker. Even with a Redis queue, users were processed linearly. If user 1's audio took 45 seconds, user 2 had to wait 45 seconds before their audio even *began* processing.
* **The Upgrade:** Added `deploy: replicas: 3` to the `ai-worker` service in `docker-compose.yml`. Docker now automatically spins up 3 independent AI workers listening to the same Redis queue. Throughput is instantly tripled.

## 5. PostgreSQL Connection Pooling
* **The Problem:** Node.js was making raw connections to Postgres. Under high load (e.g., 100 users fetching their dashboards simultaneously), the database would drop connections.
* **The Upgrade:** Implemented an explicit Postgres connection pool (`max: 20`, `idle_timeout: 30`) inside `backend/src/db/index.js` to ensure stable, multiplexed database access for the Express API.

## 6. S3 Orphaned File Sweep (Cron Job)
* **The Problem:** If a user requested a Pre-signed URL but closed their browser before confirming the upload, their audio was stranded in S3 forever, racking up hidden storage costs.
* **The Upgrade:** Built `cleanupOrphanedFiles.js`, a Node.js cron job that runs daily at midnight. It queries the S3 bucket directly, checks for files older than 24 hours, cross-references the PostgreSQL database for matching records, and permanently deletes any file not explicitly confirmed.

## 7. Ghost Session Auto-Recovery (Cron Job)
* **The Problem:** If the Python worker container experienced a catastrophic failure (e.g., OOM kill by Docker) *before* it could send the failure webhook, the session would be permanently orphaned in `processing`.
* **The Upgrade:** Enhanced the `retryFailedSessions.js` cron job. Using Drizzle ORM, it now sweeps the database every 30 minutes for any session where `status = 'processing' AND created_at < 2 hours ago`. It intelligently categorizes these as "Ghost Sessions" and automatically re-queues them into Redis.

## 8. Express API Rate Limiting (DDoS Shield)
* **The Problem:** The API endpoints were completely open. A script could hit the `/sessions` endpoints thousands of times, flooding the queue and racking up AI billing charges.
* **The Upgrade:** Installed and configured `express-rate-limit`. 
    1. A global shield applied to all `/api/` traffic (100 requests / 15 mins).
    2. A hyper-strict shield applied explicitly to `/api/sessions/` (20 requests / 1 min) to safeguard the expensive AI generation and processing pipelines.

## 9. Parallel Worker Telemetry (Observability)
* **The Problem:** After scaling to 3 concurrent AI workers, the logs became interleaved. It was impossible to tell which exact Docker container processed which job, making debugging in distributed systems difficult.
* **The Upgrade:** Updated `worker.py` to dynamically pull the container's hostname using the Python `socket` library. Injected `[Worker {WORKER_ID}]` explicitly into all telemetry logs. This provides 100% visibility for tracing and debugging in Grafana/Loki.
