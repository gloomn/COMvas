class StageCharacter {
  constructor(data, stageApp) {
    this.id = data.character_id;
    this.stageApp = stageApp;
    this.isFadingOut = false;
    
    // Create PIXI.AnimatedSprite from joint animation keyframe PNG sequence
    if (data.frames && data.frames.length > 0) {
      const textures = data.frames.map(b64 => PIXI.Texture.from(b64));
      this.sprite = new PIXI.AnimatedSprite(textures);
      this.sprite.animationSpeed = 0.65; // Even Faster Dance Motion!
      this.sprite.play();
    } else {
      // Fallback single texture
      const texture = PIXI.Texture.from(data.image_base64 || data.image_url);
      this.sprite = new PIXI.Sprite(texture);
    }

    this.sprite.anchor.set(0.5, 0.9); // Anchor at bottom center (feet)

    // Compute logical screen bounds relative to scale
    const scale = this.stageApp.stage.scale.x || 1;
    const logicalWidth = this.stageApp.screen.width / scale;
    const logicalHeight = this.stageApp.screen.height / scale;

    // Stage pseudo-3D setup (Band depth)
    const minY = logicalHeight - 350;
    const maxY = logicalHeight - 80;
    this.y = minY + Math.random() * (maxY - minY);
    
    // Scale characters based on Y (pseudo-3D perspective: objects further back are slightly smaller)
    // Size goes from 0.5 at the back (minY) to 0.65 at the front (maxY) (Exactly half of original)
    const perspectiveScale = 1.0 + ((this.y - minY) / (maxY - minY)) * 0.3;
    this.sprite.scale.set(perspectiveScale);

    // Exact Border Bouncing Margin (logical space)
    this.margin = 50;

    // Give characters a slower velocity so they glide elegantly (hides FPS drops)
    this.vx = (Math.random() > 0.5 ? 1 : -1) * (0.2 + Math.random() * 0.4);

    // Spawn character across the stage randomly, but keep them strictly inside bounds
    const spawnMargin = this.margin + 100; // Extra padding
    this.x = spawnMargin + Math.random() * (logicalWidth - spawnMargin * 2);
    
    this.sprite.x = this.x;
    this.sprite.y = this.y;
    
    // Set zIndex based on Y position + random tie-breaker to prevent flickering (Z-fighting)
    this.sprite.zIndex = this.y + (Math.random() * 0.5);

    // Add to WebGL stage
    this.stageApp.stage.addChild(this.sprite);
  }

  update(delta) {
    if (this.isFadingOut) return;

    // 1. Move character horizontally
    this.sprite.x += this.vx * delta;

    const scale = this.stageApp.stage.scale.x || 1;
    const logicalWidth = this.stageApp.screen.width / scale;
    const margin = this.margin; 
    
    // Left border hit
    if (this.sprite.x <= margin) {
      this.sprite.x = margin;
      this.vx = Math.abs(this.vx); // Bounce right
    } 
    // Right border hit
    else if (this.sprite.x >= logicalWidth - margin) {
      this.sprite.x = logicalWidth - margin;
      this.vx = -Math.abs(this.vx); // Bounce left
    }

    // 3. Flip sprite orientation depending on movement direction
    if (this.vx > 0) {
      this.sprite.scale.x = Math.abs(this.sprite.scale.x);
    } else if (this.vx < 0) {
      this.sprite.scale.x = -Math.abs(this.sprite.scale.x);
    }
    
    // Strict Y Coordinate Lock is removed from ticker because Y doesn't change after spawn
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
        
        // --- MEMORY OPTIMIZATION ---
        // Destroy all base64 textures from GPU VRAM completely to prevent memory leaks
        if (this.sprite.textures) {
          this.sprite.textures.forEach(t => t.destroy(true));
        } else if (this.sprite.texture) {
          this.sprite.texture.destroy(true);
        }
        
        this.sprite.destroy({ children: true, texture: false, baseTexture: false });
        // ---------------------------

        if (onComplete) onComplete(this.id);
      } else {
        this.sprite.alpha = 1.0 - progress;
      }
    };

    this.stageApp.ticker.add(fadeTicker);
  }
}

window.StageCharacter = StageCharacter;
