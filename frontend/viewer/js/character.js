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
    
    // Spawn at random location near screen center
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.x = w * 0.2 + Math.random() * (w * 0.6);
    this.y = h * 0.3 + Math.random() * (h * 0.5);
    this.sprite.x = this.x;
    this.sprite.y = this.y;

    // Movement & Random Path Variables
    this.speed = 1.0 + Math.random() * 0.6;
    this.targetX = this.x;
    this.targetY = this.y;
    this.pickNewTarget();

    // Add to WebGL stage
    this.stageApp.stage.addChild(this.sprite);
  }

  pickNewTarget() {
    const margin = 100;
    const w = window.innerWidth - margin * 2;
    const h = window.innerHeight - margin * 2;
    
    this.targetX = margin + Math.random() * w;
    this.targetY = margin + Math.random() * h;
  }

  update(delta) {
    if (this.isFadingOut) return;

    // Move character along random stage path
    const dx = this.targetX - this.sprite.x;
    const dy = this.targetY - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 20) {
      this.pickNewTarget();
    } else {
      this.sprite.x += (dx / dist) * this.speed * delta;
      this.sprite.y += (dy / dist) * this.speed * delta;
      
      // Flip sprite orientation depending on movement direction
      if (dx > 0) this.sprite.scale.x = Math.abs(this.sprite.scale.x);
      else if (dx < 0) this.sprite.scale.x = -Math.abs(this.sprite.scale.x);
    }
    
    // Strict border clamping to keep characters strictly within the screen
    const margin = 50;
    this.sprite.x = Math.max(margin, Math.min(this.sprite.x, window.innerWidth - margin));
    this.sprite.y = Math.max(margin, Math.min(this.sprite.y, window.innerHeight - margin));

    // Sort z-index by Y coordinate for natural depth sorting
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
