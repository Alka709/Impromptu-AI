import os
import json
import tempfile
import requests
import subprocess
from dotenv import load_dotenv

from agents.evaluation_pipeline import EvaluationPipeline
from speech_analysis.metrics import extract_all_metrics
from speech_analysis.utils import NumpyEncoder
from telemetry import logger

load_dotenv(override=True)

pipeline = EvaluationPipeline()

def process_evaluation_job(job_data: dict):
    """Main RQ job handler for evaluating audio"""
    session_id = job_data.get('sessionId')
    user_id = job_data.get('userId')
    topic = job_data.get("topic", "")
    audio_url = job_data.get('audioDownloadUrl')
    callback_url = job_data.get('reportCallbackUrl')
    past_sessions = job_data.get('history', [])

    logger.info(f"Starting evaluation job for session {session_id}", extra={"session_id": session_id, "user_id": user_id})

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
            
        logger.info(f"Audio downloaded to {temp_path}", extra={"session_id": session_id})

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
        logger.info(f"Extracting speech metrics from {wav_path}...", extra={"session_id": session_id})
        metrics = extract_all_metrics(wav_path)
        
        # 3. Evaluate with Gemini
        logger.info(f"Evaluating with Gemini", extra={"session_id": session_id, "metrics_count": len(metrics) if metrics else 0})
        evaluation = pipeline.evaluate(
            metrics=metrics,
            topic=topic,
            history=past_sessions,
        )
        logger.info(f"Gemini evaluation completed", extra={"session_id": session_id, "overallScore": evaluation.get('overallScore')})
        
        # 4. Send results back to Express
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
        
        from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
        
        @retry(
            stop=stop_after_attempt(5),
            wait=wait_exponential(multiplier=2, min=2, max=60),
            retry=retry_if_exception_type(requests.exceptions.RequestException),
            reraise=True
        )
        def deliver_webhook():
            logger.info(f"Sending results to webhook: {callback_url} (attempt)")
            webhook_res = requests.post(
                callback_url,
                json=payload,
                headers={"X-Internal-Service-Key": os.environ.get("INTERNAL_SERVICE_KEY", "")}
            )
            webhook_res.raise_for_status()

        deliver_webhook()
        
        logger.info(f"Job completed successfully for session {session_id}", extra={"session_id": session_id})

    except Exception as e:
        logger.error(f"Job failed for session {session_id}: {e}", exc_info=True, extra={"session_id": session_id})
        try:
            logger.info(f"Sending failure webhook to {callback_url}")
            requests.post(
                callback_url,
                json={
                    "userId": user_id,
                    "sessionId": session_id,
                    "status": "failed",
                    "error": str(e)
                },
                headers={"X-Internal-Service-Key": os.environ.get("INTERNAL_SERVICE_KEY", "")}
            )
        except Exception as webhook_err:
            logger.error(f"Failed to send failure webhook: {webhook_err}")
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

