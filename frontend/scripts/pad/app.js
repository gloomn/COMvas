document.addEventListener('DOMContentLoaded', async () => {
  const pad = new window.DrawingPadCanvas('drawCanvas');
  const tokenBadge = document.getElementById('tokenBadge');
  const errorBanner = document.getElementById('errorBanner');
  const submitBtn = document.getElementById('submitBtn');

  // Parse URL query parameter ?token=...
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  if (!token) {
    showError("QR 토큰이 없습니다. 올바른 QR 코드로 접속해 주세요.");
    return;
  }

  // 1. Verify token with FastAPI backend
  try {
    const res = await fetch(`/api/v1/auth/token/verify?token=${encodeURIComponent(token)}`);
    if (res.ok) {
      tokenBadge.textContent = "1회용 토큰 확인됨";
      tokenBadge.classList.add('valid');
    } else {
      const data = await res.json();
      showError(data.detail || "유효하지 않거나 만료된 QR 코드입니다.");
    }
  } catch (err) {
    showError("서버와 통신할 수 없습니다. Jetson 서버 상태를 확인하세요.");
  }

  const nextBtn = document.getElementById('nextBtn');
  const backBtn = document.getElementById('backBtn');
  const drawingControls = document.getElementById('drawingControls');
  const jointControls = document.getElementById('jointControls');
  const guideTip = document.getElementById('guideTip');
  
  // Initialize Skeleton UI
  const skeletonUI = new window.SkeletonUI('skeletonLayer');

  let currentMode = 'person'; // 'person' | 'static'
  const tabPerson = document.getElementById('tabPerson');
  const tabStatic = document.getElementById('tabStatic');
  const guideCanvas = document.getElementById('guideCanvas');
  
  if (tabPerson && tabStatic) {
    tabPerson.addEventListener('click', () => {
      currentMode = 'person';
      tabPerson.classList.replace('btn-secondary', 'btn-primary');
      tabStatic.classList.replace('btn-primary', 'btn-secondary');
      guideCanvas.style.display = 'block';
      guideTip.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #fbbf24; flex-shrink: 0;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg> <span><b>팁:</b> 화면의 <b>'대자' 실루엣 가이드라인</b>에 맞춰 인물의 머리, 팔, 다리를 그려주세요!</span>`;
      nextBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;
    });

    tabStatic.addEventListener('click', () => {
      currentMode = 'static';
      tabStatic.classList.replace('btn-secondary', 'btn-primary');
      tabPerson.classList.replace('btn-primary', 'btn-secondary');
      guideCanvas.style.display = 'none';
      guideTip.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #fbbf24; flex-shrink: 0;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg> <span><b>팁:</b> 무대 하늘을 장식할 별, 하트, 문구 등을 자유롭게 그려주세요!</span>`;
      nextBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg> 바로 무대로 전송하기`;
    });
  }

  // Next Button (Switch to Skeleton Mode OR Submit if Static)
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentMode === 'person') {
        drawingControls.classList.add('hidden');
        jointControls.classList.remove('hidden');
        guideTip.classList.add('hidden');
        skeletonUI.show();
      } else {
        // Static mode -> Submit directly!
        submitDrawing();
      }
    });
  }

  // Back Button (Switch to Drawing Mode)
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      jointControls.classList.add('hidden');
      drawingControls.classList.remove('hidden');
      guideTip.classList.remove('hidden');
      skeletonUI.hide();
    });
  }

  const progressContainer = document.getElementById('progressContainer');
  const progressText = document.getElementById('progressText');
  const progressBar = document.getElementById('progressBar');

  const uploadBtn = document.getElementById('uploadBtn');
  const uploadInput = document.getElementById('uploadInput');
  
  if (uploadBtn && uploadInput) {
    uploadBtn.addEventListener('click', () => {
      uploadInput.click();
    });
    
    uploadInput.addEventListener('change', async (e) => {
      if (!e.target.files.length) return;
      const file = e.target.files[0];
      
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        uploadBtn.disabled = true;
        uploadBtn.style.opacity = '0.5';
        document.getElementById('fullScreenLoading').style.display = 'flex';
        document.getElementById('loadingMessage').textContent = '이미지 처리 중...';
        
        const res = await fetch('/api/v1/drawing/remove-bg', {
          method: 'POST',
          body: formData
        });
        
        if (res.ok) {
          const data = await res.json();
          const img = new Image();
          img.onload = () => {
            pad.ctx.clearRect(0, 0, pad.canvas.width, pad.canvas.height);
            pad.ctx.drawImage(img, 0, 0, pad.canvas.width, pad.canvas.height);
            pad.saveState();
          };
          img.src = data.image;
        } else {
          alert('배경 제거 실패');
        }
      } catch (err) {
        alert('서버 에러');
      } finally {
        uploadBtn.disabled = false;
        uploadBtn.style.opacity = '1';
        uploadInput.value = '';
        document.getElementById('fullScreenLoading').style.display = 'none';
      }
    });
  }

  // 2. Submit drawing handler (Person mode confirms via submitBtn)
  submitBtn.addEventListener('click', submitDrawing);

  async function submitDrawing() {
    const btnToDisable = currentMode === 'person' ? submitBtn : nextBtn;
    const originalHTML = btnToDisable.innerHTML;
    btnToDisable.disabled = true;
    btnToDisable.innerHTML = "전송 준비 중...";
    document.getElementById('fullScreenLoading').style.display = 'flex';
    document.getElementById('loadingMessage').textContent = '무대로 전송 중...';
    
    if (currentMode === 'person') jointControls.classList.add('hidden');
    else drawingControls.classList.add('hidden');
    
    progressContainer.classList.remove('hidden');

    try {
      const blob = await pad.toBlob();
      const formData = new FormData();
      formData.append('token', token);
      formData.append('file', blob, 'drawing.png');
      formData.append('drawing_type', currentMode);
      
      if (currentMode === 'person') {
        const skeletonData = skeletonUI.exportSkeleton();
        formData.append('skeleton_json', JSON.stringify(skeletonData));
        const motionSelect = document.getElementById('motionSelect');
        if (motionSelect) formData.append('motion', motionSelect.value);
      }

      const res = await fetch('/api/v1/drawing/submit', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        
        // If static, the backend might process it instantly or differently.
        if (currentMode === 'static' || data.status === 'COMPLETED') {
          progressBar.style.width = `100%`;
          progressText.textContent = "🎉 전송 완료! 무대를 확인하세요!";
          setTimeout(() => window.location.href = "/success", 2000);
          return;
        }

        const taskId = data.task_id;
        
        // Start polling for progress (Person mode only usually)
        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await fetch(`/api/v1/drawing/status/${taskId}`);
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              progressBar.style.width = `${statusData.progress}%`;
              progressText.textContent = statusData.status;
              
              if (statusData.progress >= 100) {
                clearInterval(pollInterval);
                progressText.textContent = "🎉 전송 완료! 무대를 확인하세요!";
                setTimeout(() => window.location.href = "/success", 2000);
              }
            }
          } catch (e) { console.error("Polling error:", e); }
        }, 1000);
        
      } else {
        const errorData = await res.json();
        alert(`전송 실패: ${errorData.detail || "오류가 발생했습니다."}`);
        resetUI(btnToDisable, originalHTML);
      }
    } catch (err) {
      alert("전송 중 네트워크 오류가 발생했습니다.");
      resetUI(btnToDisable, originalHTML);
      document.getElementById('fullScreenLoading').style.display = 'none';
    }
  }

  function resetUI(btn, originalHTML) {
    btn.disabled = false;
    btn.innerHTML = originalHTML;
    if (currentMode === 'person') jointControls.classList.remove('hidden');
    else drawingControls.classList.remove('hidden');
    progressContainer.classList.add('hidden');
    document.getElementById('fullScreenLoading').style.display = 'none';
  }

  function showError(msg) {
    errorBanner.textContent = msg;
    errorBanner.classList.remove('hidden');
    tokenBadge.textContent = "토큰 오류";
    tokenBadge.style.background = "rgba(239, 68, 68, 0.2)";
    tokenBadge.style.color = "#ef4444";
    submitBtn.disabled = true;
  }
});
