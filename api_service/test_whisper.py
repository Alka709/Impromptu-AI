import traceback
from speech_analysis.whisper_transcriber import _load_model

try:
    print("Attempting to load Whisper model...")
    model = _load_model()
    print("Model loaded successfully!")
except Exception as e:
    print("Failed to load model:")
    traceback.print_exc()
