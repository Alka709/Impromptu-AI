"""Filler word detection and counting."""

import logging
import re
from typing import Any

from speech_analysis.config import DEFAULT_FILLER_WORDS
from speech_analysis.utils import round_val, safe_divide

logger = logging.getLogger(__name__)


def analyse_fillers(
    transcript: str,
    word_count: int,
    filler_words: list[str] | None = None,
) -> dict[str, Any]:
    """Count filler word occurrences in a transcript.

    Multi-word fillers (e.g. ``"you know"``) are matched as phrases.
    Single-word fillers are matched as whole words.

    Args:
        transcript: Full transcript text.
        word_count: Total word count (used for frequency calculation).
        filler_words: Optional custom filler list.  Defaults to
            :data:`DEFAULT_FILLER_WORDS`.

    Returns:
        Dictionary with ``filler_count``, ``filler_frequency``, and
        ``fillers`` (per-word breakdown).
    """
    fillers = filler_words or DEFAULT_FILLER_WORDS
    text_lower = transcript.lower()
    counts: dict[str, int] = {}

    for filler in fillers:
        count = _count_filler(text_lower, filler)
        if count > 0:
            counts[filler] = count

    total = sum(counts.values())
    frequency = safe_divide(total, word_count)

    logger.info("Filler analysis — %d total fillers (%.3f per word)", total, frequency)

    return {
        "filler_count": total,
        "filler_frequency": round_val(frequency, 3),
        "fillers": counts,
    }


def _count_filler(text: str, filler: str) -> int:
    """Count whole-word or whole-phrase occurrences of *filler* in *text*.

    Args:
        text: Lowercased transcript.
        filler: The filler word or phrase to search for.

    Returns:
        Number of matches.
    """
    pattern = r"\b" + re.escape(filler) + r"\b"
    return len(re.findall(pattern, text))
