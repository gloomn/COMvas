<div align="center">
  <img src="frontend/assets/logo.png" alt="COMvas Logo" width="250"/>
  <h1>COMvas</h1>
  <p><strong>2026 세미콜론 오픈사이언스 프로젝트 - 손그림 AI 애니메이션 파이프라인</strong></p>
  
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white"/>
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white"/>
  <img src="https://img.shields.io/badge/PixiJS-E34F26?style=for-the-badge&logo=html5&logoColor=white"/>
  <img src="https://img.shields.io/badge/NVIDIA_Jetson-76B900?style=for-the-badge&logo=nvidia&logoColor=white"/>
  <img src="https://img.shields.io/badge/Meta_AI-0668E1?style=for-the-badge&logo=meta&logoColor=white"/>
</div>

<br/>

## 1. 프로젝트 개요 (Overview)

COMvas는 사용자가 그린 캐릭터 이미지를 입력받아 AI 기반으로 배경을 제거하고 관절을 추출한 뒤, 살아 움직이는 애니메이션으로 생성하는 Edge AI 파이프라인입니다. Meta의 Animated Drawings 모듈을 고도로 최적화하여 NVIDIA Jetson 디바이스 환경에서도 저지연(Low-latency)으로 구동되도록 설계되었습니다.

## 2. 주요 기능 (Key Features)

- **AI 기반 전경 추출 (Background Removal):** `rembg` 모델을 활용하여 빠르고 정밀한 캐릭터 이미지 분리 수행.
- **자동 골격 추정 (Auto Pose Estimation):** `MediaPipe`를 통해 캐릭터의 관절(Skeleton) 구조를 자동으로 인식 및 리깅(Rigging) 매핑.
- **다목적 모션 리타겟팅 (Motion Retargeting):** Mixamo BVH 데이터를 활용하여 다양한 애니메이션 모션(예: 댄스, 인사 등)을 프레임 및 GIF 형태로 자동 생성.
- **고속 렌더링 최적화:** 멀티스레딩(`ThreadPoolExecutor`) 및 배열 벡터화 처리를 도입하여 250 프레임 렌더링 시간을 2.6초 이내로 단축.
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
- **Hardware & Edge AI:** NVIDIA Jetson (Dockerized support)

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

구동 환경(OS)에 맞춰 필수 시스템 라이브러리(PyOpenGL, glfw 등)를 설치합니다.

**NVIDIA Jetson 환경:**
```bash
chmod +x setup_jetson.sh
./setup_jetson.sh
```

**macOS / Ubuntu 환경:**
```bash
chmod +x setup_mac.sh    # macOS의 경우
chmod +x setup_ubuntu.sh # Ubuntu의 경우
./setup_mac.sh           # 또는 ./setup_ubuntu.sh 실행
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
구동이 완료되면 웹 브라우저를 통해 `http://localhost:8000`으로 접속하여 서비스를 이용하실 수 있습니다.

## 6. 성능 최적화 내역 (Performance Optimization)

- **이슈 (Issue):** 초기 파이프라인에서 250개 프레임에 대한 개별 투명도(Alpha) 연산 및 Base64 PNG 인코딩 시 병목이 발생하여, 모션 렌더링에 15초 이상이 소요되는 문제 확인.
- **해결 방안 (Solution):**
  - **연산 벡터화:** `Image.fromarray` 및 `numpy` 벡터화를 적용하여 RGB 마스킹 연산을 최적화함으로써 CPU 연산 부하 완화.
  - **병렬 처리 (Parallelism):** `ThreadPoolExecutor`를 활용하여 디스크 I/O 작업(이미지 저장)과 Base64 인코딩 작업을 다중 스레드로 병렬화 처리.
  - **압축 효율화:** PNG 인코딩 단계에서 `compress_level=1` 속성을 적용하여 시각적 품질 저하 없이 압축 연산 속도를 대폭 개선.
- **개선 결과 (Result):** 기존 15초 소요되던 렌더링 과정을 **2.6초 수준으로 단축 (약 600% 속도 향상)**.

---

<div align="center">
  <p><strong>Developed by Semicolon 2026</strong></p>
</div>
