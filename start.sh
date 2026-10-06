#!/bin/bash
echo "🚀 Starting COMvas Server..."
uvicorn app.main:app --host 0.0.0.0 --port 8000
