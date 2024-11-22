import Entity from '../entities/entity.js';
import { GAME_CONFIG, logDebug } from '../config.js';

export class Projectile extends Entity {
    constructor(x, y, vx, vy, size, damage, lifetime, color, owner) {
        super(x, y);
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.size = size;
        this.radius = size;
        this.damage = damage;
        this.maxLifetime = lifetime;
        this.color = color;
        this.owner = owner;
        this.game = owner.game;
        this.createdAt = performance.now() / 1000; // Convert to seconds
        this.isDead = false;
    }

    update(deltaTime) {
        const currentTime = performance.now() / 1000;
        if (currentTime - this.createdAt > this.maxLifetime) {
            this.isDead = true;
            return;
        }

        // Move based on velocity
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        // Check for collisions with enemies
        if (this.game && this.game.entities) {
            for (const enemy of this.game.entities.enemies) {
                if (!enemy.isDead) {
                    const dx = enemy.x - this.x;
                    const dy = enemy.y - this.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < enemy.radius + this.radius) {
                        enemy.takeDamage(this.damage);
                        this.isDead = true;
                        if (this.onHit) {
                            this.onHit(enemy);
                        }
                        break;
                    }
                }
            }
        }
    }

    // Default draw method that can be overridden
    draw(ctx) {
        if (!ctx || this.isDead) return;
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
}
