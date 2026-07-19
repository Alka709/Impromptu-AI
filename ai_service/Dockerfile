# ai_service/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
# ffmpeg is required for whisper
RUN apt-get update && apt-get install -y \
    ffmpeg \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies first to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Create a non-root user and change ownership
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Pre-download AI models into the image to ensure instant startup in production
RUN python -c "from faster_whisper import WhisperModel; WhisperModel('base', device='cpu', compute_type='int8')" && \
    python -c "import torch; torch.hub.load(repo_or_dir='snakers4/silero-vad', model='silero_vad', force_reload=False, trust_repo=True)"

# Expose port
EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Default command for the API service
# The rq worker will use this same image but override the command
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
