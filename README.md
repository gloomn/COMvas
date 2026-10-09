<div align="center">
  <img src="frontend/assets/logo.png" alt="COMvas Logo" width="250"/>
  <h1>COMvas</h1>
  <p><strong>2026 세미콜론 오픈사이언스 프로젝트 - 손그림 AI 애니메이션 파이프라인</strong></p>
  
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white"/>
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white"/>
  <img src="https://img.shields.io/badge/PixiJS-E34F26?style=for-the-badge&logo=html5&logoColor=white"/>
  <img src="https://img.shields.io/badge/NVIDIA_RTX_4090-76B900?style=for-the-badge&logo=nvidia&logoColor=white"/>
  <img src="https://img.shields.io/badge/RunPod-673AB7?style=for-the-badge&logo=cloud&logoColor=white"/>
</div>

<br/>

## 1. 프로젝트 개요 (Overview)

COMvas는 사용자가 그린 캐릭터 이미지를 입력받아 AI 기반으로 배경을 제거하고 관절을 추출한 뒤, 살아 움직이는 애니메이션으로 생성하는 고성능 AI 파이프라인입니다. 본 프로젝트는 초기 NVIDIA Jetson 기반의 Edge AI로 기획되었으나, 연산 병목을 해소하고 쾌적한 실시간 렌더링을 제공하기 위해 현재 **RunPod 클라우드의 NVIDIA RTX 4090 환경**으로 마이그레이션하여 극대화된 성능으로 구동됩니다.

## 2. 주요 기능 (Key Features)

- **AI 기반 전경 추출 (Background Removal):** `rembg` 모델을 활용하여 빠르고 정밀한 캐릭터 이미지 분리 수행.
- **자동 골격 추정 (Auto Pose Estimation):** `MediaPipe`를 통해 캐릭터의 관절(Skeleton) 구조를 자동으로 인식 및 리깅(Rigging) 매핑.
- **다목적 모션 리타겟팅 (Motion Retargeting):** Mixamo BVH 데이터를 활용하여 다양한 애니메이션 모션(예: 댄스, 인사 등)을 프레임 및 GIF 형태로 자동 생성.
- **고속 렌더링 최적화:** 멀티스레딩(`ThreadPoolExecutor`), 배열 벡터화, 그리고 고성능 클라우드 GPU(RTX 4090)를 결합하여 250 프레임 렌더링 시간을 2.6초 이내로 단축.
- **인터랙티브 웹 인터페이스:** FastAPI 서버와 PixiJS 기반의 웹 렌더러를 제공하여, 사용자가 PC 및 모바일 환경에서 애니메이션 결과를 실시간으로 확인 가능.

## 3. 기술 스택 (Tech Stack)

### Backend & AI Pipeline
- **Framework:** FastAPI, Uvicorn, SQLAlchemy
- **AI / Computer Vision:** Meta Animated Drawings, MediaPipe, Rembg, OpenCV, Pillow
- **Optimization:** Python `concurrent.futures`, NumPy Vectorization

### Frontend
- **Rendering Engine:** PixiJS (WebGL)
- **Communication:** WebSockets, REST API

### Infrastructure
- **Current Production:** RunPod Cloud GPU (NVIDIA RTX 4090)
- **Legacy Support:** NVIDIA Jetson (Dockerized support)

## 4. 디렉토리 구조 (Directory Structure)

```text
.
├── app/
│   ├── ai/                # 전경 추출, 포즈 추정, 애니메이션 렌더링 코어 로직
│   ├── api/               # FastAPI 라우터 및 엔드포인트
│   ├── core/              # 서버 설정 및 환경 변수
│   ├── db/                # 데이터베이스 설정
│   ├── models/            # 데이터베이스 ORM 모델
│   └── services/          # AI 파이프라인 통합 서비스 로직 (ai_pipeline.py)
├── frontend/              # PixiJS 기반 웹 프론트엔드 (UI 및 애니메이션 뷰어)
├── animated_drawings/     # Meta 오픈소스 렌더링 엔진 (커스텀 최적화 적용)
├── examples/              # 모션 리타겟팅 설정 파일 (.yaml) 및 BVH 모션 데이터
├── scripts/               # 유틸리티 및 보조 스크립트
├── Dockerfile.jetson      # Jetson 환경용 Docker 빌드 설정
├── setup_jetson.sh        # NVIDIA Jetson 환경 설정 스크립트
├── setup_mac.sh           # macOS 환경 설정 스크립트
├── setup_ubuntu.sh        # Ubuntu 환경 설정 스크립트
└── requirements.txt       # 파이썬 패키지 의존성 명세서
```

## 5. 설치 및 실행 (Installation & Setup)

### 5.1 환경 셋업 스크립트 실행

구동 환경(OS)에 맞춰 필수 시스템 라이브러리(PyOpenGL, glfw 등)를 설치합니다. (RunPod/Ubuntu 권장)

**Ubuntu / RunPod 인스턴스:**
```bash
chmod +x setup_ubuntu.sh
./setup_ubuntu.sh
```

**macOS / NVIDIA Jetson (Legacy):**
```bash
chmod +x setup_mac.sh    # macOS
chmod +x setup_jetson.sh # Jetson
./setup_mac.sh           # 또는 ./setup_jetson.sh
```

### 5.2 가상환경 구축 및 패키지 설치

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 5.3 서버 구동

서버 실행 스크립트를 통해 Uvicorn 기반의 FastAPI 애플리케이션을 구동합니다.

```bash
./start.sh
# 직접 실행 시: uvicorn app.main:app --host 0.0.0.0 --port 8000
```
구동이 완료되면 웹 브라우저를 통해 지정된 포트(또는 터널링 URL)로 접속하여 서비스를 이용하실 수 있습니다.

## 6. 인프라 마이그레이션 및 성능 최적화 내역 (Migration & Optimization)

본 프로젝트는 서비스 품질 극대화를 위해 하드웨어 마이그레이션과 소프트웨어 레벨의 최적화를 동시에 진행했습니다.

### 6.1 인프라 마이그레이션 (RunPod RTX 4090)
- **이슈 (Issue):** 초기 기획된 Edge AI(NVIDIA Jetson) 환경에서는 다수의 AI 모델(포즈 추정, 전경 추출 등)과 렌더링 엔진을 동시에 구동하기에 VRAM 및 연산 리소스가 턱없이 부족하여 치명적인 성능 저하가 발생.
- **해결 (Solution):** 서비스 안정성 및 처리 속도를 위해 연산 환경을 **RunPod RTX 4090** 인스턴스로 전면 마이그레이션. 이를 통해 압도적인 GPU 성능을 확보하고 다중 사용자의 요청을 안정적으로 수용 가능하도록 아키텍처 개편.

### 6.2 소프트웨어 렌더링 최적화
- **이슈 (Issue):** 프레임 생성 과정 중 250개의 이미지에 대한 개별 투명도(Alpha) 연산 및 Base64 PNG 인코딩 시 병목이 발생하여 기존 15초 이상의 지연 발생.
- **해결 (Solution):**
  - **연산 벡터화:** `Image.fromarray` 및 `numpy` 벡터화를 적용하여 RGB 마스킹 연산을 최적화함으로써 CPU 연산 부하 완화.
  - **병렬 처리 (Parallelism):** `ThreadPoolExecutor`를 활용하여 디스크 I/O 작업과 Base64 인코딩 작업을 멀티스레드로 병렬 처리.
  - **압축 효율화:** PNG 인코딩 단계에서 `compress_level=1` 속성을 적용하여 시각적 품질 저하 없이 압축 연산 속도 대폭 향상.

- **최종 결과 (Result):** 클라우드 인프라 업그레이드와 로직 최적화의 시너지로, 기존 15초 이상 소요되던 애니메이션 파이프라인 구간을 **2.6초 이내로 단축 (약 600% 속도 향상)**.

---

<div align="center">
  <p><strong>Developed by Semicolon 2026(LeeKiJoon)</strong></p>
</div>
