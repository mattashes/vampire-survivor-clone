import { GameManager } from './engine/game-manager.js';
import { GAME_CONFIG, logDebug } from './config.js';

export function startGame() {
    try {
        const game = new GameManager();
        window.game = game; // For debugging purposes
        game.start();
        
        if (GAME_CONFIG.debug) {
            logDebug('Game started successfully');
        }
        
        return game;
    } catch (error) {
        console.error('Failed to start game:', error);
        throw error;
    }
}

export function initializeGame() {
    try {
        return startGame();
    } catch (error) {
        console.error('Game initialization failed:', error);
        throw error;
    }
}

// Start the game when the page loads
window.addEventListener('load', initializeGame);