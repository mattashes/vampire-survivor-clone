import { FastEnemy, TankEnemy, SwarmEnemy } from '../entities/enemy-types.js';
import { GAME_CONFIG, logDebug } from '../config.js';

export class EnemySpawner {
    constructor(game) {
        this.game = game;
        this.spawnTimer = 0;
        this.baseSpawnRate = GAME_CONFIG.enemies.baseSpawnRate;
        this.spawnRate = this.baseSpawnRate;
        this.waveNumber = 0;
        this.enemiesPerWave = GAME_CONFIG.enemies.initialCount;
        this.adaptationTimer = 0;
        this.adaptationInterval = 5; // 5 seconds
        this.difficultyMultiplier = 1;
        this.isPaused = false;
        this.debug = GAME_CONFIG.debug;

        // Set up enemy types with weights
        this.enemyTypes = [
            { type: FastEnemy, weight: 2 },
            { type: TankEnemy, weight: 1 },
            { type: SwarmEnemy, weight: 3 }
        ];

        if (this.debug) {
            logDebug('EnemySpawner initialized');
        }
    }

    update(deltaTime) {
        if (!this.game.isRunning || this.game.isPaused || this.isPaused) return;

        // Check max enemy count
        if (this.game.entities.enemies.size >= GAME_CONFIG.enemies.maxCount) {
            if (this.debug) {
                logDebug('Max enemy count reached, skipping spawn');
            }
            return;
        }

        // Update spawn timer
        this.spawnTimer += deltaTime;
        
        // Check if it's time to spawn
        if (this.spawnTimer >= this.spawnRate) {
            this.spawnWave();
            this.spawnTimer = 0;
        }

        // Update adaptation timer
        this.adaptationTimer += deltaTime;
        if (this.adaptationTimer >= this.adaptationInterval) {
            this.updateDifficulty();
            this.adaptationTimer = 0;
        }

        // Log current state
        if (this.debug) {
            logDebug(`Active enemies: ${this.game.entities.enemies.size}`);
        }

        // Ensure minimum number of enemies if not paused
        if (!this.isPaused && this.game.entities.enemies.size < GAME_CONFIG.enemies.minCount) {
            if (this.debug) {
                logDebug('Enemy count too low, forcing spawn');
            }
            this.spawnWave();
        }
    }

    spawnWave() {
        const spawnCount = Math.min(
            this.enemiesPerWave,
            GAME_CONFIG.enemies.maxCount - this.game.entities.enemies.size
        );

        for (let i = 0; i < spawnCount; i++) {
            const spawnPos = this.getSpawnPosition();
            const EnemyType = this.selectEnemyType();
            const enemy = new EnemyType(spawnPos.x, spawnPos.y, this.game);
            
            // Set hero as target
            if (this.game.entities.hero) {
                enemy.targetEntity = this.game.entities.hero;
            }
            
            // Add to game
            this.game.entities.enemies.add(enemy);
            this.game.entities.all.add(enemy);

            if (this.debug) {
                logDebug(`Spawned ${EnemyType.name} at (${spawnPos.x}, ${spawnPos.y})`);
            }
        }

        this.waveNumber++;
    }

    getSpawnPosition() {
        const margin = 50; // Spawn margin from edges
        const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
        
        let x, y;
        switch(side) {
            case 0: // top
                x = Math.random() * this.game.canvas.width;
                y = -margin;
                break;
            case 1: // right
                x = this.game.canvas.width + margin;
                y = Math.random() * this.game.canvas.height;
                break;
            case 2: // bottom
                x = Math.random() * this.game.canvas.width;
                y = this.game.canvas.height + margin;
                break;
            case 3: // left
                x = -margin;
                y = Math.random() * this.game.canvas.height;
                break;
        }
        
        return { x, y };
    }

    selectEnemyType() {
        // Calculate total weight
        const totalWeight = this.enemyTypes.reduce((sum, type) => sum + type.weight, 0);
        let random = Math.random() * totalWeight;
        
        // Select enemy type based on weights
        for (const enemyType of this.enemyTypes) {
            random -= enemyType.weight;
            if (random <= 0) {
                return enemyType.type;
            }
        }
        
        // Fallback to first type
        return this.enemyTypes[0].type;
    }

    updateDifficulty() {
        // Increase difficulty based on wave number
        this.difficultyMultiplier = 1 + (this.waveNumber * 0.1); // 10% increase per wave
        this.spawnRate = Math.max(0.5, this.baseSpawnRate / this.difficultyMultiplier); // Faster spawns as difficulty increases
        
        if (this.debug) {
            logDebug(`Difficulty Update - Multiplier: ${this.difficultyMultiplier}, Base Spawn Rate: ${this.spawnRate}`);
        }
    }
}