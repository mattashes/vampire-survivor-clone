import { logDebug } from './config.js';

class ModulePreloader {
    constructor() {
        this.modules = new Map();
        this.loadingProgress = 0;
        this.totalModules = 11; // Total number of modules to load
        this.loadedModules = 0;
    }

    async preloadModules() {
        try {
            logDebug('Starting module preload...');
            
            // Update loading bar
            this.updateLoadingBar(0);

            // Core modules
            await this.loadModule('./config.js', 'Config');
            await this.loadModule('./engine/game.js', 'Game Engine');
            
            // Entity modules
            await this.loadModule('./entities/entity.js', 'Entity Base');
            await this.loadModule('./entities/hero.js', 'Hero');
            await this.loadModule('./entities/enemy-types.js', 'Enemies');
            
            // Weapon modules
            await this.loadModule('./weapons/weapon.js', 'Weapon Base');
            await this.loadModule('./weapons/weapon-types.js', 'Weapons');
            
            // System modules
            await this.loadModule('./systems/enemy-spawner.js', 'Enemy Spawner');
            await this.loadModule('./systems/particle-system.js', 'Particle System');
            
            // Game initialization
            await this.loadModule('./game-init.js', 'Game Initialization');
            await this.loadModule('./main.js', 'Main');

            logDebug('All modules preloaded successfully');
            return true;
        } catch (error) {
            console.error('Module preloading failed:', error);
            logDebug('Preloader stack trace:', error.stack);
            this.showError('Failed to load game modules. Please refresh the page.');
            return false;
        }
    }

    async loadModule(path, name) {
        try {
            console.log(`Loading module: ${name}`);
            const module = await import(path);
            this.modules.set(name, module);
            this.loadedModules++;
            
            // Update loading progress
            const progress = (this.loadedModules / this.totalModules) * 100;
            this.updateLoadingBar(progress);
            console.log(`Module loaded: ${name} (${progress.toFixed(1)}%)`);
            
            return true;
        } catch (error) {
            console.error(`Failed to load module ${name}:`, error);
            this.showError(`Failed to load ${name}. Error: ${error.message}`);
            return false;
        }
    }

    updateLoadingBar(progress) {
        const loadingBar = document.getElementById('loading-bar');
        if (loadingBar) {
            loadingBar.style.width = `${progress}%`;
        }
    }

    updateLoadingText(text) {
        const loadingText = document.getElementById('loading-text');
        if (loadingText) {
            loadingText.textContent = text;
        }
    }

    showError(message) {
        const errorOverlay = document.getElementById('error-overlay');
        const errorMessage = document.getElementById('error-message');
        if (errorOverlay && errorMessage) {
            errorMessage.textContent = message;
            errorOverlay.classList.add('visible');
        }
        console.error(message);
    }

    getLoadedModule(name) {
        return this.modules.get(name);
    }

    isModuleLoaded(name) {
        return this.modules.has(name);
    }

    getLoadingProgress() {
        return this.loadingProgress;
    }
}

// Create and export preloader instance
const preloader = new ModulePreloader();

// Export preload function
export async function preloadGameModules() {
    return await preloader.preloadModules();
}

// Export module getter
export function getLoadedModule(name) {
    return preloader.getLoadedModule(name);
}

// Export loading progress getter
export function getLoadingProgress() {
    return preloader.getLoadingProgress();
}

// Export module loaded checker
export function isModuleLoaded(name) {
    return preloader.isModuleLoaded(name);
}

// Export error display function
export function showPreloaderError(message) {
    preloader.showError(message);
}

// Export default for convenient importing
export default preloader;