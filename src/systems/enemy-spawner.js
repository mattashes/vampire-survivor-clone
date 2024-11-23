import { GAME_CONFIG, logDebug } from '../config.js';
import { FastEnemy, TankEnemy, SwarmEnemy } from '../entities/enemy-types.js';

export class EnemySpawner {
    constructor(game) {
        this.game = game;
        this.spawnTimer = 0;
        this.debug = GAME_CONFIG.debug;
        
        if (this.debug) {
            logDebug('EnemySpawner initialized');
        }
    }

    update(deltaTime) {
        if (!this.game?.gameEntities?.entities) {
            if (this.debug) logDebug('No valid game entities reference');
            return;
        }

        const currentEnemyCount = this.game.gameEntities.entities.enemies.size;

        // Spawn initial enemies if none exist
        if (currentEnemyCount < GAME_CONFIG.enemies.minCount) {
            this.spawnInitialEnemies();
            return;
        }

        // Update spawn timer
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= GAME_CONFIG.enemies.baseSpawnRate && 
            currentEnemyCount < GAME_CONFIG.enemies.maxCount) {
            this.spawnEnemy();
            this.spawnTimer = 0;
        }
    }

    spawnInitialEnemies() {
        const count = GAME_CONFIG.enemies.initialCount;
        for (let i = 0; i < count; i++) {
            this.spawnEnemy();
        }
        if (this.debug) {
            logDebug(`Spawned ${count} initial enemies`);
        }
    }

    spawnEnemy() {
        if (!this.game?.gameEntities?.entities?.hero) {
            if (this.debug) logDebug('Cannot spawn enemy: No hero reference');
            return;
        }

        const spawnPosition = this.getRandomSpawnPosition();
        const enemyType = this.getRandomEnemyType();
        
        try {
            const enemy = new enemyType(
                spawnPosition.x,
                spawnPosition.y,
                this.game
            );
            
            this.game.gameEntities.addEnemy(enemy);
            
            if (this.debug) {
                logDebug(`Spawned ${enemyType.name} at (${spawnPosition.x}, ${spawnPosition.y})`);
            }
        } catch (error) {
            if (this.debug) {
                logDebug(`Failed to spawn enemy: ${error.message}`);
            }
        }
    }

    getRandomSpawnPosition() {
        const margin = GAME_CONFIG.enemies.spawnMargin;
        const canvas = this.game.canvas;
        const hero = this.game.gameEntities.entities.hero;
        
        let x, y;
        do {
            x = margin + Math.random() * (canvas.width - margin * 2);
            y = margin + Math.random() * (canvas.height - margin * 2);
        } while (this.isPositionTooCloseToHero(x, y, hero));
        
        return { x, y };
    }

    isPositionTooCloseToHero(x, y, hero) {
        if (!hero) return false;
        const dx = x - hero.worldX;
        const dy = y - hero.worldY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < 200; // Minimum spawn distance from hero
    }

    getRandomEnemyType() {
        const types = [FastEnemy, TankEnemy, SwarmEnemy];
        const weights = [
            GAME_CONFIG.enemies.types.fast.weight,
            GAME_CONFIG.enemies.types.tank.weight,
            GAME_CONFIG.enemies.types.swarm.weight
        ];
        
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < types.length; i++) {
            if (random < weights[i]) return types[i];
            random -= weights[i];
        }
        
        return FastEnemy; // Default fallback
    }
}