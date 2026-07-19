"""Voice Activity Detection using Silero VAD."""

import logging
from typing import Any

import numpy as np
import torch

from speech_analysis.config import (
    SAMPLE_RATE,
    VAD_THRESHOLD,
    VAD_MIN_SILENCE_DURATION_MS,
    VAD_MIN_SPEECH_DURATION_MS,
    VAD_WINDOW_SIZE_SAMPLES,
)
from speech_analysis.pauses import analyse_pauses
from speech_analysis.utils import round_val, timed

logger = logging.getLogger(__name__)


@timed
def analyse_vad(audio: np.ndarray, sample_rate: int = SAMPLE_RATE) -> dict[str, Any]:
    """Run Silero VAD on *audio* and return speech / pause metrics.

    Args:
        audio: Mono 16 kHz audio as a 1-D numpy array.
        sample_rate: Audio sample rate (must be 16 000).

    Returns:
        Dictionary containing speech segments, pause metrics, and
        silence / speaking ratios.
    """
    model = _load_model()
    speech_timestamps = _get_speech_timestamps(model, audio, sample_rate)
    speech_segments = _timestamps_to_segments(speech_timestamps, sample_rate)

    audio_duration = len(audio) / sample_rate
    pause_metrics = analyse_pauses(speech_segments, audio_duration)

    pause_metrics["speech_segments"] = speech_segments
    return pause_metrics


def _load_model():
    """Load the Silero VAD model.

    Returns:
        Loaded Silero VAD model.
    """
    model, utils_fns = torch.hub.load(
        repo_or_dir="snakers4/silero-vad",
        model="silero_vad",
        force_reload=False,
        trust_repo=True,
    )
    logger.info("Silero VAD model loaded")
    return model


def _get_speech_timestamps(
    model,
    audio: np.ndarray,
    sample_rate: int,
) -> list[dict[str, int]]:
    """Extract speech timestamp ranges using the Silero model.

    Args:
        model: Loaded Silero VAD model.
        audio: 1-D numpy array.
        sample_rate: Audio sample rate.

    Returns:
        List of dicts with ``start`` and ``end`` sample indices.
    """
    from silero_vad import get_speech_timestamps  # type: ignore[import-untyped]

    tensor = torch.from_numpy(audio).float()
    timestamps = get_speech_timestamps(
        tensor,
        model,
        sampling_rate=sample_rate,
        threshold=VAD_THRESHOLD,
        min_speech_duration_ms=VAD_MIN_SPEECH_DURATION_MS,
        min_silence_duration_ms=VAD_MIN_SILENCE_DURATION_MS,
        window_size_samples=VAD_WINDOW_SIZE_SAMPLES,
    )
    logger.info("Detected %d speech segments", len(timestamps))
    return timestamps


def _timestamps_to_segments(
    timestamps: list[dict[str, int]],
    sample_rate: int,
) -> list[dict[str, float]]:
    """Convert sample-index timestamps to second-based segments.

    Args:
        timestamps: Raw Silero timestamps (sample indices).
        sample_rate: Audio sample rate.

    Returns:
        List of ``{"start": float, "end": float}`` in seconds.
    """
    return [
        {
            "start": round_val(ts["start"] / sample_rate),
            "end": round_val(ts["end"] / sample_rate),
        }
        for ts in timestamps
    ]
