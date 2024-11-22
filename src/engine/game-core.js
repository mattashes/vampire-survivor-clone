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
        // Base requirement is 5 kills for first level
        const baseKills = 5;
        // Each level requires more kills, scaling quadratically but capped
        const scaleFactor = Math.min(currentLevel * 0.5, 5); // Cap the scaling at 5x
        return Math.floor(baseKills * scaleFactor);
    }

    gameOver() {
        this.isRunning = false;
        logDebug('Game Over');
    }
}