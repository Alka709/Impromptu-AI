"""Sample usage of the Speakly speech analysis package."""

import json
import logging
import sys

from speech_analysis.metrics import extract_all_metrics
from speech_analysis.utils import NumpyEncoder

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(name)-30s  %(levelname)-8s  %(message)s",
)


def main() -> None:
    """Run full speech analysis on a WAV file provided as a CLI argument."""
    if len(sys.argv) < 2:
        print("Usage: python -m speech_analysis.sample_usage <path_to_wav>")
        sys.exit(1)

    audio_path = sys.argv[1]
    print(f"\n{'='*60}")
    print(f"  Speakly — Speech Analysis")
    print(f"  File: {audio_path}")
    print(f"{'='*60}\n")

    metrics = extract_all_metrics(audio_path)

    print(json.dumps(metrics, cls=NumpyEncoder, indent=2))


if __name__ == "__main__":
    main()
