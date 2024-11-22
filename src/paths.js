// Base paths
export const BASE_PATH = '/src';
export const CURRENT_PATH = window.location.origin;

// Module paths
export const PATHS = {
    // Core modules
    CONFIG: `${BASE_PATH}/config.js`,
    MAIN: `${BASE_PATH}/main.js`,
    GAME_INIT: `${BASE_PATH}/game-init.js`,
    PRELOADER: `${BASE_PATH}/preloader.js`,
    INDEX: `${BASE_PATH}/index.js`,

    // Engine modules
    GAME_ENGINE: `${BASE_PATH}/engine/game.js`,

    // Entity modules
    ENTITY_BASE: `${BASE_PATH}/entities/entity.js`,
    HERO: `${BASE_PATH}/entities/hero.js`,
    ENEMY_TYPES: `${BASE_PATH}/entities/enemy-types.js`,

    // Weapon modules
    WEAPON_BASE: `${BASE_PATH}/weapons/weapon.js`,
    WEAPON_TYPES: `${BASE_PATH}/weapons/weapon-types.js`,

    // System modules
    ENEMY_SPAWNER: `${BASE_PATH}/systems/enemy-spawner.js`,
    PARTICLE_SYSTEM: `${BASE_PATH}/systems/particle-system.js`
};

// Module dependencies
export const MODULE_DEPENDENCIES = {
    'main.js': ['config.js', 'game-init.js', 'preloader.js'],
    'game-init.js': ['config.js', 'engine/game.js'],
    'engine/game.js': ['entities/hero.js', 'weapons/weapon-types.js', 'systems/enemy-spawner.js', 'systems/particle-system.js'],
    'entities/hero.js': ['entities/entity.js'],
    'entities/enemy-types.js': ['entities/entity.js'],
    'weapons/weapon-types.js': ['weapons/weapon.js'],
    'systems/enemy-spawner.js': ['entities/enemy-types.js']
};

// Module load order
export const LOAD_ORDER = [
    'config.js',
    'paths.js',
    'entities/entity.js',
    'weapons/weapon.js',
    'entities/enemy-types.js',
    'weapons/weapon-types.js',
    'entities/hero.js',
    'systems/particle-system.js',
    'systems/enemy-spawner.js',
    'engine/game.js',
    'game-init.js',
    'preloader.js',
    'main.js'
];

// Utility functions
export function getModulePath(moduleName) {
    return PATHS[moduleName] || null;
}

export function getModuleDependencies(moduleName) {
    return MODULE_DEPENDENCIES[moduleName] || [];
}

export function isModuleInLoadOrder(moduleName) {
    return LOAD_ORDER.includes(moduleName);
}

export function getFullPath(modulePath) {
    return `${CURRENT_PATH}${modulePath}`;
}

// Export a function to validate module paths
export function validateModulePath(path) {
    // Check if path exists in PATHS
    const exists = Object.values(PATHS).includes(path);
    if (!exists) {
        console.warn(`Warning: Module path ${path} not found in paths configuration`);
    }
    return exists;
}

// Export a function to get module name from path
export function getModuleNameFromPath(path) {
    for (const [name, modulePath] of Object.entries(PATHS)) {
        if (modulePath === path) {
            return name;
        }
    }
    return null;
}

// Export default configuration
export default {
    PATHS,
    MODULE_DEPENDENCIES,
    LOAD_ORDER,
    getModulePath,
    getModuleDependencies,
    isModuleInLoadOrder,
    getFullPath,
    validateModulePath,
    getModuleNameFromPath
};