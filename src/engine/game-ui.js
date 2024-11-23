export class GameUI {
    constructor(game) {
        this.game = game;
        this.isGameOver = false;
    }

    update(deltaTime) {
        // Update UI state if needed
    }

    draw(ctx) {
        this.drawStats(ctx);
        this.drawHealthBar(ctx);
        if (this.game.debug) {
            this.drawDebugInfo(ctx);
        }
        if (this.isGameOver) {
            this.drawGameOver(ctx);
        }
    }

    drawStats(ctx) {
        // Stats background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 250, 90);
        
        // Level and progress
        const hero = this.game?.gameEntities?.entities?.hero;
        const heroLevel = hero ? hero.level : 1;
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Level ${heroLevel}`, 20, 35);
        
        // Kill count
        const enemyCount = this.game?.gameEntities?.entities?.enemies?.size || 0;
        ctx.font = '16px Arial';
        ctx.fillText(`Enemies: ${enemyCount}`, 20, 60);
        
        // Health
        if (hero) {
            const healthPercent = Math.round((hero.health / hero.maxHealth) * 100);
            ctx.fillText(`Health: ${healthPercent}%`, 20, 85);
        }
    }

    drawHealthBar(ctx) {
        const hero = this.game?.gameEntities?.entities?.hero;
        if (!hero) return;

        const barWidth = 200;
        const barHeight = 20;
        const x = (this.game.canvas.width - barWidth) / 2;
        const y = this.game.canvas.height - barHeight - 20;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, barWidth, barHeight);

        // Health bar
        const healthPercent = hero.health / hero.maxHealth;
        ctx.fillStyle = this.getHealthColor(healthPercent);
        ctx.fillRect(x, y, barWidth * healthPercent, barHeight);

        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, barWidth, barHeight);
    }

    drawDebugInfo(ctx) {
        const hero = this.game?.gameEntities?.entities?.hero;
        if (!hero) return;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, this.game.canvas.height - 90, 200, 80);

        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Position: (${Math.round(hero.x)}, ${Math.round(hero.y)})`, 20, this.game.canvas.height - 65);
        ctx.fillText(`Speed: ${Math.round(hero.speed)}`, 20, this.game.canvas.height - 45);
        ctx.fillText(`FPS: ${Math.round(1000 / (this.game.core?.lastFrameTime || 16))}`, 20, this.game.canvas.height - 25);
    }

    showGameOver() {
        this.isGameOver = true;
        
        // Create restart button
        const button = document.createElement('button');
        button.innerText = 'Restart Game';
        button.style.position = 'absolute';
        button.style.left = '50%';
        button.style.top = '60%';
        button.style.transform = 'translate(-50%, -50%)';
        button.style.padding = '10px 20px';
        button.style.fontSize = '20px';
        button.style.backgroundColor = '#4CAF50';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.cursor = 'pointer';
        button.style.zIndex = '1000';
        button.style.fontFamily = 'Arial, sans-serif';
        button.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        
        button.addEventListener('mouseover', () => {
            button.style.backgroundColor = '#45a049';
        });
        
        button.addEventListener('mouseout', () => {
            button.style.backgroundColor = '#4CAF50';
        });
        
        button.addEventListener('click', () => {
            location.reload();
        });
        
        document.body.appendChild(button);
    }

    drawGameOver(ctx) {
        // Darken the screen
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
        
        const centerX = this.game.canvas.width / 2;
        const centerY = this.game.canvas.height / 2;
        
        // Draw game over text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GAME OVER', centerX, centerY - 80);

        // Draw stats
        ctx.font = '24px Arial';
        const hero = this.game?.gameEntities?.entities?.hero;
        if (hero) {
            ctx.fillText(`Level: ${hero.level}`, centerX, centerY - 20);
            const enemyCount = this.game?.gameEntities?.entities?.enemies?.size || 0;
            ctx.fillText(`Enemies Remaining: ${enemyCount}`, centerX, centerY + 20);
        }
    }

    getHealthColor(percent) {
        if (percent > 0.6) return '#00ff00';
        if (percent > 0.3) return '#ffff00';
        return '#ff0000';
    }
}