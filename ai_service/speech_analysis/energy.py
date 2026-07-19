"""Energy / loudness analysis using librosa."""

import logging
from typing import Any

import librosa
import numpy as np

from speech_analysis.config import SAMPLE_RATE
from speech_analysis.utils import round_val, safe_divide, timed

logger = logging.getLogger(__name__)


@timed
def analyse_energy(audio: np.ndarray, sample_rate: int = SAMPLE_RATE) -> dict[str, Any]:
    """Compute RMS energy metrics for an audio signal.

    Args:
        audio: Mono audio as a 1-D numpy array.
        sample_rate: Audio sample rate.

    Returns:
        Dictionary with ``energy_mean``, ``energy_peak``, ``energy_variance``,
        and ``volume_stability``.
    """
    rms = _compute_rms(audio)

    mean_energy = float(np.mean(rms))
    peak_energy = float(np.max(rms))
    energy_var = float(np.var(rms))
    stability = _volume_stability(rms)

    logger.info(
        "Energy analysis — mean=%.4f, peak=%.4f, var=%.4f, stability=%.2f",
        mean_energy,
        peak_energy,
        energy_var,
        stability,
    )

    return {
        "energy_mean": round_val(mean_energy, 4),
        "energy_peak": round_val(peak_energy, 4),
        "energy_variance": round_val(energy_var, 4),
        "volume_stability": round_val(stability),
    }


def _compute_rms(audio: np.ndarray) -> np.ndarray:
    """Compute frame-level RMS energy.

    Args:
        audio: 1-D audio array.

    Returns:
        1-D RMS energy array.
    """
    rms = librosa.feature.rms(y=audio)[0]
    return rms


def _volume_stability(rms: np.ndarray) -> float:
    """Compute a 0–1 stability score from RMS energy.

    Stability is defined as ``1 - coefficient_of_variation`` clamped to
    [0, 1].  A perfectly constant signal scores 1.0.

    Args:
        rms: 1-D RMS energy array.

    Returns:
        Stability score between 0 and 1.
    """
    mean = float(np.mean(rms))
    std = float(np.std(rms))
    cv = safe_divide(std, mean)
    return float(np.clip(1.0 - cv, 0.0, 1.0))
