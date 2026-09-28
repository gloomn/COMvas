class StageCharacter {
  constructor(data, stageApp) {
    this.id = data.character_id;
    this.stageApp = stageApp;
    this.isFadingOut = false;
    
    // Create PIXI.AnimatedSprite from joint animation keyframe PNG sequence
    if (data.frames && data.frames.length > 0) {
      const textures = data.frames.map(b64 => PIXI.Texture.from(b64));
      this.sprite = new PIXI.AnimatedSprite(textures);
      this.sprite.animationSpeed = 0.22; // ~14 FPS Joint Dance Motion
      this.sprite.play();
    } else {
      // Fallback single texture
      const texture = PIXI.Texture.from(data.image_base64 || data.image_url);
      this.sprite = new PIXI.Sprite(texture);
    }

    this.sprite.anchor.set(0.5, 0.9); // Anchor at bottom center (feet)
    this.sprite.scale.set(0.35);

    // Spawn strictly in the exact center of the PIXI screen
    this.x = this.stageApp.app.screen.width / 2;
    this.y = this.stageApp.app.screen.height / 2;
    this.sprite.x = this.x;
    this.sprite.y = this.y;

    // Movement Velocity (Walk horizontally left or right)
    this.speed = 1.0 + Math.random() * 0.6;
    
    // Check animation type: only moving animations (e.g. running jump) should travel across the screen
    if (data.motion === 'jumping') {
      this.vx = (Math.random() > 0.5 ? 1 : -1) * this.speed;
    } else {
      // Stationary animations (jumping_jacks, dab, jesse_dance) stay exactly where they spawn
      this.vx = 0;
    }

    // Add to WebGL stage
    this.stageApp.stage.addChild(this.sprite);
  }

  update(delta) {
    if (this.isFadingOut) return;

    // 1. Move character horizontally
    this.sprite.x += this.vx * delta;

    // 2. Exact Border Bouncing Logic using PIXI logical screen width
    // margin=40 allows the visible pixels (arms) to perfectly touch the screen edge
    // because the 512x512 GIF has some transparent padding around the character.
    const margin = 40; 
    
    // Left border hit
    if (this.sprite.x <= margin) {
      this.sprite.x = margin;
      this.vx = Math.abs(this.vx); // Bounce right
    } 
    // Right border hit
    else if (this.sprite.x >= this.stageApp.app.screen.width - margin) {
      this.sprite.x = this.stageApp.app.screen.width - margin;
      this.vx = -Math.abs(this.vx); // Bounce left
    }

    // 3. Flip sprite orientation depending on movement direction
    if (this.vx > 0) {
      this.sprite.scale.x = Math.abs(this.sprite.scale.x);
    } else if (this.vx < 0) {
      this.sprite.scale.x = -Math.abs(this.sprite.scale.x);
    }
    
    // 4. Strict Y Coordinate Lock
    this.sprite.y = this.y;
    this.sprite.zIndex = this.sprite.y;
  }

  fadeOutAndDestroy(durationMs = 2000, onComplete) {
    this.isFadingOut = true;
    const startTime = Date.now();

    const fadeTicker = (delta) => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / durationMs;
      
      if (progress >= 1.0) {
        this.sprite.alpha = 0;
        this.stageApp.stage.removeChild(this.sprite);
        this.stageApp.ticker.remove(fadeTicker);
        this.sprite.destroy();
        if (onComplete) onComplete(this.id);
      } else {
        this.sprite.alpha = 1.0 - progress;
      }
    };

    this.stageApp.ticker.add(fadeTicker);
  }
}

window.StageCharacter = StageCharacter;
