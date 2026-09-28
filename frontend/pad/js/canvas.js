class DrawingPadCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.isDrawing = false;
    this.currentColor = '#000000';
    this.brushSize = 6;
    
    this.initCanvas();
    this.bindEvents();
  }

  initCanvas() {
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.lineWidth = this.brushSize;
    this.ctx.strokeStyle = this.currentColor;
    this.clear();
  }

  clear() {
    // Fill white background initially
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  setColor(color) {
    this.currentColor = color;
    this.ctx.strokeStyle = color;
  }

  getPointerPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    
    let clientX = e.clientX;
    let clientY = e.clientY;
    
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  startDrawing(e) {
    e.preventDefault();
    this.isDrawing = true;
    const pos = this.getPointerPos(e);
    this.ctx.beginPath();
    this.ctx.moveTo(pos.x, pos.y);
  }

  draw(e) {
    if (!this.isDrawing) return;
    e.preventDefault();
    const pos = this.getPointerPos(e);
    this.ctx.lineTo(pos.x, pos.y);
    this.ctx.stroke();
  }

  stopDrawing(e) {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    this.ctx.closePath();
  }

  bindEvents() {
    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('mousemove', (e) => this.draw(e));
    this.canvas.addEventListener('mouseup', (e) => this.stopDrawing(e));
    this.canvas.addEventListener('mouseleave', (e) => this.stopDrawing(e));

    // Touch events
    this.canvas.addEventListener('touchstart', (e) => this.startDrawing(e), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this.draw(e), { passive: false });
    this.canvas.addEventListener('touchend', (e) => this.stopDrawing(e));

    // Color buttons
    document.querySelectorAll('.color-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.setColor(e.target.dataset.color);
      });
    });

    // Clear button
    document.getElementById('clearBtn').addEventListener('click', () => this.clear());
  }

  toBlob() {
    return new Promise((resolve) => {
      this.canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  }
}

window.DrawingPadCanvas = DrawingPadCanvas;
