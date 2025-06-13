# Dockerfile for AidCare Backend - Optimized Multi-Stage Build

# ---- Builder Stage: For compiling and installing Python dependencies ----
FROM python:3.11-slim-bullseye AS builder

# Set working directory for the builder stage
WORKDIR /app

# Set environment variables for Python
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV VIRTUAL_ENV=/app/venv
ENV PATH="${VIRTUAL_ENV}/bin:$PATH"

# Create virtual environment
RUN python -m venv ${VIRTUAL_ENV}

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libc-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --upgrade pip && \
    pip install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt

# ---- Final Runtime Stage ----
FROM python:3.11-slim-bullseye

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV APP_HOME=/app
ENV VIRTUAL_ENV=/app/venv
ENV PATH="${VIRTUAL_ENV}/bin:$PATH"

WORKDIR ${APP_HOME}

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    tesseract-ocr \
    tesseract-ocr-eng \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder
COPY --from=builder ${VIRTUAL_ENV} ${VIRTUAL_ENV}

# Copy application code and data
COPY . .

# Expose port
EXPOSE 8080

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]