class LiveQRKiosk {
  constructor() {
    this.qrContainer = document.getElementById('qrCodeBox');
    this.currentToken = null;
    
    if (this.qrContainer) {
      this.initQRCode();
    }
  }

  async fetchNewToken() {
    try {
      const res = await fetch('/api/v1/auth/token/generate', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        this.currentToken = data.token;
        this.renderQRCode(data.token);
      }
    } catch (err) {
      console.error('[QRKiosk] Failed to fetch new QR token:', err);
    }
  }

  renderQRCode(token) {
    if (!this.qrContainer) return;
    this.qrContainer.innerHTML = ''; // Clear previous QR

    // Full URL: https://comvas.gloomn.site/draw?token=...
    const fullUrl = `${window.location.origin}/draw?token=${token}`;

    new QRCode(this.qrContainer, {
      text: fullUrl,
      width: 140,
      height: 140,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M
    });
  }

  initQRCode() {
    this.fetchNewToken();
  }

  onCharacterSubmitted() {
    // When a participant submits a drawing, automatically refresh screen QR code!
    console.log('[QRKiosk] Drawing submitted! Auto-refreshing screen QR code...');
    this.fetchNewToken();
  }
}

window.liveQRKiosk = new LiveQRKiosk();
