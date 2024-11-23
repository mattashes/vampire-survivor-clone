import { GAME_CONFIG } from '../config.js';
import { logDebug } from '../config.js';

export class GameCore {
    constructor(game) {
        this.game = game;
        this.isRunning = false;
        this._isPaused = false;
        this.debug = GAME_CONFIG.debug;
        this.gameTime = 0;
        this.lastTime = performance.now();
        this.fps = 0;
        this.frameCount = 0;
        this.lastFPSUpdate = 0;
        this.kills = 0;
        this.killCount = 0;
        this.level = 1;
    }

    start() {
        if (!this.isRunning) {
            logDebug('Starting game');
            this.isRunning = true;
            this.lastTime = performance.now();
            requestAnimationFrame(() => this.gameLoop());
        }
    }

    stop() {
        this.isRunning = false;
        logDebug('Game stopped');
    }

    pause() {
        this._isPaused = true;
        logDebug('Game paused');
    }

    resume() {
        this._isPaused = false;
        this.lastTime = performance.now();
        logDebug('Game resumed');
    }

    get isPaused() {
        return this._isPaused;
    }

    set isPaused(value) {
        this._isPaused = value;
        if (this.debug) {
            logDebug(`Game ${value ? 'paused' : 'resumed'}`);
        }
    }

    updateFPS(currentTime) {
        this.frameCount++;
        const elapsed = currentTime - this.lastFPSUpdate;
        if (elapsed >= 1000) {
            this.fps = Math.round(this.frameCount / (elapsed / 1000));
            this.frameCount = 0;
            this.lastFPSUpdate = currentTime;
            if (this.debug) {
                logDebug(`Current FPS: ${this.fps}`);
            }
        }
    }

    gameLoop() {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        this.gameTime += deltaTime;

        this.updateFPS(currentTime);
        this.game.update(deltaTime);
        this.game.draw();

        requestAnimationFrame(() => this.gameLoop());
    }

    getKillsForNextLevel(currentLevel) {
        // First level requires 50 kills
        if (currentLevel === 1) return 50;
        
        // Second level requires 150 kills
        if (currentLevel === 2) return 150;
        
        // For levels 3 and beyond, increase by 100 kills per level
        // This means level 3 needs 250, level 4 needs 350, etc.
        return 150 + ((currentLevel - 2) * 100);
    }

    gameOver() {
        this.isRunning = false;
        this.stop();

        // Pause all game systems
        if (this.game.enemySpawner) {
            this.game.enemySpawner.isPaused = true;
        }

        // Show game over UI
        if (this.game.gameUI) {
            this.game.gameUI.showGameOver();
        }

        if (this.debug) {
            logDebug('Game Over');
        }

        // Save game stats
        this.saveGameStats();
    }

    saveGameStats() {
        const stats = {
            kills: this.kills,
            level: this.level,
            gameTime: this.gameTime,
            date: new Date().toISOString()
        };

        // Save to localStorage
        try {
            const highScores = JSON.parse(localStorage.getItem('highScores') || '[]');
            highScores.push(stats);
            highScores.sort((a, b) => b.kills - a.kills);
            localStorage.setItem('highScores', JSON.stringify(highScores.slice(0, 10)));
        } catch (e) {
            if (this.debug) {
                logDebug('Failed to save game stats:', e);
            }
        }
    }
}