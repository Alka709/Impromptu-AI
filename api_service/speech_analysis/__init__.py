"""Speakly speech analysis package.

Provides deterministic speech metric extraction from WAV audio files.
The primary entry point is :func:`metrics.extract_all_metrics`.

Example::

    from speech_analysis.metrics import extract_all_metrics

    result = extract_all_metrics("recording.wav")
"""

from speech_analysis.metrics import extract_all_metrics

__all__ = ["extract_all_metrics"]
__version__ = "0.1.0"
