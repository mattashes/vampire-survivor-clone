import { BackgroundSystem } from '../systems/background-system.js';
import { ParticleSystem } from '../systems/particle-system.js';
import { EnemySpawner } from '../systems/enemy-spawner.js';
import { UpgradeSystem } from '../systems/upgrade-system.js';
import { TerrainSystem } from '../systems/terrain-system.js';
import { GameCore } from './game-core.js';
import { GameCanvas } from './game-canvas.js';
import { GameEntities } from './game-entities.js';
import { GameUI } from './game-ui.js';
import { WeaponDebugUI } from '../debug/weapon-debug.js';

export class GameManager {
    constructor() {
        // Initialize core components
        this.gameCore = new GameCore(this);
        this.gameCanvas = new GameCanvas(this);
        this.gameEntities = new GameEntities(this);
        this.gameUI = new GameUI(this);

        // Initialize systems
        this.terrainSystem = new TerrainSystem(this);
        this.backgroundSystem = new BackgroundSystem(this);
        this.particleSystem = new ParticleSystem(this);
        this.enemySpawner = new EnemySpawner(this);
        this.upgradeSystem = new UpgradeSystem(this);

        // Initialize debug UI
        this.weaponDebugUI = new WeaponDebugUI(this);
    }

    // Core game properties
    get isRunning() { return this.gameCore.isRunning; }
    get isPaused() { return this.gameCore.isPaused; }
    set isPaused(value) { this.gameCore.isPaused = value; }
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
        this.terrainSystem?.update(deltaTime);
        this.backgroundSystem?.update(deltaTime);
        this.enemySpawner?.update(deltaTime);
        this.particleSystem?.update(deltaTime);
        this.upgradeSystem?.update(deltaTime);

        // Update entities with collision detection
        const entities = [...this.entities.projectiles, ...this.entities.enemies];
        if (this.entities.hero) {
            entities.push(this.entities.hero);
        }

        for (const entity of entities) {
            const oldX = entity.x;
            const oldY = entity.y;
            
            // Update entity position
            entity.update(deltaTime);
            
            // Check collision with terrain
            if (this.terrainSystem.checkCollision(entity)) {
                // If collision occurred, revert position
                entity.x = oldX;
                entity.y = oldY;
            }
        }
    }

    // Draw method
    draw() {
        this.gameCanvas.beginDraw();

        // Apply terrain system transform
        this.ctx.save();
        const zoom = this.terrainSystem.zoom;
        this.ctx.scale(zoom, zoom);
        this.ctx.translate(
            -this.terrainSystem.camera.x,
            -this.terrainSystem.camera.y
        );

        // Draw background and terrain
        this.backgroundSystem?.draw(this.ctx);
        this.terrainSystem?.draw();

        // Draw entities
        this.gameEntities.draw(this.ctx);

        // Draw particles
        this.particleSystem?.draw(this.ctx);

        // Restore transform before drawing UI
        this.ctx.restore();

        // Draw UI (not affected by camera)
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
            hero.levelUp(); // This will set needsLevelUp flag
            this.killCount = 0;
            // The upgrade menu will be shown by the upgrade system when it detects needsLevelUp
        }
    }

    getKillsForNextLevel(currentLevel) {
        return this.gameCore.getKillsForNextLevel(currentLevel);
    }
}