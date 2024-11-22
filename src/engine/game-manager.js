import { BackgroundSystem } from '../systems/background-system.js';
import { ParticleSystem } from '../systems/particle-system.js';
import { EnemySpawner } from '../systems/enemy-spawner.js';
import { UpgradeSystem } from '../systems/upgrade-system.js';
import { GameCore } from './game-core.js';
import { GameCanvas } from './game-canvas.js';
import { GameEntities } from './game-entities.js';
import { GameUI } from './game-ui.js';

export class GameManager {
    constructor() {
        // Initialize core components
        this.gameCore = new GameCore(this);
        this.gameCanvas = new GameCanvas(this);
        this.gameEntities = new GameEntities(this);
        this.gameUI = new GameUI(this);

        // Initialize systems
        this.backgroundSystem = new BackgroundSystem(this);
        this.particleSystem = new ParticleSystem(this);
        this.enemySpawner = new EnemySpawner(this);
        this.upgradeSystem = new UpgradeSystem(this);
    }

    // Core game properties
    get isRunning() { return this.gameCore.isRunning; }
    get isPaused() { return this.gameCore.isPaused; }
    get debug() { return this.gameCore.debug; }
    get gameTime() { return this.gameCore.gameTime; }
    get fps() { return this.gameCore.fps; }
    get kills() { return this.gameCore.kills; }
    set kills(value) { this.gameCore.kills = value; }
    get killCount() { return this.gameCore.killCount; }
    set killCount(value) { this.gameCore.killCount = value; }
    get level() { return this.gameCore.level; }

    // Canvas properties
    get canvas() { return this.gameCanvas.canvas; }
    get ctx() { return this.gameCanvas.ctx; }

    // Entity properties
    get entities() { return this.gameEntities.entities; }
    get enemies() { return this.gameEntities.enemies; }

    // Game control methods
    start() {
        this.gameCore.start();
    }

    stop() {
        this.gameCore.stop();
    }

    pause() {
        this.gameCore.pause();
    }

    resume() {
        this.gameCore.resume();
    }

    // Update method
    update(deltaTime) {
        if (this.isPaused) return;

        // Update screen shake
        this.gameCanvas.updateScreenShake(deltaTime);

        // Update systems
        this.backgroundSystem?.update(deltaTime);
        this.enemySpawner?.update(deltaTime);
        this.particleSystem?.update(deltaTime);
        this.upgradeSystem?.update(deltaTime);

        // Update entities
        this.gameEntities.update(deltaTime);
    }

    // Draw method
    draw() {
        this.gameCanvas.beginDraw();

        // Draw background
        this.backgroundSystem?.draw(this.ctx);

        // Draw entities
        this.gameEntities.draw(this.ctx);

        // Draw particles
        this.particleSystem?.draw(this.ctx);

        // Draw UI
        this.gameUI.draw(this.ctx);

        this.gameCanvas.endDraw();
    }

    // Entity management methods
    addEnemy(enemy) {
        this.gameEntities.addEnemy(enemy);
    }

    removeEnemy(enemy) {
        this.gameEntities.removeEnemy(enemy);
        this.kills++;
        this.killCount++;
        this.updateHeroLevel();
    }

    addProjectile(projectile) {
        this.gameEntities.addProjectile(projectile);
    }

    removeProjectile(projectile) {
        this.gameEntities.removeProjectile(projectile);
    }

    // Utility methods
    startScreenShake(intensity, duration) {
        this.gameCanvas.startScreenShake(intensity, duration);
    }

    createParticles(config) {
        this.particleSystem?.createParticles(config);
    }

    updateHeroLevel() {
        const hero = this.entities.hero;
        if (!hero) return;

        const killsNeeded = this.getKillsForNextLevel(hero.level);
        if (this.killCount >= killsNeeded) {
            hero.level++;
            this.killCount = 0;
            this.upgradeSystem.showUpgradeMenu();
        }
    }

    getKillsForNextLevel(currentLevel) {
        return this.gameCore.getKillsForNextLevel(currentLevel);
    }
}