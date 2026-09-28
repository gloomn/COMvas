class CharacterQueueManager {
  constructor(stageEngine, maxOnStage = 15) {
    this.stageEngine = stageEngine;
    this.maxOnStage = maxOnStage;
    this.activeCharacters = [];
    this.charCountEl = document.getElementById('charCount');

    // Register animation ticker loop
    this.stageEngine.app.ticker.add((delta) => this.update(delta));
  }

  addCharacter(data) {
    // If maximum N characters exceeded, remove oldest character (FIFO)
    if (this.activeCharacters.length >= this.maxOnStage) {
      const oldest = this.activeCharacters.shift();
      oldest.fadeOutAndDestroy(2000, () => {
        this.updateHUD();
      });
    }

    const newChar = new window.StageCharacter(data, this.stageEngine.app);
    this.activeCharacters.push(newChar);
    this.updateHUD();
  }

  update(delta) {
    this.activeCharacters.forEach(char => char.update(delta));
    // Sort z-indices so characters overlap naturally
    this.stageEngine.app.stage.children.sort((a, b) => a.zIndex - b.zIndex);
  }

  addStatic(data) {
    // Generate a static sprite and place it at the top of the stage (Sky area)
    const texture = PIXI.Texture.from(data.image_data);
    const sprite = new PIXI.Sprite(texture);
    
    // Scale it down slightly so it's not huge
    sprite.scale.set(0.4);
    sprite.anchor.set(0.5);
    
    // Random position in the top 40% of the screen (Sky/Background area)
    const padding = 100;
    const minX = padding;
    const maxX = this.stageEngine.app.screen.width - padding;
    sprite.x = minX + Math.random() * (maxX - minX);
    sprite.y = padding + Math.random() * (this.stageEngine.app.screen.height * 0.35);
    
    // Z-index sorting for static props (they should be strictly behind the characters, but in front of background)
    sprite.zIndex = -50 + sprite.y;
    
    // Add glowing effect or slight bobbing?
    this.stageEngine.app.stage.addChild(sprite);
    
    // Bobbing animation logic
    const startY = sprite.y;
    const randomPhase = Math.random() * Math.PI * 2;
    this.stageEngine.app.ticker.add(() => {
      sprite.y = startY + Math.sin(Date.now() / 1000 + randomPhase) * 10;
    });
    
    // Fade in
    sprite.alpha = 0;
    let fadeInterval = setInterval(() => {
      sprite.alpha += 0.05;
      if (sprite.alpha >= 1) {
        sprite.alpha = 1;
        clearInterval(fadeInterval);
      }
    }, 50);
  }

  updateHUD() {
    if (this.charCountEl) {
      this.charCountEl.textContent = this.activeCharacters.length;
    }
  }
}

window.queueManager = new CharacterQueueManager(window.stageEngine);
