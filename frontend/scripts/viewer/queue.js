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
    
    // Character Collision Logic
    for (let i = 0; i < this.activeCharacters.length; i++) {
      for (let j = i + 1; j < this.activeCharacters.length; j++) {
        let charA = this.activeCharacters[i];
        let charB = this.activeCharacters[j];
        
        // Ignore fading out characters
        if (charA.isFadingOut || charB.isFadingOut) continue;
        
        let dist = Math.abs(charA.sprite.x - charB.sprite.x);
        
        // Hit detection (90px threshold for character width)
        if (dist < 90) {
          // Check if they are moving towards each other or overlapping too much
          if ((charA.sprite.x < charB.sprite.x && charA.vx > 0 && charB.vx < 0) || 
              (charA.sprite.x > charB.sprite.x && charA.vx < 0 && charB.vx > 0) ||
              dist < 30) 
          {
            // Elastic Bounce (swap velocities)
            let tempVx = charA.vx;
            charA.vx = charB.vx;
            charB.vx = tempVx;
            
            // Push apart slightly to prevent sticking
            charA.sprite.x += charA.vx * 3;
            charB.sprite.x += charB.vx * 3;
            
            // Spawn reaction emoji at midpoint
            this.spawnReactionEmoji(charA.sprite.x + (charB.sprite.x - charA.sprite.x)/2, charA.sprite.y - 140);
          }
        }
      }
    }

    // Sort z-indices so characters overlap naturally
    this.stageEngine.app.stage.children.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  }

  spawnReactionEmoji(x, y) {
    const emojis = ["❤️", "✨", "👋", "💦", "💥", "🎵"];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    const text = new PIXI.Text(emoji, { fontSize: 40 });
    text.anchor.set(0.5);
    text.x = x;
    text.y = y;
    text.zIndex = 99999;
    this.stageEngine.app.stage.addChild(text);

    let life = 1.0;
    const emojiTicker = () => {
      life -= 0.02;
      text.y -= 2.5; // Float upwards
      text.alpha = life;
      if (life <= 0) {
        this.stageEngine.app.stage.removeChild(text);
        this.stageEngine.app.ticker.remove(emojiTicker);
        text.destroy();
      }
    };
    this.stageEngine.app.ticker.add(emojiTicker);
  }

  addStatic(data) {
    // Generate a static sprite and place it at the top of the stage (Sky area)
    const texture = PIXI.Texture.from(data.image_data);
    const sprite = new PIXI.Sprite(texture);
    sprite.id = data.id; // Important for deletion
    
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
    const tickerFunc = () => {
      sprite.y = startY + Math.sin(Date.now() / 1000 + randomPhase) * 10;
    };
    this.stageEngine.app.ticker.add(tickerFunc);
    
    // Store in dictionary to allow deletion later
    if (!this.staticObjects) this.staticObjects = {};
    this.staticObjects[data.id] = { sprite, tickerFunc };
    
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

  removeObject(id) {
    // Try to remove character
    const charIndex = this.activeCharacters.findIndex(c => c.id === id);
    if (charIndex !== -1) {
      const char = this.activeCharacters[charIndex];
      char.fadeOutAndDestroy(500, () => {
        this.activeCharacters = this.activeCharacters.filter(c => c.id !== id);
        this.updateHUD();
      });
      return;
    }

    // Try to remove static
    if (this.staticObjects && this.staticObjects[id]) {
      const { sprite, tickerFunc } = this.staticObjects[id];
      this.stageEngine.app.ticker.remove(tickerFunc);
      
      // Fade out static
      let fadeOutInterval = setInterval(() => {
        sprite.alpha -= 0.1;
        if (sprite.alpha <= 0) {
          sprite.alpha = 0;
          this.stageEngine.app.stage.removeChild(sprite);
          sprite.destroy();
          delete this.staticObjects[id];
          clearInterval(fadeOutInterval);
        }
      }, 50);
    }
  }

  updateHUD() {
    if (this.charCountEl) {
      this.charCountEl.textContent = this.activeCharacters.length;
    }
  }
}

window.queueManager = new CharacterQueueManager(window.stageEngine);
