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
        
        // Auto-refresh screen QR code to a fresh 1-time token for next participant!
        if (window.liveQRKiosk) {
          window.liveQRKiosk.onCharacterSubmitted();
        }
      } else if (msg.type === 'NEW_STATIC' || msg.event === 'NEW_STATIC') {
        window.queueManager.addStatic(msg.data);
      } else if (msg.event === 'DELETE_OBJECT') {
        window.queueManager.removeObject(msg.data.id);
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

async function syncExistingObjects() {
  try {
    const res = await fetch('/api/v1/admin/objects');
    const data = await res.json();
    if (data.objects) {
      // Objects are returned newest first, so we reverse to render oldest first
      const oldestFirst = data.objects.slice().reverse();
      oldestFirst.forEach(obj => {
        if (obj.full_message) {
          const msg = obj.full_message;
          const eventType = msg.type || msg.event;
          if (eventType === 'NEW_CHARACTER') {
            window.queueManager.addCharacter(msg.data);
          } else if (eventType === 'NEW_STATIC') {
            window.queueManager.addStatic(msg.data);
          }
        }
      });
    }
  } catch (e) {
    console.error('[Stage Sync] Failed to sync existing objects:', e);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  syncExistingObjects();
  connectStageWebSocket();
});
