document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('objectsGrid');
  const refreshBtn = document.getElementById('refreshBtn');
  const staticCountEl = document.getElementById('staticCount');
  const charCountEl = document.getElementById('charCount');
  const logContainer = document.getElementById('logContainer');
  const clearLogBtn = document.getElementById('clearLogBtn');
  const refreshQrBtn = document.getElementById('refreshQrBtn');

  // Password Unlock Logic
  const overlay = document.getElementById('passwordOverlay');
  const passInput = document.getElementById('adminPassword');
  const unlockBtn = document.getElementById('unlockBtn');
  let isAdminUnlocked = false;
  let adminToken = "";

  unlockBtn.addEventListener('click', async () => {
    const password = passInput.value;
    try {
      const res = await fetch('/api/v1/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (res.ok) {
        const data = await res.json();
        adminToken = data.admin_token;
        isAdminUnlocked = true;
        overlay.style.display = 'none';
        // Refresh grid after unlock
        fetchObjectsGrid();
      } else {
        alert("비밀번호가 틀렸습니다.");
      }
    } catch (err) {
      alert("서버 연결 실패");
    }
  });

  function addLog(msg, type = '') {
    const logItem = document.createElement('div');
    logItem.className = `log-item ${type}`;
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    logItem.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-msg">${msg}</span>`;
    logContainer.append(logItem); // Terminal style adds to bottom
    logContainer.scrollTop = logContainer.scrollHeight; // Auto scroll
    if (logContainer.children.length > 200) {
      logContainer.removeChild(logContainer.firstChild);
    }
  }

  clearLogBtn.addEventListener('click', () => {
    logContainer.innerHTML = '';
  });

  async function loadObjects() {
    try {
      const res = await fetch('/api/v1/admin/objects', {
        headers: { 'Authorization': 'Bearer ' + adminToken }
      });
      const data = await res.json();
      
      grid.innerHTML = '';
      
      let staticCount = 0;
      let charCount = 0;

      if (!data.objects || data.objects.length === 0) {
        grid.innerHTML = '<div style="color: #666; grid-column: 1 / -1; text-align: center; padding: 40px; font-size: 1.2rem;">현재 무대에 아무것도 없습니다.</div>';
        staticCountEl.textContent = '0';
        charCountEl.textContent = '0';
        return;
      }

      data.objects.forEach(obj => {
        if (obj.type === 'STATIC') staticCount++;
        else charCount++;

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <img src="${obj.thumbnail}" alt="Thumbnail">
          <div class="type">${obj.type === 'STATIC' ? '[Static] 무대 소품' : '[Char] 춤추는 캐릭터'}</div>
          <div class="id">${obj.id}</div>
          <button class="delete-btn" data-id="${obj.id}">[DELETE] 무대에서 삭제</button>
        `;
        grid.appendChild(card);
      });
      
      staticCountEl.textContent = staticCount;
      charCountEl.textContent = charCount;

      // Bind delete buttons
      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.target.getAttribute('data-id');
          if (confirm('정말 삭제하시겠습니까? 무대에서 즉시 사라집니다.')) {
            addLog(`> DELETE_CMD: ${id}`, 'log-delete');
            await fetch('/api/v1/admin/delete', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + adminToken 
              },
              body: JSON.stringify({ id })
            });
            setTimeout(loadObjects, 500);
          }
        });
      });

    } catch (e) {
      grid.innerHTML = '<div style="color: red; grid-column: 1/-1; text-align: center; padding: 40px;">오류가 발생했습니다.</div>';
    }
  }

  refreshBtn.addEventListener('click', () => {
    addLog("> SYNC_CMD: 수동 데이터 동기화 요청...");
    loadObjects();
  });
  
  if (refreshQrBtn) {
    refreshQrBtn.addEventListener('click', async () => {
      addLog("> QR_REFRESH_CMD: QR코드 강제 갱신 요청...");
      try {
        await fetch('/api/v1/admin/qr/refresh', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + adminToken }
        });
      } catch (e) {
        addLog("> ERROR: QR 갱신 실패", "log-delete");
      }
    });
  }
  
  loadObjects();
  addLog("> SYSTEM_READY: 관리자 패널 로드 완료. 시스템 대기 중...");

  // WebSocket for Live Logs
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/api/v1/ws`;
  
  let ws;
  function connectWebSocket() {
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      addLog("> WS_CONNECTED: 실시간 시스템 연결됨", "log-new");
    };
    
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'NEW_CHARACTER' || msg.event === 'NEW_CHARACTER') {
          addLog(`> NEW_CHAR: ${msg.data.character_id}`, 'log-new');
          loadObjects();
        } else if (msg.type === 'NEW_STATIC' || msg.event === 'NEW_STATIC') {
          addLog(`> NEW_STATIC: ${msg.data.object_id}`, 'log-new');
          loadObjects();
        } else if (msg.type === 'DELETE_OBJECT' || msg.event === 'DELETE_OBJECT') {
          addLog(`> DEL_OBJ: ${msg.data.id}`, 'log-delete');
          loadObjects();
        } else if (msg.type === 'SERVER_LOG' || msg.event === 'SERVER_LOG') {
          addLog(`> ${msg.message}`, 'log-server');
        } else if (msg.type === 'QR_REFRESH_REQUEST' || msg.event === 'QR_REFRESH_REQUEST') {
          addLog(`> EVENT: QR코드 갱신 브로드캐스트 전송됨`, 'log-server');
        } else if (msg.type === 'QR_SCANNED' || msg.event === 'QR_SCANNED') {
          addLog(`> EVENT: 사용자 QR 스캔 감지됨`, 'log-server');
        }
      } catch(e) {}
    };
    
    ws.onclose = () => {
      addLog("> WS_DISCONNECTED: 실시간 연결 끊김. 3초 후 재연결 시도...", "log-delete");
      setTimeout(connectWebSocket, 3000);
    };
  }
  
  connectWebSocket();
});
