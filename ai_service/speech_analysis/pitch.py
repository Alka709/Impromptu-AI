"""Pitch / F0 analysis using Parselmouth (Praat)."""

import logging
from typing import Any

import numpy as np
import parselmouth
from parselmouth.praat import call

from speech_analysis.config import PITCH_CEILING, PITCH_FLOOR, SAMPLE_RATE
from speech_analysis.utils import round_val, timed

logger = logging.getLogger(__name__)


@timed
def analyse_pitch(audio: np.ndarray, sample_rate: int = SAMPLE_RATE) -> dict[str, Any]:
    """Extract pitch, jitter, shimmer, and HNR from an audio signal.

    Args:
        audio: Mono audio as a 1-D numpy array.
        sample_rate: Audio sample rate.

    Returns:
        Dictionary with ``average_pitch``, ``min_pitch``, ``max_pitch``,
        ``pitch_variance``, ``jitter``, ``shimmer``, and ``hnr``.
    """
    snd = parselmouth.Sound(audio, sampling_frequency=sample_rate)
    pitch_obj = snd.to_pitch(pitch_floor=PITCH_FLOOR, pitch_ceiling=PITCH_CEILING)

    f0 = _extract_f0(pitch_obj)
    jitter = _compute_jitter(snd)
    shimmer = _compute_shimmer(snd)
    hnr = _compute_hnr(snd)

    result = {
        "average_pitch": round_val(f0["mean"]),
        "min_pitch": round_val(f0["min"]),
        "max_pitch": round_val(f0["max"]),
        "pitch_variance": round_val(f0["variance"]),
        "jitter": round_val(jitter, 4),
        "shimmer": round_val(shimmer, 4),
        "hnr": round_val(hnr),
    }

    logger.info(
        "Pitch analysis — avg=%.1f Hz, jitter=%.4f, shimmer=%.4f, HNR=%.1f dB",
        result["average_pitch"],
        result["jitter"],
        result["shimmer"],
        result["hnr"],
    )
    return result


def _extract_f0(pitch_obj: parselmouth.Pitch) -> dict[str, float]:
    """Extract fundamental frequency statistics from a Pitch object.

    Args:
        pitch_obj: Parselmouth Pitch object.

    Returns:
        Dict with ``mean``, ``min``, ``max``, and ``variance`` of F0.
    """
    f0_values = pitch_obj.selected_array["frequency"]
    voiced = f0_values[f0_values > 0]

    if len(voiced) == 0:
        return {"mean": 0.0, "min": 0.0, "max": 0.0, "variance": 0.0}

    return {
        "mean": float(np.mean(voiced)),
        "min": float(np.min(voiced)),
        "max": float(np.max(voiced)),
        "variance": float(np.std(voiced)),
    }


def _compute_jitter(snd: parselmouth.Sound) -> float:
    """Compute local jitter (cycle-to-cycle frequency perturbation).

    Args:
        snd: Parselmouth Sound object.

    Returns:
        Local jitter as a ratio.
    """
    point_process = call(snd, "To PointProcess (periodic, cc)", PITCH_FLOOR, PITCH_CEILING)
    jitter = call(point_process, "Get jitter (local)", 0, 0, 0.0001, 0.02, 1.3)
    return float(jitter) if not np.isnan(jitter) else 0.0


def _compute_shimmer(snd: parselmouth.Sound) -> float:
    """Compute local shimmer (cycle-to-cycle amplitude perturbation).

    Args:
        snd: Parselmouth Sound object.

    Returns:
        Local shimmer as a ratio.
    """
    point_process = call(snd, "To PointProcess (periodic, cc)", PITCH_FLOOR, PITCH_CEILING)
    shimmer = call(
        [snd, point_process],
        "Get shimmer (local)",
        0,
        0,
        0.0001,
        0.02,
        1.3,
        1.6,
    )
    return float(shimmer) if not np.isnan(shimmer) else 0.0


def _compute_hnr(snd: parselmouth.Sound) -> float:
    """Compute the Harmonics-to-Noise Ratio.

    Args:
        snd: Parselmouth Sound object.

    Returns:
        HNR in dB.
    """
    harmonicity = call(snd, "To Harmonicity (cc)", 0.01, PITCH_FLOOR, 0.1, 1.0)
    hnr = call(harmonicity, "Get mean", 0, 0)
    return float(hnr) if not np.isnan(hnr) else 0.0
