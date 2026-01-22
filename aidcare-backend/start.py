#!/usr/bin/env python3
"""
Start script for Railway deployment
Handles PORT environment variable properly
"""
import os
import sys

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = "0.0.0.0"

    print(f"Starting server on {host}:{port}")

    # Import uvicorn and run
    import uvicorn
    uvicorn.run("main:app", host=host, port=port, log_level="info")
