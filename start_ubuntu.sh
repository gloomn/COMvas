#!/bin/bash
echo "🚀 Starting COMvas Server on Ubuntu (Headless)..."
# xvfb-run is required on headless linux servers to simulate a display for OpenGL
xvfb-run -a uvicorn app.main:app --host 0.0.0.0 --port 8000
