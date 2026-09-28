class DrawingPadCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.isDrawing = false;
    this.currentColor = '#000000';
    // Decrease brush size for finer drawing
    this.brushSize = 5;
    
    // Undo/Redo Stacks
    this.undoStack = [];
    this.redoStack = [];
    
    this.initCanvas();
    this.bindEvents();
  }

  initCanvas() {
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.lineWidth = this.brushSize;
    this.setColor(this.currentColor);
    this.isErasing = false;
    this.clear();
    // Clear undo/redo on init
    this.undoStack = [];
    this.redoStack = [];
    this.saveState(); // Initial blank state
  }

  clear() {
    // Clear canvas completely to keep it transparent (Signature style)
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  saveState() {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.undoStack.push(imageData);
    // Keep stack size manageable
    if (this.undoStack.length > 20) {
      this.undoStack.shift();
    }
    this.redoStack = []; // Clear redo stack on new action
  }

  undo() {
    if (this.undoStack.length > 1) {
      const currentState = this.undoStack.pop();
      this.redoStack.push(currentState);
      const previousState = this.undoStack[this.undoStack.length - 1];
      this.ctx.putImageData(previousState, 0, 0);
    }
  }

  redo() {
    if (this.redoStack.length > 0) {
      const nextState = this.redoStack.pop();
      this.undoStack.push(nextState);
      this.ctx.putImageData(nextState, 0, 0);
    }
  }

  setColor(color) {
    this.isErasing = false;
    this.ctx.globalCompositeOperation = 'source-over';
    this.currentColor = color;
    this.ctx.strokeStyle = color;
    // Neon glow effect
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = color;
  }

  setEraser() {
    this.isErasing = true;
    this.ctx.globalCompositeOperation = 'destination-out';
    this.ctx.strokeStyle = 'rgba(0,0,0,1)'; // The color doesn't matter for destination-out, but alpha must be 1
    this.ctx.shadowBlur = 0; // Turn off glow for eraser
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
    this.saveState();
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
    document.querySelectorAll('.color-btn:not(.eraser-btn)').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.setColor(e.target.dataset.color);
        // Sync custom picker background if we want, but it's fine as is.
      });
    });

    // Custom Color Picker
    const customColorInput = document.getElementById('customColor');
    if (customColorInput) {
      customColorInput.addEventListener('input', (e) => {
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        // Make its wrapper look active
        customColorInput.parentElement.classList.add('active');
        this.setColor(e.target.value);
      });
    }

    // Eraser button
    const eraserBtn = document.getElementById('eraserBtn');
    if (eraserBtn) {
      eraserBtn.addEventListener('click', () => {
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        if (customColorInput) customColorInput.parentElement.classList.remove('active');
        eraserBtn.classList.add('active');
        this.setEraser();
      });
    }

    // Clear button
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.clear();
        this.saveState();
      });
    }

    // Undo/Redo buttons
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    if (undoBtn) undoBtn.addEventListener('click', () => this.undo());
    if (redoBtn) redoBtn.addEventListener('click', () => this.redo());
  }

  toBlob() {
    return new Promise((resolve) => {
      this.canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  }
}

window.DrawingPadCanvas = DrawingPadCanvas;
