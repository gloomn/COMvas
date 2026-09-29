class StageEngine {
  constructor() {
    this.container = document.getElementById('stageContainer');
    this.app = new PIXI.Application({
      resizeTo: window,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    });

    this.container.appendChild(this.app.view);
    this.initBackgroundGrid();
  }

  initBackgroundGrid() {
    // We moved the background to CSS (stage_background.jpg) for better responsive scaling
    // Just ensure sorting is enabled for characters
    this.app.stage.sortableChildren = true;
  }
}

window.stageEngine = new StageEngine();
