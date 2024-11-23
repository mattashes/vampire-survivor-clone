import { GAME_CONFIG, logDebug } from '../config.js';
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
import { WeaponMenu } from '../ui/weapon-menu.js';
import { InputManager } from '../input/input-manager.js';

export class GameManager {
    constructor() {
        // Initialize core components
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set initial canvas size
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Initialize game state
        this.isRunning = false;
        this.isPaused = false;
        this.debug = GAME_CONFIG.debug;

        // Initialize input manager first
        this.inputManager = new InputManager();

        // Initialize systems in correct order
        this.core = new GameCore(this);
        this.gameCanvas = new GameCanvas(this);
        this.gameEntities = new GameEntities(this);
        this.terrainSystem = new TerrainSystem(this);
        this.enemySpawner = new EnemySpawner(this);
        this.particleSystem = new ParticleSystem(this);
        this.gameUI = new GameUI(this);
        this.weaponMenu = new WeaponMenu(this);

        // Add window resize handler
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });

        if (this.debug) {
            logDebug('GameManager initialized');
        }
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.core.start();
            if (this.debug) {
                logDebug('Game started');
            }
        }
    }

    update(deltaTime) {
        if (!this.isRunning || this.isPaused) return;

        this.terrainSystem.update(deltaTime);
        this.gameEntities.update(deltaTime);
        this.enemySpawner.update(deltaTime);
        this.particleSystem.update(deltaTime);
        this.gameUI.update(deltaTime);
    }

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

        // Draw game elements
        this.terrainSystem.draw(this.ctx);
        this.gameEntities.draw(this.ctx);
        this.particleSystem.draw(this.ctx);

        // Restore transform before drawing UI
        this.ctx.restore();

        // Draw UI (not affected by camera)
        this.gameUI.draw(this.ctx);
        // Remove weaponMenu.draw since it uses DOM elements

        this.gameCanvas.endDraw();
    }

    pause() {
        this.isPaused = true;
        if (this.debug) {
            logDebug('Game paused');
        }
    }

    resume() {
        this.isPaused = false;
        if (this.debug) {
            logDebug('Game resumed');
        }
    }

    // Entity management methods
    addEnemy(enemy) {
        this.gameEntities.addEnemy(enemy);
    }

    removeEnemy(enemy) {
        this.gameEntities.removeEnemy(enemy);
        this.core.kills++;
        this.core.killCount++;
        this.updateHeroLevel();
    }

    addProjectile(projectile) {
        this.gameEntities.addProjectile(projectile);
    }

    removeProjectile(projectile) {
        this.gameEntities.removeProjectile(projectile);
    }

    updateHeroLevel() {
        const killsNeeded = this.core.getKillsForNextLevel(this.core.level);
        if (this.core.killCount >= killsNeeded) {
            this.core.level++;
            this.core.killCount = 0;
            if (this.gameEntities.hero) {
                this.gameEntities.hero.onLevelUp();
            }
            if (this.debug) {
                logDebug(`Level up! Now level ${this.core.level}`);
            }
        }
    }
}