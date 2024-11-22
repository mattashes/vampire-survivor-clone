// Debug configuration
const DEBUG = true;

// Game configuration
export const GAME_CONFIG = {
    debug: DEBUG,
    canvas: {
        sizeRatio: 0.8,
        backgroundColor: '#000000'
    },
    performance: {
        targetFPS: 60,
        updateInterval: 1000, // How often to update FPS counter (in ms)
        fpsUpdateFrequency: 500 // How often to calculate FPS
    },
    difficulty: {
        baseMultiplier: 1.0,
        maxMultiplier: 3.0,
        maxDifficultyTime: 600000, // 10 minutes
        adaptationInterval: 10000, // 10 seconds between difficulty adjustments
        spawnRateModifier: 0.95,
        experienceToLevel: 200,  // Base experience needed for first level
        experienceMultiplier: 1.5  // Experience requirement increases by 50% per level
    },
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
        },
        weapons: {
            pulseCannon: {
                key: 'E',
                cooldown: 5000  // 5 second cooldown
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
    },
    weapons: {
        shotgun: {
            damage: 25,
            spread: 30,
            projectileCount: 5,
            cooldown: 1000,
            projectileSpeed: 500,
            color: '#ffff33'
        },
        energyBeam: {
            damage: 10,
            width: 5,
            range: 200,
            cooldown: 100,
            color: '#33ffff'
        },
        pulseCannon: {
            damage: 40,
            radius: 100,
            cooldown: 2000,
            color: '#ff33ff'
        }
    },
    particles: {
        maxParticles: 1000,
        defaultLifetime: 1000,
        defaultSpeed: 100
    }
};

// Debug logging function
export function logDebug(...args) {
    if (DEBUG) {
        console.log('[DEBUG]', ...args);
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
    randomRange(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },
    
    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },
    
    angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },
    
    lerp(start, end, t) {
        return start + (end - start) * t;
    },
    
    hexToRgba(hex, alpha = 1) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? 
            `rgba(${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)},${alpha})` 
            : `rgba(255,255,255,${alpha})`;
    }
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