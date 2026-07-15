"""Pronunciation analysis abstraction layer.

This module provides a pluggable interface for pronunciation scoring.
The default implementation returns placeholder scores.  Replace or extend
:class:`PronunciationAnalyzer` with a concrete backend when a scoring
service is available.
"""

import logging
from abc import ABC, abstractmethod
from typing import Any

from speech_analysis.utils import round_val

logger = logging.getLogger(__name__)


class PronunciationBackend(ABC):
    """Abstract base class for pronunciation scoring backends."""

    @abstractmethod
    def score(self, audio_path: str, transcript: str) -> dict[str, float]:
        """Return pronunciation and fluency scores.

        Args:
            audio_path: Path to the audio file.
            transcript: Reference transcript text.

        Returns:
            Dict with at least ``pronunciation_score`` and ``fluency_score``,
            each normalised to 0–10.
        """


class PlaceholderBackend(PronunciationBackend):
    """Stub backend that returns neutral scores.

    Replace this with a real implementation backed by:
    - Azure Speech Services pronunciation assessment
    - Speechace API
    - A local forced-alignment model

    TODO: Integrate Azure Speech SDK for production pronunciation scoring.
        See https://learn.microsoft.com/en-us/azure/ai-services/speech-service/
        how-to-pronunciation-assessment
    TODO: Alternatively integrate Speechace API.
        See https://www.speechace.com/docs/
    """

    def score(self, audio_path: str, transcript: str) -> dict[str, float]:
        """Return default placeholder scores.

        Args:
            audio_path: Unused in the placeholder.
            transcript: Unused in the placeholder.

        Returns:
            Dict with ``pronunciation_score`` and ``fluency_score`` set to
            neutral values.
        """
        logger.warning(
            "Using placeholder pronunciation backend — "
            "scores are not meaningful. Integrate a real backend for production."
        )
        return {
            "pronunciation_score": 7.0,
            "fluency_score": 7.0,
        }


class PronunciationAnalyzer:
    """High-level pronunciation analyser with a pluggable backend.

    Args:
        backend: An instance of :class:`PronunciationBackend`.
            Defaults to :class:`PlaceholderBackend`.

    Example::

        # Default (placeholder) usage
        analyzer = PronunciationAnalyzer()
        result = analyzer.analyse("speech.wav", "Hello world")

        # With a real backend
        azure = AzureBackend(subscription_key="...", region="eastus")
        analyzer = PronunciationAnalyzer(backend=azure)
    """

    def __init__(self, backend: PronunciationBackend | None = None) -> None:
        self._backend = backend or PlaceholderBackend()

    def analyse(self, audio_path: str, transcript: str) -> dict[str, Any]:
        """Run pronunciation analysis and return scored results.

        Args:
            audio_path: Path to the audio file.
            transcript: Reference transcript.

        Returns:
            Dictionary with ``pronunciation_score`` and ``fluency_score``.
        """
        scores = self._backend.score(audio_path, transcript)
        return {
            "pronunciation_score": round_val(scores["pronunciation_score"]),
            "fluency_score": round_val(scores["fluency_score"]),
        }
