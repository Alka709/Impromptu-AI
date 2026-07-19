"""Speech rate metrics derived from transcript and word timestamps."""

import logging
from typing import Any

from speech_analysis.utils import round_val, safe_divide

logger = logging.getLogger(__name__)


def analyse_speech_rate(
    words: list[dict[str, Any]],
    speech_duration: float,
) -> dict[str, Any]:
    """Compute speech rate metrics from word-level timestamps.

    Args:
        words: List of word dicts with ``word``, ``start``, and ``end`` keys,
            as produced by the Whisper transcriber.
        speech_duration: Total speech (non-silent) duration in seconds.

    Returns:
        Dictionary with ``word_count``, ``wpm``, ``speaking_speed``, and
        ``average_word_duration``.
    """
    word_count = len(words)
    minutes = speech_duration / 60.0

    wpm = round_val(safe_divide(word_count, minutes))
    avg_word_duration = _average_word_duration(words)
    speed_label = _classify_speed(wpm)

    logger.info("Speech rate — %d words, %.0f WPM (%s)", word_count, wpm, speed_label)

    return {
        "word_count": word_count,
        "wpm": wpm,
        "speaking_speed": speed_label,
        "average_word_duration": round_val(avg_word_duration, 3),
    }


def _average_word_duration(words: list[dict[str, Any]]) -> float:
    """Compute the mean duration of individual words.

    Args:
        words: Word dicts with ``start`` and ``end`` keys.

    Returns:
        Average word duration in seconds, or ``0.0`` when the list is empty.
    """
    if not words:
        return 0.0
    durations = [w["end"] - w["start"] for w in words]
    return safe_divide(sum(durations), len(durations))


def _classify_speed(wpm: float) -> str:
    """Map a WPM value to a human-readable speed category.

    Args:
        wpm: Words per minute.

    Returns:
        One of ``"very_slow"``, ``"slow"``, ``"normal"``, ``"fast"``,
        or ``"very_fast"``.
    """
    if wpm < 100:
        return "very_slow"
    if wpm < 120:
        return "slow"
    if wpm <= 160:
        return "normal"
    if wpm <= 190:
        return "fast"
    return "very_fast"
