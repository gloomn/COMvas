document.addEventListener('DOMContentLoaded', () => {
  const qrBox = document.getElementById('qrBox');
  const urlDisplay = document.getElementById('urlDisplay');
  const refreshBtn = document.getElementById('refreshBtn');

  async function fetchAndRenderQR() {
    try {
      const res = await fetch('/api/v1/auth/token/generate', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        const fullUrl = `${window.location.origin}/draw?token=${data.token}`;
        
        urlDisplay.textContent = fullUrl;
        qrBox.innerHTML = ''; // Clear previous QR

        new QRCode(qrBox, {
          text: fullUrl,
          width: 240,
          height: 240,
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.H
        });
      }
    } catch (err) {
      console.error('[QRCodePage] Error fetching token:', err);
    }
  }

  // Connect WebSocket to auto-refresh when drawing is submitted
  function initWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/stage`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.event === 'NEW_CHARACTER') {
          console.log('[QRCodePage] Drawing submitted! Generating fresh QR...');
          fetchAndRenderQR();
        } else if (msg.event === 'QR_SCANNED') {
          console.log('[QRCodePage] QR was scanned by a user! Generating fresh QR for the next person...');
          fetchAndRenderQR();
        } else if (msg.event === 'QR_REFRESH_REQUEST') {
          console.log('[QRCodePage] Admin requested QR refresh! Generating fresh QR...');
          fetchAndRenderQR();
        }
      } catch (e) {}
    };

    ws.onclose = () => setTimeout(initWebSocket, 3000);
  }

  // Initial load
  fetchAndRenderQR();
  initWebSocket();
});
