document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('objectsGrid');
  const refreshBtn = document.getElementById('refreshBtn');

  const staticCountEl = document.getElementById('staticCount');
  const charCountEl = document.getElementById('charCount');

  async function loadObjects() {
    try {
      grid.innerHTML = '<div style="color: #666;">로딩 중...</div>';
      const res = await fetch('/api/v1/admin/objects');
      const data = await res.json();
      
      grid.innerHTML = '';
      
      let staticCount = 0;
      let charCount = 0;

      if (!data.objects || data.objects.length === 0) {
        grid.innerHTML = '<div style="color: #666;">현재 무대에 아무것도 없습니다.</div>';
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
          <div class="type">${obj.type === 'STATIC' ? '⭐ 소품' : '🕺 캐릭터'}</div>
          <div class="id">${obj.id}</div>
          <button class="delete-btn" data-id="${obj.id}">🗑️ 삭제</button>
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
            await fetch('/api/v1/admin/delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id })
            });
            loadObjects(); // Reload list
          }
        });
      });

    } catch (e) {
      grid.innerHTML = '<div style="color: red;">오류가 발생했습니다.</div>';
    }
  }

  refreshBtn.addEventListener('click', loadObjects);
  loadObjects();
});
