// Debug configuration
const DEBUG = true;

// Game configuration
export const GAME_CONFIG = {
    debug: DEBUG,
    hero: {
        radius: 20,
        color: '#00ff00',
        maxSpeed: 200,
        maxHealth: 100,
        regeneration: 1,
        regenCooldown: 1000,
        dash: {
            cooldown: 5000,     // Cooldown in milliseconds (5 seconds)
            duration: 0.3,      // Duration in seconds
            speed: 1200,        // Increased dash speed
            damage: 100,        // Increased dash damage
            invincible: true,   // Invincible during dash
            screenShake: {      // Added screen shake configuration
                intensity: 20,
                duration: 0.2
            }
        }
    },
    enemies: {
        baseSpawnRate: 0.3,
        initialCount: 4,
        minCount: 2,
        maxCount: 50,
        spawnMargin: 50,
        types: {
            fast: {
                radius: 15,
                color: '#ff3333',
                speed: 120,
                health: 50,
                damage: 10,
                weight: 2,
                experience: 10,
                cooldown: 1000
            },
            tank: {
                radius: 25,
                color: '#ff6600',
                speed: 60,
                health: 200,
                damage: 20,
                weight: 1,
                experience: 25,
                cooldown: 2000
            },
            swarm: {
                radius: 12,
                color: '#ff3399',
                speed: 90,
                health: 30,
                damage: 5,
                weight: 3,
                experience: 5,
                cooldown: 500
            }
        }
    }
};

// Debug logging function
export function logDebug(...args) {
    if (GAME_CONFIG.debug) {
        console.log(...args);
    }
}

// Game events
export const GameEvents = {
    ENEMY_KILLED: 'enemyKilled',
    HERO_DAMAGED: 'heroDamaged',
    HERO_HEALED: 'heroHealed',
    LEVEL_UP: 'levelUp',
    GAME_OVER: 'gameOver',
    GAME_PAUSED: 'gamePaused',
    GAME_RESUMED: 'gameResumed'
};

// Utility functions
export const utils = {
    distance: (x1, y1, x2, y2) => Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
    angle: (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1),
    randomRange: (min, max) => Math.random() * (max - min) + min
};

// Performance monitoring
export function getPerformanceInfo(game) {
    return {
        fps: game.fps,
        entityCount: game.entities.hero ? 1 : 0 + game.entities.enemies.size,
        enemyCount: game.entities.enemies.size,
        projectileCount: game.entities.projectiles.size,
        particleCount: game.particleSystem ? game.particleSystem.particles.size : 0,
        gameTime: Math.floor(game.gameTime)
    };
}