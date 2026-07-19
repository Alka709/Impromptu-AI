"""Parallel metrics orchestrator — single entry point for full speech analysis.

Execution Levels
================
The orchestrator schedules independent modules in parallel using a
:class:`~concurrent.futures.ThreadPoolExecutor`, respecting the following
dependency graph:

    Level 1 (parallel):  VAD · Whisper · Pitch · Energy
    Level 2 (parallel):  Speech Rate · Fillers · Repetitions · Pronunciation
                         (all depend on Whisper output)
    Level 3 (serial):    Articulation
                         (depends on Level 1 + Level 2 results)
    Level 4:             Merge all metrics

If any module raises an exception it is logged and skipped.  The final
output includes an ``"errors"`` list describing every failed module so
downstream consumers can decide how to handle partial data.
"""

import logging
import traceback
from concurrent.futures import Future, ThreadPoolExecutor
from typing import Any

from speech_analysis.articulation import compute_articulation_score
from speech_analysis.audio_loader import load_audio
from speech_analysis.config import MAX_WORKERS
from speech_analysis.energy import analyse_energy
from speech_analysis.fillers import analyse_fillers
from speech_analysis.pitch import analyse_pitch
from speech_analysis.pronunciation import PronunciationAnalyzer
from speech_analysis.repetitions import analyse_repetitions
from speech_analysis.speech_rate import analyse_speech_rate
from speech_analysis.utils import timed
from speech_analysis.vad import analyse_vad
from speech_analysis.whisper_transcriber import transcribe

logger = logging.getLogger(__name__)


@timed
def extract_all_metrics(
    audio_path: str,
    max_workers: int = MAX_WORKERS,
) -> dict[str, Any]:
    """Analyse a speech recording and return a unified metrics dictionary.

    Independent analysis modules execute in parallel to minimise total
    latency.  Modules that fail are logged and excluded from the result;
    an ``"errors"`` key lists every failed module name and traceback.

    Args:
        audio_path: Path to a ``.wav`` file.
        max_workers: Maximum thread-pool workers.

    Returns:
        Dictionary containing all successfully extracted speech metrics
        and an ``"errors"`` list (empty when everything succeeds).
    """
    errors: list[dict[str, str]] = []

    audio, sr = load_audio(audio_path)

    with ThreadPoolExecutor(max_workers=max_workers) as pool:
        # ── Level 1 — independent, audio-only modules ────────────────
        vad_future = pool.submit(analyse_vad, audio, sr)
        whisper_future = pool.submit(transcribe, audio_path)
        pitch_future = pool.submit(analyse_pitch, audio, sr)
        energy_future = pool.submit(analyse_energy, audio, sr)

        vad_metrics = _collect(vad_future, "vad", errors)
        whisper_result = _collect(whisper_future, "whisper", errors)
        pitch_metrics = _collect(pitch_future, "pitch", errors)
        energy_metrics = _collect(energy_future, "energy", errors)

        # ── Level 2 — depend on Whisper transcript ───────────────────
        transcript = whisper_result.get("transcript", "") if whisper_result else ""
        words = whisper_result.get("words", []) if whisper_result else []
        speech_duration = vad_metrics.get("speech_duration", 0.0) if vad_metrics else 0.0

        rate_future = pool.submit(analyse_speech_rate, words, speech_duration)
        filler_future = pool.submit(analyse_fillers, transcript, len(words))
        repetition_future = pool.submit(analyse_repetitions, transcript)

        pronunciation_analyzer = PronunciationAnalyzer()
        pronunciation_future = pool.submit(
            pronunciation_analyzer.analyse, audio_path, transcript,
        )

        rate_metrics = _collect(rate_future, "speech_rate", errors)
        filler_metrics = _collect(filler_future, "fillers", errors)
        repetition_metrics = _collect(repetition_future, "repetitions", errors)
        pronunciation_metrics = _collect(pronunciation_future, "pronunciation", errors)

    # ── Level 3 — articulation (serial, depends on Levels 1 + 2) ─────
    articulation_metrics = _run_articulation(
        vad_metrics, rate_metrics, filler_metrics,
        repetition_metrics, pronunciation_metrics, errors,
    )

    # ── Level 4 — merge ──────────────────────────────────────────────
    merged = _merge_metrics(
        vad=vad_metrics,
        whisper=whisper_result,
        rate=rate_metrics,
        energy=energy_metrics,
        pitch=pitch_metrics,
        fillers=filler_metrics,
        repetitions=repetition_metrics,
        pronunciation=pronunciation_metrics,
        articulation=articulation_metrics,
    )
    merged["errors"] = errors

    if errors:
        logger.warning(
            "Completed with %d module error(s): %s",
            len(errors),
            [e["module"] for e in errors],
        )
    else:
        logger.info("All metrics extracted successfully")

    return merged


# ── Internal helpers ─────────────────────────────────────────────────────


def _collect(
    future: Future,
    module_name: str,
    errors: list[dict[str, str]],
) -> dict[str, Any] | None:
    """Safely collect the result of a submitted future.

    On failure the exception is logged and appended to *errors*, and
    ``None`` is returned so downstream code can degrade gracefully.

    Args:
        future: A :class:`~concurrent.futures.Future`.
        module_name: Human-readable name for error reporting.
        errors: Accumulator for error dicts.

    Returns:
        Module result dictionary, or ``None`` on failure.
    """
    try:
        return future.result()
    except Exception:
        tb = traceback.format_exc()
        logger.exception("Module '%s' failed", module_name)
        errors.append({"module": module_name, "error": tb})
        return None


def _run_articulation(
    vad: dict[str, Any] | None,
    rate: dict[str, Any] | None,
    fillers: dict[str, Any] | None,
    repetitions: dict[str, Any] | None,
    pronunciation: dict[str, Any] | None,
    errors: list[dict[str, str]],
) -> dict[str, Any] | None:
    """Compute articulation score, tolerating missing upstream data.

    Args:
        vad: VAD metrics or ``None``.
        rate: Speech-rate metrics or ``None``.
        fillers: Filler metrics or ``None``.
        repetitions: Repetition metrics or ``None``.
        pronunciation: Pronunciation metrics or ``None``.
        errors: Accumulator for error dicts.

    Returns:
        Articulation metrics dict, or ``None`` on failure.
    """
    try:
        return compute_articulation_score(
            pronunciation_score=(
                pronunciation.get("pronunciation_score", 0.0) if pronunciation else 0.0
            ),
            wpm=rate.get("wpm", 0.0) if rate else 0.0,
            silence_ratio=vad.get("silence_ratio", 0.0) if vad else 0.0,
            repetition_count=(
                repetitions.get("repetition_count", 0) if repetitions else 0
            ),
            filler_count=fillers.get("filler_count", 0) if fillers else 0,
        )
    except Exception:
        tb = traceback.format_exc()
        logger.exception("Module 'articulation' failed")
        errors.append({"module": "articulation", "error": tb})
        return None


def _safe_get(data: dict[str, Any] | None, key: str, default: Any = None) -> Any:
    """Retrieve a key from *data*, returning *default* when data is ``None``.

    Args:
        data: Source dictionary or ``None``.
        key: Key to look up.
        default: Fallback value.

    Returns:
        The value or *default*.
    """
    if data is None:
        return default
    return data.get(key, default)


def _merge_metrics(
    vad: dict[str, Any] | None,
    whisper: dict[str, Any] | None,
    rate: dict[str, Any] | None,
    energy: dict[str, Any] | None,
    pitch: dict[str, Any] | None,
    fillers: dict[str, Any] | None,
    repetitions: dict[str, Any] | None,
    pronunciation: dict[str, Any] | None,
    articulation: dict[str, Any] | None,
) -> dict[str, Any]:
    """Flatten and merge all sub-module outputs into one dictionary.

    Any module that returned ``None`` (failed) is represented by
    sensible defaults so the output shape stays consistent.

    Args:
        vad: Output from :func:`vad.analyse_vad`.
        whisper: Output from :func:`whisper_transcriber.transcribe`.
        rate: Output from :func:`speech_rate.analyse_speech_rate`.
        energy: Output from :func:`energy.analyse_energy`.
        pitch: Output from :func:`pitch.analyse_pitch`.
        fillers: Output from :func:`fillers.analyse_fillers`.
        repetitions: Output from :func:`repetitions.analyse_repetitions`.
        pronunciation: Output from :class:`pronunciation.PronunciationAnalyzer`.
        articulation: Output from :func:`articulation.compute_articulation_score`.

    Returns:
        Single flat dictionary with all metrics.
    """
    g = _safe_get
    return {
        # Transcript
        "transcript": g(whisper, "transcript", ""),
        "language": g(whisper, "language", ""),
        "language_probability": g(whisper, "language_probability", 0.0),
        "words": g(whisper, "words", []),
        # Timing
        "speech_duration": g(vad, "speech_duration", 0.0),
        "audio_duration": g(vad, "audio_duration", 0.0),
        # Pauses
        "pause_count": g(vad, "pause_count", 0),
        "pause_duration": g(vad, "pause_duration", 0.0),
        "average_pause": g(vad, "average_pause", 0.0),
        "longest_pause": g(vad, "longest_pause", 0.0),
        "short_pause_count": g(vad, "short_pause_count", 0),
        "medium_pause_count": g(vad, "medium_pause_count", 0),
        "long_pause_count": g(vad, "long_pause_count", 0),
        "silence_ratio": g(vad, "silence_ratio", 0.0),
        "speaking_ratio": g(vad, "speaking_ratio", 0.0),
        "speech_segments": g(vad, "speech_segments", []),
        "pauses": g(vad, "pauses", []),
        # Speech rate
        "word_count": g(rate, "word_count", 0),
        "wpm": g(rate, "wpm", 0.0),
        "speaking_speed": g(rate, "speaking_speed", ""),
        "average_word_duration": g(rate, "average_word_duration", 0.0),
        # Energy
        "energy_mean": g(energy, "energy_mean", 0.0),
        "energy_peak": g(energy, "energy_peak", 0.0),
        "energy_variance": g(energy, "energy_variance", 0.0),
        "volume_stability": g(energy, "volume_stability", 0.0),
        # Pitch
        "average_pitch": g(pitch, "average_pitch", 0.0),
        "min_pitch": g(pitch, "min_pitch", 0.0),
        "max_pitch": g(pitch, "max_pitch", 0.0),
        "pitch_variance": g(pitch, "pitch_variance", 0.0),
        "jitter": g(pitch, "jitter", 0.0),
        "shimmer": g(pitch, "shimmer", 0.0),
        "hnr": g(pitch, "hnr", 0.0),
        # Fillers
        "filler_count": g(fillers, "filler_count", 0),
        "filler_frequency": g(fillers, "filler_frequency", 0.0),
        "fillers": g(fillers, "fillers", {}),
        # Repetitions
        "repetition_count": g(repetitions, "repetition_count", 0),
        "repeated_words": g(repetitions, "repeated_words", []),
        "repeated_phrases": g(repetitions, "repeated_phrases", []),
        # Pronunciation
        "pronunciation_score": g(pronunciation, "pronunciation_score", 0.0),
        "fluency_score": g(pronunciation, "fluency_score", 0.0),
        # Articulation
        "articulation_score": g(articulation, "articulation_score", 0.0),
        "articulation_breakdown": g(articulation, "articulation_breakdown", {}),
    }
