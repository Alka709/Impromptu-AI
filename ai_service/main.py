import os
import google.generativeai as genai
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from dotenv import load_dotenv
from worker import process_evaluation_job
import json
from telemetry import logger

load_dotenv(override=True)

app = FastAPI()

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


@app.post("/generate_topic")
async def generate_topic(request: TopicRequest):
    logger.info("Received generate_topic request", extra={"category": request.category, "difficulty": request.difficulty})
    if not GEMINI_API_KEY:
        logger.error("GEMINI_API_KEY is not configured")
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
            logger.error("AI returned malformed JSON", extra={"data": data})
            raise HTTPException(status_code=500, detail="AI returned malformed JSON.")

        logger.info("Successfully generated topic", extra={"topic": data["topic"]})
        return data
    except Exception as e:
        logger.error(f"Error generating topic: {e}", exc_info=True)
        try:
            logger.debug(f"Raw AI response was: {response.text}")
        except:
            pass
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/evaluate/enqueue")
async def enqueue_evaluation(request: EvalRequest, background_tasks: BackgroundTasks):
    try:
        logger.info("Enqueueing evaluation job natively", extra={"session_id": request.sessionId, "user_id": request.userId})
        background_tasks.add_task(process_evaluation_job, request.dict())
        return {"message": "Job enqueued natively", "job_id": request.sessionId}
    except Exception as e:
        logger.error(f"Failed to enqueue job: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Could not enqueue job natively")

@app.get("/health")
def health_check():
    logger.info("AI Service health check called")
    return {"status": "ok"}
