# Mypromptu

Mypromptu is a platform designed to help users improve their impromptu speaking skills through AI-driven topic generation, audio recording, and detailed speech analysis. It uses a modern tech stack encompassing Node.js, Express, React, PostgreSQL, FastAPI, and Redis.

## How to Run

This project consists of multiple services that need to run concurrently:

### 1. Prerequisites
- **PostgreSQL**: Ensure you have a running Postgres instance (Supabase is used in production).
- **Redis**: Ensure you have a local `redis-server` running on port 6379 (for the RQ job queue).

### 2. Node.js Backend (Express)
Open a terminal and navigate to the `backend` directory:
```bash
cd backend
npm install
npm run db:push
npm run dev
```
*(Requires `.env` with `DATABASE_URL`, `JWT_SECRET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_S3_BUCKET_NAME`)*

### 3. React Frontend (Vite)
Open a new terminal and navigate to the `frontend` directory:
```bash
cd frontend
npm install
npm run dev
```
*(Runs on port 5173 by default)*

### 4. Python AI Service & Worker (FastAPI + RQ)
Open a new terminal and navigate to the `api_service` directory:
```bash
cd api_service
# Create and activate a virtual environment
py -m venv venv
venv\Scripts\activate

# Install dependencies (requires system audio libraries like libsndfile for librosa/soundfile)
pip install -r requirements.txt

# Start the FastAPI server (runs on port 8000)
uvicorn main:app --reload
```

**RQ Worker**: In another terminal inside `api_service` (with the virtual environment activated), start the background worker:
```bash
rq worker
```
*(Requires `.env` in the `api_service` folder with `GEMINI_API_KEY` and `EXPRESS_PORT`)*

---

## Roadmap / Phases

### Phase 1: User Authentication
Core custom authentication using bcrypt and stateless JWTs.

**Endpoints:**
- `POST http://localhost:4000/api/auth/signup` - Requires JSON body: `email`, `name`, `password`. Returns JWT.
- `POST http://localhost:4000/api/auth/login` - Requires JSON body: `email`, `password`. Returns JWT.
- `POST http://localhost:4000/api/auth/logout` - Confirms logout. (Client must clear its stored token).

### Phase 2: Session & AI Topic Generation
Allows logged-in users to create a session and generate a unique speech topic using Google's Gemini AI.

**Components:**
- **Node.js/Express Backend:** Handles session creation, saves to PostgreSQL.
- **Python/FastAPI Service (`api_service/`):** Dedicated AI microservice integrating with the `google-generativeai` SDK.

**Endpoints (Node.js):**
- `POST http://localhost:4000/api/sessions` - Requires JWT token. JSON Body expects `category` and `difficulty`. Returns session data with the generated AI topic.
**Endpoints (FastAPI):**
- `POST http://localhost:8000/generate_topic` - Internal AI generation endpoint.

### Phase 3: Audio Recording & Evaluation Pipeline
Captures audio on the frontend, securely uploads it, and evaluates speech characteristics in a distributed background queue.

**Components & Architecture:**
- **Secure AWS S3 Storage**: Audio is uploaded directly to a private S3 bucket. Express generates short-lived Pre-Signed GET URLs (valid for 15 minutes) for the AI worker to securely access the audio without needing AWS credentials.
- **Job Queuing (Redis & RQ)**: Express triggers the processing by sending an HTTP request to FastAPI (`POST /api/evaluate/enqueue`), which safely enqueues the job into Redis using `rq`.
- **Parallel AI Processing**: The RQ worker securely downloads the temporary audio file and runs concurrent processes:
  - Speech transcription using `openai-whisper`.
  - Deterministic metrics calculation (pitch, fillers, articulation, energy, speaking rate) using `librosa` and `parselmouth`.
  - Fetching user history to check for long-term improvement.
- **Gemini Evaluation**: The combined metrics and past context are passed to Gemini 1.5 Pro to generate a strict, highly-structured JSON evaluation (Summary, Strengths, Weaknesses, Tips, and Score out of 10).
- **Webhook Delivery**: The AI worker POSTs the final payload back to Express (`POST /api/webhooks/evaluation-result`), which stores the metrics and report in the database for the user to view.
