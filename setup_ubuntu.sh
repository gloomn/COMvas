#!/bin/bash
set -e

echo "=========================================================="
echo "  Ubuntu (RunPod/AWS) Setup for COMvas  "
echo "=========================================================="

echo "[1/3] Installing system dependencies (ffmpeg, OpenGL, xvfb)..."
apt-get update
apt-get install -y ffmpeg libgl1-mesa-glx xvfb sqlite3 git

echo "[2/3] Installing Python requirements..."
# RunPod's PyTorch image already has a perfect Python environment
pip install -r requirements.txt
# Ensure setuptools is downgraded for Animated Drawings
pip install "setuptools<70.0.0"

echo "[3/3] Creating data directories..."
mkdir -p data/db data/models data/outputs data/qr_codes

echo "=========================================================="
echo "  Setup Complete! Ubuntu Environment Ready."
echo "  Run server with: ./start_ubuntu.sh"
echo "=========================================================="
