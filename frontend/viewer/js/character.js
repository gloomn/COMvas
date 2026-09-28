class StageCharacter {
  constructor(data, stageApp) {
    this.id = data.character_id;
    this.stageApp = stageApp;
    this.isFadingOut = false;
    
    // Create Sprite from base64/URL image
    this.texture = PIXI.Texture.from(data.image_base64 || data.image_url);
    this.sprite = new PIXI.Sprite(this.texture);
    this.sprite.anchor.set(0.5, 0.9); // Anchor at bottom center (feet)
    
    // Scale character
    this.sprite.scale.set(0.35);
    
    // Spawn at random location near screen center
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.x = w * 0.2 + Math.random() * (w * 0.6);
    this.y = h * 0.3 + Math.random() * (h * 0.5);
    this.sprite.x = this.x;
    this.sprite.y = this.y;

    // Movement & Random Path Variables
    this.speed = 1.2 + Math.random() * 0.8;
    this.targetX = this.x;
    this.targetY = this.y;
    this.pickNewTarget();

    // Dance Animation Swaying Variables
    this.timeCounter = Math.random() * 100;
    this.swaySpeed = 0.08 + Math.random() * 0.04;
    
    // Add to stage
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

    // 1. Move towards random target path
    const dx = this.targetX - this.sprite.x;
    const dy = this.targetY - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 20) {
      this.pickNewTarget();
    } else {
      this.sprite.x += (dx / dist) * this.speed * delta;
      this.sprite.y += (dy / dist) * this.speed * delta;
      
      // Flip sprite based on movement direction
      if (dx > 0) this.sprite.scale.x = Math.abs(this.sprite.scale.x);
      else if (dx < 0) this.sprite.scale.x = -Math.abs(this.sprite.scale.x);
    }

    // 2. Dance Loop (Sway & Bounce)
    this.timeCounter += this.swaySpeed * delta;
    this.sprite.rotation = Math.sin(this.timeCounter) * 0.15;
    this.sprite.scale.y = 0.35 + Math.cos(this.timeCounter * 2) * 0.02;

    // Sort z-index by Y coordinate for depth sorting
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
