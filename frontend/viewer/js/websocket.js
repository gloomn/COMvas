function connectStageWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws/stage`;
  
  console.log(`[StageWS] Connecting to ${wsUrl}...`);
  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('[StageWS] WebSocket Connected to Jetson Stage Server.');
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      console.log('[StageWS] Event received:', msg.event);

      if (msg.event === 'NEW_CHARACTER') {
        window.queueManager.addCharacter(msg.data);
      }
    } catch (e) {
      console.error('[StageWS] Failed to parse WebSocket message:', e);
    }
  };

  ws.onclose = () => {
    console.warn('[StageWS] WebSocket disconnected. Retrying in 3 seconds...');
    setTimeout(connectStageWebSocket, 3000);
  };

  ws.onerror = (err) => {
    console.error('[StageWS] WebSocket Error:', err);
    ws.close();
  };
}

document.addEventListener('DOMContentLoaded', connectStageWebSocket);
