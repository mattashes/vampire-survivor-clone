import { Entity } from '../entities/entity.js';
import { GAME_CONFIG, logDebug } from '../config.js';

export class Projectile extends Entity {
    constructor(config) {
        // Handle both object-style and parameter-style construction
        let x, y, vx, vy, radius, color, damage, lifetime, owner;
        
        if (typeof config === 'object') {
            // New style: object configuration
            x = config.x;
            y = config.y;
            radius = config.size || 5;
            color = config.color || '#ffff00';
            damage = config.damage || 10;
            lifetime = config.lifetime || 2;
            owner = config.weapon?.owner; // Get the actual owner (hero) not the weapon
            
            // Calculate velocity from angle and speed
            const speed = config.speed || 300;
            const angle = config.angle || 0;
            vx = Math.cos(angle) * speed;
            vy = Math.sin(angle) * speed;
        } else {
            // Old style: individual parameters
            [x, y, vx, vy, radius, color, damage, lifetime, owner] = arguments;
        }

        // Validate position
        if (typeof x !== 'number' || typeof y !== 'number' || isNaN(x) || isNaN(y)) {
            throw new Error('Invalid projectile position');
        }
        
        super(x, y, radius, color);
        this.velocityX = vx;
        this.velocityY = vy;
        this.damage = damage;
        this.lifetime = lifetime;
        this.createdAt = performance.now() / 1000;
        this.isDead = false;
        this.owner = owner;
        this.game = owner?.game;
        
        if (GAME_CONFIG.debug) {
            console.log(`Created projectile at (${x.toFixed(2)}, ${y.toFixed(2)}) with velocity (${vx.toFixed(2)}, ${vy.toFixed(2)})`);
        }
    }

    update(deltaTime) {
        if (this.isDead) return;

        // Check lifetime
        const now = performance.now() / 1000;
        if (now - this.createdAt > this.lifetime) {
            this.isDead = true;
            return;
        }

        // Update position based on velocity
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;

        // Check for collisions with enemies
        this.checkCollisions();

        // Check if out of bounds
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        
        if (this.x < 0 || this.x > canvas.width || 
            this.y < 0 || this.y > canvas.height) {
            this.isDead = true;
        }
    }

    checkCollisions() {
        if (!this.owner?.game?.gameEntities?.entities?.enemies) return;

        for (const enemy of this.owner.game.gameEntities.entities.enemies) {
            if (!enemy || enemy.isDead) continue;

            const dx = this.x - enemy.x;
            const dy = this.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < enemy.radius + this.radius) {
                enemy.takeDamage(this.damage);
                this.isDead = true;
                if (GAME_CONFIG.debug) {
                    console.log(`Projectile hit enemy for ${this.damage} damage`);
                }
                break;
            }
        }
    }

    draw(ctx) {
        if (!ctx || this.isDead) return;

        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Add glow effect
        ctx.shadowBlur = this.radius * 2;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.restore();
    }
}