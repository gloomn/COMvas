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
    // Physical collision pushing removed. 
    // Characters will now elegantly pass each other using their 3D Z-index depths instead of clashing chaotically!
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
    
    // Scale it down slightly so it's not huge and doesn't overlap dancers
    sprite.scale.set(0.25);
    sprite.anchor.set(0.5);
    
    // Compute logical screen bounds
    const scale = this.stageEngine.app.stage.scale.x || 1;
    const logicalWidth = this.stageEngine.app.screen.width / scale;
    const logicalHeight = this.stageEngine.app.screen.height / scale;

    // Random position in the top 25% of the screen (Sky/Background area)
    const padding = 100;
    const minX = padding;
    const maxX = logicalWidth - padding;
    sprite.x = minX + Math.random() * (maxX - minX);
    sprite.y = padding + Math.random() * (logicalHeight * 0.25);
    
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
