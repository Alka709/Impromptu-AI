import os
import json
import logging
import tempfile
import requests
import subprocess
from dotenv import load_dotenv

from agents.evaluation_pipeline import EvaluationPipeline
from speech_analysis.metrics import extract_all_metrics
from speech_analysis.utils import NumpyEncoder

load_dotenv(override=True)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

pipeline = EvaluationPipeline()

def fetch_past_sessions(user_id: str):
    """Fetch past 3 session evaluations from Express API"""
    try:
        backend_url = os.environ.get("BACKEND_INTERNAL_URL")
        if backend_url:
            url = f"{backend_url}/api/users/{user_id}/sessions/recent"
        else:
            express_port = os.environ.get("EXPRESS_PORT", "4000")
            url = f"http://localhost:{express_port}/api/users/{user_id}/sessions/recent"
        logger.info(f"Fetching past sessions from {url}")
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            return data
        logger.warning(f"Failed to fetch past sessions: {response.text}")
        return []
    except Exception as e:
        logger.error(f"Error fetching past sessions: {e}")
        return []

def process_evaluation_job(job_data: dict):
    """Main RQ job handler for evaluating audio"""
    session_id = job_data.get('sessionId')
    user_id = job_data.get('userId')
    topic = job_data.get("topic", "")
    audio_url = job_data.get('audioDownloadUrl')
    callback_url = job_data.get('reportCallbackUrl')

    logger.info(f"Starting evaluation job for session {session_id}")

    temp_path = None
    wav_path = None
    try:
        # 1. Download audio to temp file
        logger.info(f"Downloading audio from pre-signed URL")
        response = requests.get(audio_url, stream=True)
        response.raise_for_status()
        
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tf:
            for chunk in response.iter_content(chunk_size=8192):
                tf.write(chunk)
            temp_path = tf.name
            
        logger.info(f"Audio downloaded to {temp_path}")

        # Convert webm to wav (16 kHz mono) because speech_analysis audio loader expects a wav file
        wav_path = temp_path.replace(".webm", ".wav")
        logger.info(f"Converting {temp_path} to {wav_path} using ffmpeg...")
        try:
            subprocess.run(
                ["ffmpeg", "-y", "-i", temp_path, "-ac", "1", "-ar", "16000", wav_path],
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            logger.info("Audio conversion successful.")
        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg conversion failed: {e.stderr.decode('utf-8', errors='ignore')}")
            raise e

        # 2. Extract metrics using speech_analysis
        logger.info(f"Extracting speech metrics from {wav_path}...")
        metrics = extract_all_metrics(wav_path)
        
        # 3. Fetch past sessions
        logger.info(f"Fetching past sessions for user {user_id}")
        past_sessions = fetch_past_sessions(user_id)
        
        # 4. Evaluate with Gemini
        logger.info(f"Evaluating with Gemini")
        evaluation = pipeline.evaluate(
            metrics=metrics,
            topic=topic,
            history=past_sessions,
        )
        logger.info(f"Gemini evaluation completed. Score: {evaluation.get('overallScore')}")
        
        # 5. Send results back to Express
        payload = {
            "userId": user_id,
            "sessionId": session_id,
            "summary": evaluation.get("summary"),
            "strengths": evaluation.get("strengths"),
            "weaknesses": evaluation.get("weaknesses"),
            "improvementTips": evaluation.get("improvementTips"),
            "overallScore": evaluation.get("overallScore"),
            "metrics": json.loads(json.dumps(metrics, cls=NumpyEncoder))
        }
        
        logger.info(f"Sending results to webhook: {callback_url}")
        webhook_res = requests.post(callback_url, json=payload)
        webhook_res.raise_for_status()
        
        logger.info(f"Job completed successfully for session {session_id}")

    except Exception as e:
        logger.error(f"Job failed for session {session_id}: {e}", exc_info=True)
    finally:
        # Clean up temporary files
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
                logger.info(f"Deleted temporary file {temp_path}")
            except Exception as e:
                logger.error(f"Failed to delete temporary file {temp_path}: {e}")
        if wav_path and os.path.exists(wav_path):
            try:
                os.remove(wav_path)
                logger.info(f"Deleted temporary wav file {wav_path}")
            except Exception as e:
                logger.error(f"Failed to delete temporary wav file {wav_path}: {e}")

