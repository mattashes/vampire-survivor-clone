// Configuration
export { GAME_CONFIG, logDebug, utils, validateGameState } from './config.js';

// Core game classes
export { default as Game } from './engine/game.js';
export { Entity } from './entities/entity.js';
export { Hero } from './entities/hero.js';
export { Enemy, FastEnemy, TankEnemy, SwarmEnemy } from './entities/enemy-types.js';

// Weapons
export { Weapon, Projectile } from './weapons/weapon.js';
export { Shotgun, EnergyBeam, PulseCannon } from './weapons/weapon-types.js';

// Systems
export { default as EnemySpawner } from './systems/enemy-spawner.js';
export { ParticleSystem } from './systems/particle-system.js';

// Game initialization
export { initializeGame } from './game-init.js';

// Version information
export const VERSION = '1.0.0';
export const BUILD_DATE = new Date().toISOString();

// Debug flag
export const DEBUG = true;

// Initialize logging
console.log(`Loading game version ${VERSION} (${BUILD_DATE})`);
if (DEBUG) {
    console.log('Debug mode enabled');
}

// Export a function to check if the game is properly loaded
export function isGameLoaded() {
    return Boolean(window.game && window.game.isRunning);
}

// Export game state helper functions
export const GameState = {
    isPaused: () => window.game && !window.game.isRunning,
    getEnemyCount: () => window.game ? window.game.enemies.size : 0,
    getProjectileCount: () => window.game ? window.game.projectiles.size : 0,
    getHeroHealth: () => {
        const hero = Array.from(window.game?.entities || []).find(e => e instanceof Hero);
        return hero ? hero.health : 0;
    },
    getLevel: () => window.game ? window.game.level : 1,
    getKills: () => window.game ? window.game.kills : 0
};

// Export event names
export const GameEvents = {
    GAME_INITIALIZED: 'game:initialized',
    GAME_STARTED: 'game:started',
    GAME_PAUSED: 'game:paused',
    GAME_RESUMED: 'game:resumed',
    GAME_OVER: 'game:over',
    LEVEL_UP: 'level:up',
    ENEMY_KILLED: 'enemy:killed',
    HERO_DAMAGED: 'hero:damaged',
    HERO_HEALED: 'hero:healed'
};

// Export utility constants
export const Constants = {
    CANVAS_SIZE: {
        WIDTH: 800,
        HEIGHT: 600
    },
    COLORS: {
        BACKGROUND: '#000000',
        HERO: '#00ff00',
        ENEMY: '#ff0000',
        PROJECTILE: '#ffff00',
        UI_TEXT: '#ffffff'
    }
};

// Export utility functions
export const Utilities = {
    randomRange: (min, max) => Math.random() * (max - min) + min,
    clamp: (value, min, max) => Math.min(Math.max(value, min), max),
    distance: (x1, y1, x2, y2) => Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
    angle: (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1),
    lerp: (start, end, t) => start + (end - start) * t
};

// Initialize any required polyfills or browser compatibility checks
if (!window.requestAnimationFrame) {
    console.warn('requestAnimationFrame not found, using setTimeout fallback');
    window.requestAnimationFrame = callback => setTimeout(() => callback(performance.now()), 1000 / 60);
}

// Export default for convenient importing
export default {
    Game,
    Entity,
    Hero,
    EnemySpawner,
    ParticleSystem,
    GameState,
    GameEvents,
    Constants,
    Utilities,
    VERSION
};