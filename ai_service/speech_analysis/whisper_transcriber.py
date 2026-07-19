"""Transcription using Faster Whisper."""

import logging
from typing import Any

from faster_whisper import WhisperModel

from speech_analysis.config import WHISPER_COMPUTE_TYPE, WHISPER_DEVICE, WHISPER_MODEL_SIZE
from speech_analysis.utils import round_val, timed

logger = logging.getLogger(__name__)


@timed
def transcribe(audio_path: str) -> dict[str, Any]:
    """Transcribe an audio file with Faster Whisper and return structured data.

    Args:
        audio_path: Path to a ``.wav`` file (any sample rate accepted by
            Faster Whisper).

    Returns:
        Dictionary with keys ``transcript``, ``words``, ``language``,
        and ``language_probability``.
    """
    model = _load_model()
    segments_gen, info = model.transcribe(
        audio_path,
        language="en",
        task="transcribe",
        beam_size=5,
        word_timestamps=True,
        vad_filter=True,
    )

    words: list[dict[str, Any]] = []
    transcript_parts: list[str] = []

    for segment in segments_gen:
        transcript_parts.append(segment.text.strip())
        if segment.words:
            for w in segment.words:
                words.append(
                    {
                        "word": w.word.strip(),
                        "start": round_val(w.start, 3),
                        "end": round_val(w.end, 3),
                        "probability": round_val(w.probability, 3),
                    }
                )

    transcript = " ".join(transcript_parts)
    logger.info(
        "Transcription complete — %d words, language=%s (%.2f)",
        len(words),
        info.language,
        info.language_probability,
    )

    return {
        "transcript": transcript,
        "words": words,
        "language": info.language,
        "language_probability": round_val(info.language_probability, 3),
    }


def _load_model() -> WhisperModel:
    """Instantiate the Faster Whisper model.

    Returns:
        A ``WhisperModel`` instance.
    """
    logger.info(
        "Loading Faster Whisper model=%s device=%s compute=%s",
        WHISPER_MODEL_SIZE,
        WHISPER_DEVICE,
        WHISPER_COMPUTE_TYPE,
    )
    return WhisperModel(
        WHISPER_MODEL_SIZE,
        device=WHISPER_DEVICE,
        compute_type=WHISPER_COMPUTE_TYPE,
    )
