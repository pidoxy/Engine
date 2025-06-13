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
RUN . ${VIRTUAL_ENV}/bin/activate && \
    pip install --upgrade pip && \
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

# Set Python memory management
ENV PYTHONMALLOC=malloc
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Set resource limits
ENV OMP_NUM_THREADS=1
ENV MKL_NUM_THREADS=1
ENV NUMEXPR_NUM_THREADS=1
ENV OPENBLAS_NUM_THREADS=1
ENV VECLIB_MAXIMUM_THREADS=1

WORKDIR ${APP_HOME}

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    tesseract-ocr \
    tesseract-ocr-eng \
    poppler-utils \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder
COPY --from=builder ${VIRTUAL_ENV} ${VIRTUAL_ENV}

# Create necessary directories
RUN mkdir -p ${APP_HOME}/temp_audio \
    ${APP_HOME}/patient_documents_storage \
    ${APP_HOME}/temp_pdf_pages

# Copy application code and data
COPY . .

# Set proper permissions
RUN chmod -R 755 ${APP_HOME}

# Verify uvicorn installation
RUN . ${VIRTUAL_ENV}/bin/activate && which uvicorn

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Command to run the application with resource limits
CMD ["sh", "-c", ". ${VIRTUAL_ENV}/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8080 --workers 1 --limit-concurrency 10 --timeout-keep-alive 30"]