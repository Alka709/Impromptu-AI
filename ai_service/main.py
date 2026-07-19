import os
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from redis import Redis
from rq import Queue
from worker import process_evaluation_job

load_dotenv(override=True)

app = FastAPI()

# Setup Redis and RQ
redis_host = os.getenv("REDIS_HOST", "localhost")
redis_port = int(os.getenv("REDIS_PORT", 6379))
redis_conn = Redis(host=redis_host, port=redis_port)
q = Queue(connection=redis_conn)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

class TopicRequest(BaseModel):
    category: str
    difficulty: str

class EvalRequest(BaseModel):
    sessionId: str
    userId: str
    topic: str
    audioDownloadUrl: str
    reportCallbackUrl: str

import json

@app.post("/generate_topic")
async def generate_topic(request: TopicRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured.")

    prompt = f"""
    You are an expert at generating unique impromptu speech topics.
    Generate a single, compelling speech topic for the category '{request.category}' 
    with a difficulty level of '{request.difficulty}'.
    Also generate 5 short hints to help the speaker get started with this topic.
    Return the response as a JSON object with exactly two keys: "topic" (string) and "hints" (list of 5 strings).
    """

    try:
        model = genai.GenerativeModel('gemini-3.1-flash-lite')
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json",
            )
        )
        
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
            
        data = json.loads(text.strip())
        
        if "topic" not in data or "hints" not in data:
            raise HTTPException(status_code=500, detail="AI returned malformed JSON.")

        return data
    except Exception as e:
        print(f"Error generating topic: {e}")
        try:
            print(f"Raw AI response was: {response.text}")
        except:
            pass
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/evaluate/enqueue")
async def enqueue_evaluation(request: EvalRequest):
    try:
        job = q.enqueue(process_evaluation_job, request.dict())
        return {"message": "Job enqueued", "job_id": job.id}
    except Exception as e:
        print(f"Failed to enqueue job: {e}")
        raise HTTPException(status_code=500, detail="Could not enqueue job to RQ")

@app.get("/health")
def health_check():
    return {"status": "ok"}
