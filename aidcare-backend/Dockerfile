# Dockerfile
# Use an official Python image. Choose a version compatible with your code.
# python:3.11-slim or python:3.10-slim are good starting points for smaller images.
FROM python:3.11-slim 

# Set the working directory in the container
WORKDIR /app

# Set environment variables to prevent pip from caching, and for Python
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install system dependencies that might be needed by some Python packages
# (e.g., ffmpeg for Whisper if not handled by torchaudio, build-essential for C extensions)
# Keep this minimal. faiss-cpu usually doesn't need many extra system deps.
# RUN apt-get update && apt-get install -y --no-install-recommends some-package && rm -rf /var/lib/apt/lists/*

# Copy just the requirements file first to leverage Docker cache
COPY requirements.txt .

# Install PyTorch CPU versions first, then the rest of the requirements
# This gives more control over the PyTorch version.
# Replace <torch_version>, <torchvision_version>, <torchaudio_version> with specific versions if needed
# e.g., torch==2.1.0+cpu torchvision==0.16.0+cpu torchaudio==2.1.0+cpu
# Using --no-cache-dir can sometimes help with temporary space during pip install.
RUN pip install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application code into the container
COPY . .

# Make port $PORT available to the world outside this container
# App Platform will set $PORT. Uvicorn will bind to 0.0.0.0:$PORT.
# No EXPOSE $PORT needed here as App Platform handles it.

# Define the command to run your application
# This will be overridden by DigitalOcean's Run Command if you use a Procfile,
# but it's good practice to have a CMD.
# Use the $PORT variable provided by App Platform.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"] 
# Note: App Platform will inject $PORT, so uvicorn will actually listen on $PORT.
# Using 8000 here is a fallback if $PORT is not set, but App Platform will set it.
# Better to use $PORT directly if your CMD syntax allows it (depends on shell used by base image).
# A Procfile is often more straightforward for the run command with App Platform.