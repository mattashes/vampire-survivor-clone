export class GameUI {
    constructor(game) {
        this.game = game;
    }

    draw(ctx) {
        this.drawStats(ctx);
        this.drawHealthBar(ctx);
        if (this.game.debug) {
            this.drawDebugInfo(ctx);
        }
    }

    drawStats(ctx) {
        // Stats background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 250, 90);
        
        // Level and progress
        const heroLevel = this.game.entities.hero ? this.game.entities.hero.level : this.game.level;
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Level ${heroLevel}`, 20, 35);
        
        // Kill progress
        const killsNeeded = this.game.getKillsForNextLevel(heroLevel);
        ctx.font = '14px Arial';
        ctx.fillText(`Kills: ${this.game.killCount}/${killsNeeded}`, 20, 85);
        
        // XP bar
        const barWidth = 230;
        const barHeight = 10;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(20, 55, barWidth, barHeight);
        
        const progress = Math.min(this.game.killCount / killsNeeded, 1);
        const gradient = ctx.createLinearGradient(20, 55, barWidth + 20, 55);
        gradient.addColorStop(0, '#4CAF50');
        gradient.addColorStop(1, '#8BC34A');
        ctx.fillStyle = gradient;
        ctx.fillRect(20, 55, barWidth * progress, barHeight);
        
        // Game time
        const minutes = Math.floor(this.game.gameTime / 60);
        const seconds = Math.floor(this.game.gameTime % 60);
        const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(`Time: ${timeStr}`, 150, 35);
    }

    drawHealthBar(ctx) {
        if (!this.game.entities.hero) return;

        const hpBarWidth = 200;
        const hpBarHeight = 15;
        const hpX = this.game.canvas.width - hpBarWidth - 20;
        const hpY = 20;
        
        // HP bar background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(hpX - 10, hpY - 5, hpBarWidth + 20, hpBarHeight + 10);
        
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fillRect(hpX, hpY, hpBarWidth, hpBarHeight);
        
        // HP bar fill
        const hero = this.game.entities.hero;
        const hpPercent = hero.health / hero.maxHealth;
        const hpGradient = ctx.createLinearGradient(hpX, 0, hpX + hpBarWidth, 0);
        hpGradient.addColorStop(0, '#ff0000');
        hpGradient.addColorStop(1, '#ff3333');
        ctx.fillStyle = hpGradient;
        ctx.fillRect(hpX, hpY, hpBarWidth * hpPercent, hpBarHeight);
        
        // HP text
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.font = '12px Arial';
        ctx.fillText(
            `${Math.ceil(hero.health)}/${hero.maxHealth} HP`,
            hpX + hpBarWidth / 2,
            hpY + hpBarHeight - 2
        );
    }

    drawDebugInfo(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, this.game.canvas.height - 30, 200, 20);
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        ctx.font = '12px Arial';
        ctx.fillText(
            `FPS: ${this.game.fps} | Entities: ${this.game.entities.all.size} | Enemies: ${this.game.entities.enemies.size}`,
            20,
            this.game.canvas.height - 15
        );
    }
}