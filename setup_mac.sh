#!/bin/bash
set -e

echo "=========================================================="
echo "  Mac (Apple Silicon) Anaconda Setup for COMvas  "
echo "=========================================================="

ENV_NAME="comvas"

# 1. Check if conda exists
if ! command -v conda &> /dev/null; then
    echo "Conda is not installed or not in PATH."
    exit 1
fi

# 2. Install system dependencies (ffmpeg) via Conda
echo "[1/4] Installing ffmpeg via Conda..."
conda install -y -n $ENV_NAME -c conda-forge ffmpeg

# 3. Install PyTorch with MPS support (Native Mac Silicon)
echo "[2/4] Installing PyTorch into '$ENV_NAME' environment..."
# Using pip inside conda is recommended for Mac PyTorch MPS to get the latest wheels reliably
conda run -n $ENV_NAME pip install torch torchvision

# 4. Install FastAPI and backend pipeline requirements
echo "[3/4] Installing Python requirements into '$ENV_NAME' environment..."
conda run -n $ENV_NAME pip install -r requirements.txt

# 5. Create required directory structure
echo "[4/4] Creating required data directories..."
mkdir -p data/db data/models data/outputs data/qr_codes

echo "=========================================================="
echo "  Setup Complete! Mac Environment Ready "
echo "  "
echo "  To start the server, please run:"
echo "  conda activate $ENV_NAME"
echo "  make start"
echo "=========================================================="
