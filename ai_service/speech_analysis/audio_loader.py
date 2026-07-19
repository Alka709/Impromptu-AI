"""Audio loading, validation, and preprocessing."""

import logging
from pathlib import Path

import numpy as np
import torch
import torchaudio

from speech_analysis.config import SAMPLE_RATE

logger = logging.getLogger(__name__)


def load_audio(path: str | Path) -> tuple[np.ndarray, int]:
    """Load a WAV file and return a preprocessed numpy array at 16 kHz mono.

    The function validates the file, converts stereo to mono if needed,
    and resamples to the target sample rate.

    Args:
        path: Path to the ``.wav`` file.

    Returns:
        A tuple of (audio_samples, sample_rate).

    Raises:
        FileNotFoundError: If the file does not exist.
        ValueError: If the file is not a ``.wav`` file or is empty.
    """
    path = Path(path)
    _validate_path(path)

    waveform, sr = torchaudio.load(str(path))
    logger.info("Loaded %s — shape=%s, sr=%d", path.name, waveform.shape, sr)

    waveform = _to_mono(waveform)
    waveform = _resample(waveform, sr, SAMPLE_RATE)

    audio_np = waveform.squeeze(0).numpy()
    logger.info("Preprocessed audio — samples=%d, sr=%d", len(audio_np), SAMPLE_RATE)
    return audio_np, SAMPLE_RATE


def _validate_path(path: Path) -> None:
    """Check that *path* points to an existing WAV file.

    Args:
        path: File path to validate.

    Raises:
        FileNotFoundError: If the path does not exist.
        ValueError: If the extension is not ``.wav``.
    """
    if not path.exists():
        raise FileNotFoundError(f"Audio file not found: {path}")
    if path.suffix.lower() != ".wav":
        raise ValueError(f"Expected a .wav file, got '{path.suffix}'")


def _to_mono(waveform: torch.Tensor) -> torch.Tensor:
    """Convert a multi-channel waveform to mono by averaging channels.

    Args:
        waveform: Tensor of shape ``(channels, samples)``.

    Returns:
        Mono waveform of shape ``(1, samples)``.
    """
    if waveform.shape[0] > 1:
        logger.info("Converting %d channels to mono", waveform.shape[0])
        waveform = waveform.mean(dim=0, keepdim=True)
    return waveform


def _resample(waveform: torch.Tensor, orig_sr: int, target_sr: int) -> torch.Tensor:
    """Resample *waveform* from *orig_sr* to *target_sr*.

    Args:
        waveform: Audio tensor of shape ``(1, samples)``.
        orig_sr: Original sample rate.
        target_sr: Desired sample rate.

    Returns:
        Resampled tensor.
    """
    if orig_sr != target_sr:
        logger.info("Resampling from %d Hz to %d Hz", orig_sr, target_sr)
        resampler = torchaudio.transforms.Resample(orig_freq=orig_sr, new_freq=target_sr)
        waveform = resampler(waveform)
    return waveform
