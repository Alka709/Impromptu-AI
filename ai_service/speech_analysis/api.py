"""FastAPI microservice for the speech analysis package."""

import logging
import os
import shutil
import tempfile
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from speech_analysis.metrics import extract_all_metrics
from speech_analysis.utils import NumpyEncoder
import json

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Speakly Audio Analysis API",
    description="Extracts deterministic speech metrics from uploaded WAV files.",
    version="0.1.0",
)


class NumpyJSONResponse(JSONResponse):
    """Custom JSONResponse that uses NumpyEncoder to handle numpy types."""

    def render(self, content: Any) -> bytes:
        return json.dumps(
            content,
            ensure_ascii=False,
            allow_nan=False,
            indent=None,
            separators=(",", ":"),
            cls=NumpyEncoder,
        ).encode("utf-8")


@app.post("/analyze", response_class=NumpyJSONResponse)
async def analyze_audio(file: UploadFile = File(...)):
    """Upload a WAV file and get the extracted speech metrics.
    
    The file is saved to a temporary location, analyzed in parallel, 
    and then cleaned up automatically.
    """
    if not file.filename or not file.filename.lower().endswith(".wav"):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only .wav files are supported.",
        )

    # Create a temporary file to store the uploaded audio
    temp_fd, temp_path = tempfile.mkstemp(suffix=".wav")
    os.close(temp_fd)  # Close the file descriptor so python can open it
    
    try:
        # Save the uploaded file to the temporary path
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        logger.info(f"Saved upload {file.filename} to {temp_path}")
        
        # Run the parallel metrics extraction
        metrics = extract_all_metrics(temp_path)
        
        return metrics
        
    except Exception as e:
        logger.exception("Failed to process audio")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
        
    finally:
        # Always clean up the temporary file
        if os.path.exists(temp_path):
            os.remove(temp_path)
            logger.info(f"Cleaned up temporary file {temp_path}")


if __name__ == "__main__":
    import uvicorn
    # Run the server locally on port 8000
    uvicorn.run("speech_analysis.api:app", host="0.0.0.0", port=8000, reload=True)
