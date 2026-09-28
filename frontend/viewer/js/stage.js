class StageEngine {
  constructor() {
    this.container = document.getElementById('stageContainer');
    this.app = new PIXI.Application({
      resizeTo: window,
      backgroundColor: 0x0a0c16,
      antialias: true,
      resolution: window.devicePixelRatio || 1
    });

    this.container.appendChild(this.app.view);
    this.initBackgroundGrid();
  }

  initBackgroundGrid() {
    const gridGraphics = new PIXI.Graphics();
    gridGraphics.lineStyle(1, 0x1e293b, 0.4);

    const step = 80;
    for (let x = 0; x < window.innerWidth; x += step) {
      gridGraphics.moveTo(x, 0);
      gridGraphics.lineTo(x, window.innerHeight);
    }
    for (let y = 0; y < window.innerHeight; y += step) {
      gridGraphics.moveTo(0, y);
      gridGraphics.lineTo(window.innerWidth, y);
    }
    this.app.stage.addChild(gridGraphics);
  }
}

window.stageEngine = new StageEngine();
