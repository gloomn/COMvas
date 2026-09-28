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

  // 2. Submit drawing handler
  submitBtn.addEventListener('click', async () => {
    submitBtn.disabled = true;
    submitBtn.textContent = "⌛ 전송 중...";

    try {
      const blob = await pad.toBlob();
      const formData = new FormData();
      formData.append('token', token);
      formData.append('file', blob, 'drawing.png');

      const res = await fetch('/api/v1/drawing/submit', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        alert("🎉 전송 완료! 대형 스크린 무대에서 나의 캐릭터 댄스를 확인하세요!");
        window.location.href = "about:blank"; // Close/exit page
      } else {
        const errorData = await res.json();
        alert(`전송 실패: ${errorData.detail || "오류가 발생했습니다."}`);
        submitBtn.disabled = false;
        submitBtn.textContent = "🚀 무대에 전송하기";
      }
    } catch (err) {
      alert("전송 중 네트워크 오류가 발생했습니다.");
      submitBtn.disabled = false;
      submitBtn.textContent = "🚀 무대에 전송하기";
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
