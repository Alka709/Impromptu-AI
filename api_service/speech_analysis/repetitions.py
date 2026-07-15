"""Repeated word and phrase detection."""

import logging
import re
from collections import Counter
from typing import Any

from speech_analysis.config import MAX_NGRAM_SIZE, MIN_REPETITION_COUNT

logger = logging.getLogger(__name__)


def analyse_repetitions(transcript: str) -> dict[str, Any]:
    """Detect repeated words and phrases in a transcript.

    A word or phrase is flagged as a repetition when it appears at least
    :data:`MIN_REPETITION_COUNT` times *consecutively*.

    Args:
        transcript: Full transcript text.

    Returns:
        Dictionary with ``repetition_count``, ``repeated_words``, and
        ``repeated_phrases``.
    """
    tokens = _tokenize(transcript)
    repeated_words = _find_consecutive_repeats(tokens, n=1)
    repeated_phrases = _find_repeated_phrases(tokens)

    total = sum(r["count"] for r in repeated_words) + sum(
        r["count"] for r in repeated_phrases
    )

    logger.info(
        "Repetition analysis — %d repeated words, %d repeated phrases",
        len(repeated_words),
        len(repeated_phrases),
    )

    return {
        "repetition_count": total,
        "repeated_words": repeated_words,
        "repeated_phrases": repeated_phrases,
    }


def _tokenize(text: str) -> list[str]:
    """Split text into lowercase word tokens.

    Args:
        text: Raw text.

    Returns:
        List of lowercased words.
    """
    return re.findall(r"[a-z']+", text.lower())


def _find_consecutive_repeats(
    tokens: list[str],
    n: int = 1,
) -> list[dict[str, Any]]:
    """Find n-grams repeated consecutively.

    Args:
        tokens: Word token list.
        n: N-gram size (1 for single words).

    Returns:
        List of dicts with ``text`` and ``count``.
    """
    if len(tokens) < n * MIN_REPETITION_COUNT:
        return []

    results: list[dict[str, Any]] = []
    i = 0

    while i <= len(tokens) - n:
        gram = tuple(tokens[i : i + n])
        count = 1
        j = i + n
        while j + n <= len(tokens) and tuple(tokens[j : j + n]) == gram:
            count += 1
            j += n

        if count >= MIN_REPETITION_COUNT:
            text = " ".join(gram)
            results.append({"text": text, "count": count})
            i = j
        else:
            i += 1

    return results


def _find_repeated_phrases(tokens: list[str]) -> list[dict[str, Any]]:
    """Find multi-word phrases repeated consecutively.

    Checks n-gram sizes from 2 to :data:`MAX_NGRAM_SIZE`.

    Args:
        tokens: Word token list.

    Returns:
        List of dicts with ``text`` and ``count``.
    """
    all_repeats: list[dict[str, Any]] = []
    seen_spans: set[tuple[int, int]] = set()

    for n in range(2, MAX_NGRAM_SIZE + 1):
        i = 0
        while i <= len(tokens) - n:
            gram = tuple(tokens[i : i + n])
            count = 1
            j = i + n
            while j + n <= len(tokens) and tuple(tokens[j : j + n]) == gram:
                count += 1
                j += n

            span = (i, j)
            if count >= MIN_REPETITION_COUNT and span not in seen_spans:
                seen_spans.add(span)
                all_repeats.append({"text": " ".join(gram), "count": count})
                i = j
            else:
                i += 1

    return all_repeats
