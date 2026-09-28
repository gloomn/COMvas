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

  updateHUD() {
    if (this.charCountEl) {
      this.charCountEl.textContent = this.activeCharacters.length;
    }
  }
}

window.queueManager = new CharacterQueueManager(window.stageEngine);
