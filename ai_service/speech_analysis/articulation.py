"""Composite articulation score derived from multiple speech metrics.

Scoring Formula
===============
The articulation score is a weighted sum of normalised sub-scores, each
mapped to a 0–10 scale:

    articulation = (
        w_pronunciation × pronunciation_score
      + w_wpm          × wpm_score
      + w_pause        × pause_score
      + w_repetition   × repetition_score
      + w_filler       × filler_score
    )

Sub-score definitions
---------------------
* **pronunciation_score** — Directly from the pronunciation analyser (0–10).
* **wpm_score** — Peaks at 10 when WPM is within the ideal range
  (120–160 WPM by default) and decays linearly outside that range.
* **pause_score** — ``10 × (1 − silence_ratio)``.  Less silence → higher
  score.
* **repetition_score** — ``max(0, 10 − repetition_count)``.  Fewer
  repetitions → higher score.
* **filler_score** — ``max(0, 10 − 2 × filler_count)``.  Fewer fillers →
  higher score.

Default weights (see :class:`config.ArticulationWeights`):

    pronunciation=0.30, wpm=0.20, pause_ratio=0.20,
    repetition=0.15, filler=0.15
"""

import logging
from typing import Any

from speech_analysis.config import (
    ARTICULATION_WEIGHTS,
    IDEAL_WPM_HIGH,
    IDEAL_WPM_LOW,
    ArticulationWeights,
)
from speech_analysis.utils import round_val

logger = logging.getLogger(__name__)


def compute_articulation_score(
    pronunciation_score: float,
    wpm: float,
    silence_ratio: float,
    repetition_count: int,
    filler_count: int,
    weights: ArticulationWeights = ARTICULATION_WEIGHTS,
) -> dict[str, Any]:
    """Compute a normalised articulation score (0–10).

    Args:
        pronunciation_score: Pronunciation score on a 0–10 scale.
        wpm: Words per minute.
        silence_ratio: Fraction of audio that is silence (0–1).
        repetition_count: Total consecutive repetition occurrences.
        filler_count: Total filler word occurrences.
        weights: Component weights (must sum to 1.0).

    Returns:
        Dictionary with ``articulation_score`` and component breakdown.
    """
    wpm_score = _score_wpm(wpm)
    pause_score = _score_pause_ratio(silence_ratio)
    repetition_score = _score_repetitions(repetition_count)
    filler_score = _score_fillers(filler_count)

    articulation = (
        weights.pronunciation * pronunciation_score
        + weights.wpm * wpm_score
        + weights.pause_ratio * pause_score
        + weights.repetition * repetition_score
        + weights.filler * filler_score
    )

    articulation = float(max(0.0, min(10.0, articulation)))

    logger.info(
        "Articulation score=%.1f  (pron=%.1f wpm=%.1f pause=%.1f rep=%.1f fill=%.1f)",
        articulation,
        pronunciation_score,
        wpm_score,
        pause_score,
        repetition_score,
        filler_score,
    )

    return {
        "articulation_score": round_val(articulation),
        "articulation_breakdown": {
            "pronunciation_component": round_val(pronunciation_score),
            "wpm_component": round_val(wpm_score),
            "pause_component": round_val(pause_score),
            "repetition_component": round_val(repetition_score),
            "filler_component": round_val(filler_score),
        },
    }


def _score_wpm(wpm: float) -> float:
    """Map WPM to a 0–10 score peaking in the ideal range.

    Args:
        wpm: Words per minute.

    Returns:
        Score between 0 and 10.
    """
    if IDEAL_WPM_LOW <= wpm <= IDEAL_WPM_HIGH:
        return 10.0
    if wpm < IDEAL_WPM_LOW:
        return max(0.0, 10.0 - (IDEAL_WPM_LOW - wpm) * 0.15)
    return max(0.0, 10.0 - (wpm - IDEAL_WPM_HIGH) * 0.15)


def _score_pause_ratio(silence_ratio: float) -> float:
    """Convert silence ratio to a 0–10 score.

    Args:
        silence_ratio: Fraction of audio that is silence.

    Returns:
        Score between 0 and 10.
    """
    return max(0.0, min(10.0, 10.0 * (1.0 - silence_ratio)))


def _score_repetitions(count: int) -> float:
    """Score based on repetition count.

    Args:
        count: Number of repetition occurrences.

    Returns:
        Score between 0 and 10.
    """
    return max(0.0, 10.0 - float(count))


def _score_fillers(count: int) -> float:
    """Score based on filler count.

    Args:
        count: Number of filler words detected.

    Returns:
        Score between 0 and 10.
    """
    return max(0.0, 10.0 - 2.0 * float(count))
