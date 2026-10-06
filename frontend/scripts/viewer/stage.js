class StageEngine {
  constructor() {
    this.container = document.getElementById('stageContainer');
    this.app = new PIXI.Application({
      resizeTo: window,
      backgroundAlpha: 0,
      antialias: false, // Force disable MSAA (huge cause of Mac Chrome stuttering)
      resolution: 1, 
      autoDensity: true,
      powerPreference: 'high-performance'
    });
    // Ensure pixel snapping to prevent sub-pixel interpolation jitter
    PIXI.settings.ROUND_PIXELS = true;

    this.container.appendChild(this.app.view);
    this.initBackgroundGrid();

    // Responsive scaling based on a base height of 1080
    this.resizeStage();
    window.addEventListener('resize', () => this.resizeStage());
  }

  resizeStage() {
    const scale = this.app.screen.height / 1080;
    this.app.stage.scale.set(scale);
  }

  initBackgroundGrid() {
    // We moved the background to CSS (stage_background.jpg) for better responsive scaling
    // Just ensure sorting is enabled for characters
    this.app.stage.sortableChildren = true;
  }
}

window.stageEngine = new StageEngine();
