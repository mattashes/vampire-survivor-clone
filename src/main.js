import { GameManager } from './engine/game-manager.js';
import { logDebug } from './config.js';

/**
 * Initialize and start the game
 */
async function startGame() {
    try {
        logDebug('Starting game initialization');

        // Get the canvas element
        const canvas = document.querySelector('#gameCanvas');
        if (!canvas) {
            throw new Error('Canvas element not found');
        }

        logDebug('Canvas found, initializing game');
        const game = new GameManager();
        window.game = game; // Store game instance globally for debugging

        logDebug('Starting game loop');
        await game.start();

        logDebug('Game started successfully');
        return game;
    } catch (error) {
        console.error('Failed to start game:', error);
        // Re-throw the error to be handled by the caller
        throw error;
    }
}

/**
 * Initialize game when DOM is ready
 */
function initializeGame() {
    try {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                startGame().catch(error => {
                    console.error('Game initialization failed:', error);
                });
            });
        } else {
            startGame().catch(error => {
                console.error('Game initialization failed:', error);
            });
        }
    } catch (error) {
        console.error('Critical initialization error:', error);
    }
}

// Start the game initialization
initializeGame();