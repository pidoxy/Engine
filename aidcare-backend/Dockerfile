# Dockerfile for AidCare Backend - Optimized Multi-Stage Build

# ---- Builder Stage ----
# Use a slightly larger base if needed for compilation, but slim is often fine
FROM python:3.11-slim-bullseye AS builder

WORKDIR /opt/venv

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV VIRTUAL_ENV=/opt/venv 
ENV PATH="${VIRTUAL_ENV}/bin:$PATH" 

# Create virtual environment
RUN python -m venv ${VIRTUAL_ENV}

# Install system dependencies needed for building Python packages
# Keep this as minimal as possible.
# If faiss-cpu, Pillow, etc., install fine from wheels, you might not need cmake/build-essential. Test this.
RUN apt-get update && apt_install_no_recommends="apt-get install -y --no-install-recommends" \
    && $apt_install_no_recommends \
        build-essential \
        cmake \
        # libboost-all-dev \ # TRY REMOVING THIS FIRST. Add back ONLY if pip install fails for a specific package.
        libssl-dev \
        libffi-dev \
        python3-dev \
        # git \ # Only if a pip package needs to be installed from a git repo
    && rm -rf /var/lib/apt/lists/*

# Copy only requirements to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies into the virtual environment
# Upgrade pip first
RUN pip install --upgrade pip
# Install CPU PyTorch first
RUN pip install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
# Install the rest of the requirements
RUN pip install --no-cache-dir -r requirements.txt


# ---- Final Stage ----
FROM python:3.11-slim-bullseye

# Set environment variables for the final image
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV APP_HOME=/app
ENV VIRTUAL_ENV=/opt/venv 
ENV PATH="${VIRTUAL_ENV}/bin:$PATH" 

WORKDIR ${APP_HOME}

# Install runtime system dependencies (e.g., ffmpeg, tesseract, poppler)
RUN apt-get update && apt_install_no_recommends="apt-get install -y --no-install-recommends" \
    && $apt_install_no_recommends \
        ffmpeg \
        tesseract-ocr \
        tesseract-ocr-eng \ 
        poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Copy the virtual environment from the builder stage
COPY --from=builder ${VIRTUAL_ENV} ${VIRTUAL_ENV}

# Copy application code and necessary data
COPY aidcare_pipeline ./aidcare_pipeline
COPY main.py .
# COPY scripts/ ./scripts/ # Only if scripts are needed at runtime
COPY data ./data 

# Ensure the application user can write to temp/data directories if needed by app
# RUN chown -R <some_user>:<some_group> ${APP_HOME}/temp_audio ${APP_HOME}/patient_documents_storage
# This is often handled by the platform, but good to be aware of if you get permission errors.
# The default user in python images is often root, then later non-root.

# Port exposure - platform will map this.
# Render often expects 10000 or uses $PORT. Let's use 8000 as Uvicorn's default.
EXPOSE 8080

# Command to run your application.
# Platforms like Render will use your Procfile or their "Start Command" setting.
# This CMD is a fallback. Use $PORT if provided by the platform.
# For Render with Docker, a common practice is to have uvicorn listen on 10000 if $PORT isn't explicitly used.
# Or better: ensure your Procfile `web: uvicorn main:app --host 0.0.0.0 --port $PORT` is used.

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]