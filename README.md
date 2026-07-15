# Mypromptu

Mypromptu is a platform designed to help users improve their impromptu speaking skills through AI-driven topic generation, audio recording, and detailed speech analysis. It uses a modern tech stack encompassing Node.js, Express, React, PostgreSQL, FastAPI, and Redis.

## How to Start the Project (Proper Order)

This project consists of multiple services that need to run concurrently. Follow these steps in order:

### 1. Start Docker (Database & Redis)
- Ensure Docker Desktop is running in the background.
- Start your **PostgreSQL** instance (or use Supabase for production).
- Start **Redis** on port `6379`. (Redis is required for the RQ background job queue).

### 2. Node.js Backend (Express)
Open a new terminal and navigate to the `backend` directory:
```bash
cd backend
npm install
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

### 4. Python AI Service (FastAPI)
Open a new terminal and navigate to the `api_service` directory:
```bash
cd api_service
# Create and activate a virtual environment
py -m venv venv
venv\Scripts\activate

# Install dependencies (requires system audio libraries like ffmpeg)
pip install -r requirements.txt

# Start the FastAPI server
uvicorn main:app --reload
```
*(Runs on port 8000. Requires `.env` in the `api_service` folder with `GEMINI_API_KEY` and `EXPRESS_PORT`)*

### 5. Background Job Worker (RQ)
Open a **final new terminal**, navigate to `api_service`, activate the virtual environment, and start the worker. **For Windows, you must use the SimpleWorker class**:
```bash
cd api_service
venv\Scripts\activate

# Start the worker (Windows compatible)
rq worker --worker-class rq.SimpleWorker
```
*(Troubleshooting: If a previous crash left jobs stuck in "executing" state, run `rq requeue --all --queue default` to push them back into the active queue).*

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

### Phase 4: Job Processing Stability & Logging
Ensures the background evaluation pipeline is robust, especially on local development environments like Windows.

**Key Features Implemented:**
- **Windows Compatibility**: Bypassed the native `os.fork()` limitation in RQ by configuring the application to run with `rq.SimpleWorker`.
- **Detailed Step-by-Step Tracing**: Embedded explicit `DEBUG` console logs at every stage of the pipeline (Audio download -> FFmpeg conversion -> Metrics extraction -> Express context fetching -> Gemini Evaluation -> Webhook dispatch).
- **Graceful Error Recovery**: Documented rescue commands (`rq requeue`) to recover orphaned jobs that fail abruptly and get stuck in a locked state in Redis.
- **Decoupled Database Architecture**: Confirmed that the Python worker never interfaces directly with the database, instead maintaining security boundaries by querying the Express backend for user context.
