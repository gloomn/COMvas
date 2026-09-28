#!/bin/bash
set -e

echo "=========================================================="
echo "  NVIDIA Jetson Orin Nano Super Live Sketch Stage Setup  "
echo "=========================================================="

# 1. System Package Updates & Native Dependencies
echo "[1/5] Installing system dependencies & CUDA tools..."
sudo apt-get update && sudo apt-get install -y \
    python3-pip python3-dev build-essential \
    libopenblas-dev libopenmpi-dev \
    libjpeg-dev zlib1g-dev libpython3-dev \
    libavcodec-dev libavformat-dev libswscale-dev \
    ffmpeg chromium-browser sqlite3 git

# 2. CUDA Environment Variables Export
echo "[2/5] Exporting CUDA environment variables..."
export CUDA_HOME=/usr/local/cuda
export PATH=${CUDA_HOME}/bin:${PATH}
export LD_LIBRARY_PATH=${CUDA_HOME}/lib64:${LD_LIBRARY_PATH}

# Add to ~/.bashrc if not present
if ! grep -q "CUDA_HOME=/usr/local/cuda" ~/.bashrc; then
    echo 'export CUDA_HOME=/usr/local/cuda' >> ~/.bashrc
    echo 'export PATH=${CUDA_HOME}/bin:${PATH}' >> ~/.bashrc
    echo 'export LD_LIBRARY_PATH=${CUDA_HOME}/lib64:${LD_LIBRARY_PATH}' >> ~/.bashrc
fi

# 3. NVIDIA Jetson PyTorch ARM64 Installation
echo "[3/5] Checking PyTorch for Jetson..."
if python3 -c "import torch; print(torch.__version__, torch.cuda.is_available())" 2>/dev/null; then
    echo "PyTorch with CUDA is already installed!"
else
    echo "Installing official NVIDIA PyTorch wheel for ARM64 JetPack..."
    # JetPack 6.0 / 6.1 PyTorch Wheel URL
    TORCH_URL="https://developer.download.nvidia.com/compute/redist/jp/v60/pytorch/torch-2.3.0a0+eb488ab.nv24.03-cp310-cp310-linux_aarch64.whl"
    pip3 install --no-cache-dir $TORCH_URL
fi

# 4. Source Compile torchvision for Jetson Orin (CUDA Arch 8.7)
echo "[4/5] Building torchvision from source for Orin Nano Super..."
if python3 -c "import torchvision" 2>/dev/null; then
    echo "torchvision is already installed!"
else
    TMP_DIR=$(mktemp -d)
    cd $TMP_DIR
    git clone --branch v0.18.0 https://github.com/pytorch/vision.git torchvision_src
    cd torchvision_src
    export BUILD_VERSION=0.18.0
    export TORCH_CUDA_ARCH_LIST="8.7"
    python3 setup.py install --user
    cd -
    rm -rf $TMP_DIR
fi

# 5. Python Application Dependencies
echo "[5/5] Installing Python requirements..."
pip3 install -r requirements.txt

# 6. Create required directory structure
mkdir -p data/db data/models data/outputs

echo "=========================================================="
echo "  Setup Complete! You can now start the application.      "
echo "  Run: uvicorn app.main:app --host 0.0.0.0 --port 8000   "
echo "=========================================================="
