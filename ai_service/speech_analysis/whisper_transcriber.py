"""Transcription using Groq Whisper API (OpenAI Compatible)."""

import os
import logging
from typing import Any
from openai import OpenAI

from speech_analysis.utils import round_val, timed

logger = logging.getLogger(__name__)

client = None
api_key = os.environ.get("GROQ_API_KEY") or os.environ.get("OPENAI_API_KEY")
if api_key:
    client = OpenAI(
        api_key=api_key,
        base_url="https://api.groq.com/openai/v1"
    )

@timed
def transcribe(audio_path: str) -> dict[str, Any]:
    """Transcribe an audio file with Whisper API and return structured data.

    Args:
        audio_path: Path to a ``.wav`` file.

    Returns:
        Dictionary with keys ``transcript``, ``words``, ``language``,
        and ``language_probability``.
    """
    if not client:
        logger.error("API key is missing, cannot transcribe")
        return {"transcript": "", "words": [], "language": "en", "language_probability": 1.0}

    logger.info("Transcribing via Groq Whisper API")
    with open(audio_path, "rb") as audio_file:
        transcription = client.audio.transcriptions.create(
            model="whisper-large-v3-turbo",
            file=audio_file,
            response_format="verbose_json",
            timestamp_granularities=["word"]
        )
    
    words: list[dict[str, Any]] = []
    
    word_data = getattr(transcription, "words", [])
    
    for w in word_data:
        words.append(
            {
                "word": w.word.strip(),
                "start": round_val(w.start, 3),
                "end": round_val(w.end, 3),
                "probability": 1.0,
            }
        )

    logger.info("Transcription complete — %d words", len(words))

    return {
        "transcript": transcription.text,
        "words": words,
        "language": getattr(transcription, "language", "en"),
        "language_probability": 1.0,
    }
