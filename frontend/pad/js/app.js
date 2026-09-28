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

  // Next Button (Switch to Skeleton Mode)
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      drawingControls.classList.add('hidden');
      jointControls.classList.remove('hidden');
      guideTip.classList.add('hidden');
      skeletonUI.show();
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

  // 2. Submit drawing handler
  submitBtn.addEventListener('click', async () => {
    submitBtn.disabled = true;
    submitBtn.textContent = "⌛ 전송 준비 중...";
    jointControls.classList.add('hidden'); // Hide buttons to prevent clicking again
    progressContainer.classList.remove('hidden');

    try {
      const blob = await pad.toBlob();
      const formData = new FormData();
      formData.append('token', token);
      formData.append('file', blob, 'drawing.png');
      
      // Export custom skeleton and append to form
      const skeletonData = skeletonUI.exportSkeleton();
      formData.append('skeleton_json', JSON.stringify(skeletonData));

      // Append selected motion
      const motionSelect = document.getElementById('motionSelect');
      if (motionSelect) {
        formData.append('motion', motionSelect.value);
      }

      const res = await fetch('/api/v1/drawing/submit', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        const taskId = data.task_id;
        
        // Start polling for progress
        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await fetch(`/api/v1/drawing/status/${taskId}`);
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              progressBar.style.width = `${statusData.progress}%`;
              progressText.textContent = `${statusData.status} (${statusData.progress}%)`;
              
              if (statusData.progress >= 100) {
                clearInterval(pollInterval);
                progressText.textContent = "🎉 전송 완료! 무대를 확인하세요!";
                setTimeout(() => {
                  window.location.href = "about:blank"; // Close/exit page
                }, 2000);
              }
            }
          } catch (e) {
            console.error("Polling error:", e);
          }
        }, 1000); // Poll every 1 second
        
      } else {
        const errorData = await res.json();
        alert(`전송 실패: ${errorData.detail || "오류가 발생했습니다."}`);
        submitBtn.disabled = false;
        submitBtn.textContent = "🚀 무대에 전송하기";
        jointControls.classList.remove('hidden');
        progressContainer.classList.add('hidden');
      }
    } catch (err) {
      alert("전송 중 네트워크 오류가 발생했습니다.");
      submitBtn.disabled = false;
      submitBtn.textContent = "🚀 무대에 전송하기";
      jointControls.classList.remove('hidden');
      progressContainer.classList.add('hidden');
    }
  });

  function showError(msg) {
    errorBanner.textContent = msg;
    errorBanner.classList.remove('hidden');
    tokenBadge.textContent = "토큰 오류";
    tokenBadge.style.background = "rgba(239, 68, 68, 0.2)";
    tokenBadge.style.color = "#ef4444";
    submitBtn.disabled = true;
  }
});
