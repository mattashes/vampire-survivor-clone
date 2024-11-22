import { logDebug } from './config.js';
import Game from './engine/game.js';

class GameInitializer {
    static async initializeGame() {
        try {
            logDebug('Starting game initialization');

            // Wait for DOM to be ready
            if (document.readyState !== 'complete') {
                await new Promise(resolve => {
                    window.addEventListener('load', resolve);
                });
            }

            // Create canvas if it doesn't exist
            let canvas = document.getElementById('gameCanvas');
            if (!canvas) {
                canvas = document.createElement('canvas');
                canvas.id = 'gameCanvas';
                document.body.appendChild(canvas);
                logDebug('Created canvas element');
            }

            // Create game UI if it doesn't exist
            let gameUI = document.getElementById('game-ui');
            if (!gameUI) {
                gameUI = document.createElement('div');
                gameUI.id = 'game-ui';
                // Remove the stats div since we're using canvas for UI
                document.body.appendChild(gameUI);
                logDebug('Created game UI element');
            }

            // Initialize and start the game
            const game = new Game();
            window.game = game;
            game.start();
            logDebug('Game started successfully');

        } catch (error) {
            console.error('Failed to initialize game:', error);
            throw error;
        }
    }
}

// Initialize the game when the module loads
GameInitializer.initializeGame().catch(error => {
    console.error('Game initialization failed:', error);
});