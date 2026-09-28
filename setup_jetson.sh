#!/bin/bash
set -e

echo "=========================================================="
echo "  NVIDIA Jetson Orin Nano Super Live Sketch Stage Setup  "
echo "=========================================================="

# 1. 시스템 필수 패키지 및 OpenCV/FFmpeg 등 기본 의존성 설치
echo "[1/5] Installing system dependencies & CUDA tools..."
sudo apt-get update && sudo apt-get install -y \
    python3-pip python3-dev build-essential \
    libopenblas-dev libopenmpi-dev \
    libjpeg-dev zlib1g-dev libpython3-dev \
    libavcodec-dev libavformat-dev libswscale-dev \
    ffmpeg chromium-browser sqlite3 git

# 2. CUDA 환경변수 설정 및 .bashrc 영구 반영
echo "[2/5] Exporting CUDA environment variables..."
export CUDA_HOME=/usr/local/cuda
export PATH=${CUDA_HOME}/bin:${PATH}
export LD_LIBRARY_PATH=${CUDA_HOME}/lib64:${LD_LIBRARY_PATH}

if ! grep -q "CUDA_HOME=/usr/local/cuda" ~/.bashrc; then
    echo 'export CUDA_HOME=/usr/local/cuda' >> ~/.bashrc
    echo 'export PATH=${CUDA_HOME}/bin:${PATH}' >> ~/.bashrc
    echo 'export LD_LIBRARY_PATH=${CUDA_HOME}/lib64:${LD_LIBRARY_PATH}' >> ~/.bashrc
fi

# 3. Jetson 전용 CUDA 가속 PyTorch & torchvision 설치
echo "[3/5] Checking PyTorch for Jetson..."
if python3 -c "import torch; assert torch.cuda.is_available()" 2>/dev/null; then
    echo "✓ PyTorch with CUDA is already installed and working!"
else
    echo "Installing Jetson-optimized PyTorch with CUDA acceleration..."
    
    # 1순위: Jetson AI Lab 전용 인덱스 서버 (JetPack 6.0/6.1 / CUDA 12.2 최적화)
    if pip3 install --no-cache-dir torch torchvision --index-url https://pypi.jetson-ai-lab.io/jp6/cu122; then
        echo "✓ Successfully installed PyTorch via Jetson AI Lab Index!"
    else
        # 2순위: NVIDIA 공식 PyTorch Wheel 폴백
        echo "Fallback: Installing official NVIDIA PyTorch wheel for JetPack 6.0..."
        pip3 install --no-cache-dir https://developer.download.nvidia.com/compute/redist/jp/v60/pytorch/torch-2.4.0a0+07cecf4168.nv24.05.14710581-cp310-cp310-linux_aarch64.whl
    fi
fi

# 4. CUDA 가속 정상 연동 여부 검증
echo "[4/5] Verifying PyTorch CUDA Acceleration..."
python3 -c "import torch; print('PyTorch Version:', torch.__version__); print('CUDA Available:', torch.cuda.is_available())"

# 5. FastAPI 및 백엔드 파이프라인 파이썬 패키지 설치
echo "[5/5] Installing Python requirements..."
pip3 install -r requirements.txt

# 6. 필수 데이터/DB 저장 디렉토리 생성
mkdir -p data/db data/models data/outputs data/qr_codes

echo "=========================================================="
echo "  Setup Complete! Jetson Orin Nano Super Environment Ready "
echo "  Start Server: uvicorn app.main:app --host 0.0.0.0 --port 8000"
echo "=========================================================="