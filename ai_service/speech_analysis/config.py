"""Centralized configuration for the speech analysis package."""

from dataclasses import dataclass, field


SAMPLE_RATE: int = 16_000

MAX_WORKERS: int = 4

WHISPER_MODEL_SIZE: str = "base"
WHISPER_DEVICE: str = "cpu"
WHISPER_COMPUTE_TYPE: str = "int8"

VAD_THRESHOLD: float = 0.5
VAD_MIN_SPEECH_DURATION_MS: int = 250
VAD_MIN_SILENCE_DURATION_MS: int = 100
VAD_WINDOW_SIZE_SAMPLES: int = 512

SHORT_PAUSE_MAX: float = 0.5
MEDIUM_PAUSE_MAX: float = 1.5

DEFAULT_FILLER_WORDS: list[str] = [
    "um",
    "uh",
    "like",
    "actually",
    "basically",
    "literally",
    "you know",
    "so",
]

MIN_REPETITION_COUNT: int = 2
MAX_NGRAM_SIZE: int = 5

PITCH_FLOOR: float = 75.0
PITCH_CEILING: float = 600.0


@dataclass(frozen=True)
class ArticulationWeights:
    """Weights for articulation score components.

    Each weight controls how much a given sub-metric contributes to the
    final articulation score (0–10 scale).  Weights must sum to 1.0.
    """

    pronunciation: float = 0.30
    wpm: float = 0.20
    pause_ratio: float = 0.20
    repetition: float = 0.15
    filler: float = 0.15


ARTICULATION_WEIGHTS: ArticulationWeights = ArticulationWeights()

IDEAL_WPM_LOW: int = 120
IDEAL_WPM_HIGH: int = 160
