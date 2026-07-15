"""Pause detection and classification from speech segments."""

import logging
from typing import Any

from speech_analysis.config import SHORT_PAUSE_MAX, MEDIUM_PAUSE_MAX
from speech_analysis.utils import round_val, safe_divide

logger = logging.getLogger(__name__)


def analyse_pauses(
    speech_segments: list[dict[str, float]],
    audio_duration: float,
) -> dict[str, Any]:
    """Compute pause metrics from a list of speech segments.

    Args:
        speech_segments: Ordered list of ``{"start": float, "end": float}``
            dicts representing voiced intervals.
        audio_duration: Total audio duration in seconds.

    Returns:
        Dictionary with pause count, durations, averages, classifications,
        silence ratio, and speaking ratio.
    """
    pauses = _extract_pauses(speech_segments, audio_duration)
    durations = [p["duration"] for p in pauses]

    total_pause = sum(durations)
    speech_duration = audio_duration - total_pause

    short = [d for d in durations if d <= SHORT_PAUSE_MAX]
    medium = [d for d in durations if SHORT_PAUSE_MAX < d <= MEDIUM_PAUSE_MAX]
    long = [d for d in durations if d > MEDIUM_PAUSE_MAX]

    return {
        "pause_count": len(pauses),
        "pause_duration": round_val(total_pause),
        "average_pause": round_val(safe_divide(total_pause, len(pauses))),
        "longest_pause": round_val(max(durations)) if durations else 0.0,
        "short_pause_count": len(short),
        "medium_pause_count": len(medium),
        "long_pause_count": len(long),
        "silence_ratio": round_val(safe_divide(total_pause, audio_duration)),
        "speaking_ratio": round_val(safe_divide(speech_duration, audio_duration)),
        "speech_duration": round_val(speech_duration),
        "audio_duration": round_val(audio_duration),
        "pauses": pauses,
    }


def _extract_pauses(
    segments: list[dict[str, float]],
    audio_duration: float,
) -> list[dict[str, Any]]:
    """Derive pause intervals from gaps between speech segments.

    Args:
        segments: Voiced intervals sorted by start time.
        audio_duration: Total audio length in seconds.

    Returns:
        List of pause dicts with start, end, duration, and category.
    """
    if not segments:
        return []

    pauses: list[dict[str, Any]] = []

    if segments[0]["start"] > 0:
        _append_pause(pauses, 0.0, segments[0]["start"])

    for i in range(1, len(segments)):
        gap_start = segments[i - 1]["end"]
        gap_end = segments[i]["start"]
        if gap_end > gap_start:
            _append_pause(pauses, gap_start, gap_end)

    if segments[-1]["end"] < audio_duration:
        _append_pause(pauses, segments[-1]["end"], audio_duration)

    return pauses


def _classify_pause(duration: float) -> str:
    """Classify a pause by its duration.

    Args:
        duration: Pause length in seconds.

    Returns:
        One of ``"short"``, ``"medium"``, or ``"long"``.
    """
    if duration <= SHORT_PAUSE_MAX:
        return "short"
    if duration <= MEDIUM_PAUSE_MAX:
        return "medium"
    return "long"


def _append_pause(
    pauses: list[dict[str, Any]],
    start: float,
    end: float,
) -> None:
    """Create a pause dict and append it to *pauses*.

    Args:
        pauses: Accumulator list.
        start: Pause start in seconds.
        end: Pause end in seconds.
    """
    duration = end - start
    pauses.append(
        {
            "start": round_val(start),
            "end": round_val(end),
            "duration": round_val(duration),
            "category": _classify_pause(duration),
        }
    )
