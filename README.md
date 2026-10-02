<div align="center">
  <img src="frontend/assets/logo.png" alt="COMvas Logo" width="250"/>
  <h1>COMvas</h1>
  <p><strong>2026 세미콜론 오픈사이언스 출품작 - 손그림 AI 애니메이션 파이프라인</strong></p>
  
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white"/>
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white"/>
  <img src="https://img.shields.io/badge/PixiJS-E34F26?style=for-the-badge&logo=html5&logoColor=white"/>
  <img src="https://img.shields.io/badge/NVIDIA_Jetson-76B900?style=for-the-badge&logo=nvidia&logoColor=white"/>
  <img src="https://img.shields.io/badge/Meta_AI-0668E1?style=for-the-badge&logo=meta&logoColor=white"/>
</div>

<br/>

## 프로젝트 소개

사용자가 그린 캐릭터 손그림 이미지를 입력받아, AI 기반으로 배경을 제거하고 관절을 추출한 뒤 살아 움직이는 애니메이션으로 만들어주는 Edge AI 파이프라인입니다. **Meta의 Animated Drawings** 모듈을 최적화하여 NVIDIA Jetson 디바이스 환경에서 빠르게 구동할 수 있도록 설계되었습니다.

---

## 주요 기능 (Features)

- **AI 배경 제거 (Background Removal):** `rembg`를 활용한 빠르고 정확한 캐릭터 누끼 추출.
- **자동 골격 추정 (Auto Pose Estimation):** `MediaPipe`를 통해 캐릭터의 관절(Skeleton)을 자동으로 인식하고 매핑합니다.
- **다양한 모션 지원 (Motion Retargeting):** Mixamo BVH 데이터를 기반으로 춤추기, 인사하기, 강남스타일 등 다양한 애니메이션(GIF/프레임)을 생성합니다.
- **고속 렌더링 최적화:** 멀티스레딩(ThreadPoolExecutor) 및 압축률 최적화를 통해 250 프레임 렌더링을 20초 이내로 단축!
- **Web 기반 체험:** FastAPI 웹 서버와 PIXI 기반의 웹 프론트엔드를 제공하여 모바일이나 PC에서 손쉽게 체험할 수 있습니다.

---

## 기술 스택 (Tech Stack)

### Backend & AI Pipeline
- **Framework:** FastAPI, Uvicorn, SQLAlchemy
- **AI / Vision:** Meta Animated Drawings, MediaPipe, Rembg, OpenCV, Pillow
- **Optimization:** Python `concurrent.futures`, NumPy Vectorization

### Frontend
- **Rendering:** PixiJS (WebGL)
- **Communication:** WebSockets, REST API

### Infrastructure
- **Edge AI:** NVIDIA Jetson (Dockerized)

---

## 디렉토리 구조 (Directory Structure)

```text
/ 오픈사이언스
 |-- app
 |   |-- ai           # 배경 제거, 포즈 추정, 애니메이션 렌더링 AI 코어 로직
 |   |-- api          # FastAPI 라우터 및 엔드포인트
 |   |-- models       # DB 모델
 |   |-- services     # AI 파이프라인 통합 서비스 로직 (ai_pipeline.py)
 |-- frontend         # PIXI.js 기반 프론트엔드 (캐릭터 UI 및 애니메이션 뷰어)
 |-- animated_drawings# Meta의 오픈소스 렌더링 엔진 (커스텀 튜닝)
 |-- examples         # 모션 리타겟팅 설정 파일 (.yaml) 및 BVH 데이터 (Mixamo)
 |-- setup_jetson.sh  # 젯슨 디바이스 환경 구성 스크립트
 |-- Dockerfile.jetson
 |-- requirements.txt
```

---

## 설치 및 실행 방법 (Getting Started)

### 1. NVIDIA Jetson 환경 셋업
Jetson 환경에서 실행할 경우 필수 라이브러리(PyOpenGL, glfw 등)와 CUDA 환경을 셋업해야 합니다.

```bash
chmod +x setup_jetson.sh
./setup_jetson.sh
```

### 2. 가상환경 및 패키지 설치
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. 서버 실행
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
브라우저에서 `http://localhost:8000` 으로 접속하여 파이프라인을 체험해 보세요!

---

## 최적화 노트 (Optimization Note)

- **문제:** 기존 250개의 프레임 단위 처리(투명도 부여 및 Base64 PNG 인코딩)시 15초 이상의 병목 발생
- **해결 방안:**
  - `Image.fromarray` 및 `numpy` 벡터화를 통한 RGB 마스킹 연산 최적화
  - `ThreadPoolExecutor` 적용으로 I/O 바운드 작업(이미지 저장 및 Base64 인코딩) 병렬 처리
  - `compress_level=1` 적용으로 압축 연산 속도 대폭 상향
- **결과:** **15초 -> 2.6초 (약 6배 속도 향상)**

---

<div align="center">
  <p>Made by Semicolon 2026</p>
</div>
