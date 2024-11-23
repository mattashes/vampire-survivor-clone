import { Entity } from './entity.js';
import { GAME_CONFIG, logDebug } from '../config.js';

export class Enemy extends Entity {
    constructor(x, y, game, config) {
        super(x, y, config.radius, config.color, config.speed, game);
        
        // Don't access hero immediately
        this.game = game;
        this.config = config;
        this.target = null;  // Will be set in update
        
        // Initialize enemy properties
        this.health = config.health;
        this.maxHealth = config.health;
        this.damage = config.damage;
        this.experience = config.experience;
        this.isDead = false;
        this.lastAttackTime = 0;
        this.attackCooldown = config.cooldown;
        
        // Debug flag
        this.debug = GAME_CONFIG.debug;
    }

    update(deltaTime) {
        if (this.isDead) return;

        // Get hero reference safely
        if (!this.target && this.game?.gameEntities?.entities?.hero) {
            this.target = this.game.gameEntities.entities.hero;
        }

        if (!this.target) {
            if (this.debug) logDebug('No target found for enemy');
            return;
        }

        // Update movement
        this.updateMovement(deltaTime);
    }

    updateMovement(deltaTime) {
        if (!this.target) return;

        // Calculate direction to hero using screen coordinates
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            // Normalize direction
            const dirX = dx / distance;
            const dirY = dy / distance;

            // Move towards hero
            this.x += dirX * this.speed * deltaTime;
            this.y += dirY * this.speed * deltaTime;

            // Keep enemy within canvas bounds
            if (this.game?.canvas) {
                this.x = Math.max(0, Math.min(this.x, this.game.canvas.width));
                this.y = Math.max(0, Math.min(this.y, this.game.canvas.height));
            }
        }
    }

    takeDamage(amount) {
        if (this.isDead) return;
        
        this.health -= amount;
        
        if (this.health <= 0) {
            this.isDead = true;
            if (this.target) {
                this.target.gainExperience(this.experience);
            }
        }
    }

    draw(ctx) {
        if (!ctx || this.isDead) return;

        ctx.save();

        // Draw enemy body
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.stroke();
        ctx.closePath();

        // Draw health bar
        const healthBarWidth = this.radius * 2;
        const healthBarHeight = 4;
        const healthBarX = this.x - healthBarWidth / 2;
        const healthBarY = this.y - this.radius - 10;

        // Background
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

        // Health
        ctx.fillStyle = '#00ff00';
        const currentHealthWidth = (this.health / this.maxHealth) * healthBarWidth;
        ctx.fillRect(healthBarX, healthBarY, currentHealthWidth, healthBarHeight);

        ctx.restore();
    }
}

export class FastEnemy extends Enemy {
    constructor(x, y, game) {
        super(x, y, game, GAME_CONFIG.enemies.types.fast);
    }
}

export class TankEnemy extends Enemy {
    constructor(x, y, game) {
        super(x, y, game, GAME_CONFIG.enemies.types.tank);
    }
}

export class SwarmEnemy extends Enemy {
    constructor(x, y, game) {
        super(x, y, game, GAME_CONFIG.enemies.types.swarm);
    }
}