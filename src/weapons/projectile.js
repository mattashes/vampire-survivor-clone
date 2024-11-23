import Entity from '../entities/entity.js';
import { GAME_CONFIG, logDebug } from '../config.js';

export class Projectile extends Entity {
    constructor(x, y, vx, vy, size, damage, lifetime, color, owner) {
        super(x, y);
        // World coordinates
        this.worldX = x;
        this.worldY = y;
        // Screen coordinates (will be updated based on camera)
        this.x = x;
        this.y = y;
        // Velocity in world space
        this.vx = vx;
        this.vy = vy;
        this.size = size;
        this.radius = size;
        this.damage = damage;
        this.maxLifetime = lifetime;
        this.color = color;
        this.owner = owner;
        this.game = owner.game;
        this.createdAt = performance.now() / 1000;
        this.isDead = false;
    }

    update(deltaTime) {
        const currentTime = performance.now() / 1000;
        if (currentTime - this.createdAt > this.maxLifetime) {
            this.isDead = true;
            return;
        }

        // Move in world coordinates based on velocity
        this.worldX += this.vx * deltaTime;
        this.worldY += this.vy * deltaTime;

        // Update screen coordinates based on camera
        if (this.game.terrainSystem) {
            const camera = this.game.terrainSystem.camera;
            const zoom = this.game.terrainSystem.zoom;
            this.x = (this.worldX - camera.x) * zoom;
            this.y = (this.worldY - camera.y) * zoom;
        }

        // Check for collisions with enemies using world coordinates
        if (this.game && this.game.entities) {
            for (const enemy of this.game.entities.enemies) {
                if (!enemy.isDead) {
                    const dx = enemy.worldX - this.worldX;
                    const dy = enemy.worldY - this.worldY;
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

        // Check collision with terrain
        if (this.game.terrainSystem && this.game.terrainSystem.checkCollision(this)) {
            this.isDead = true;
        }
    }

    draw(ctx) {
        if (!ctx || this.isDead) return;
        
        ctx.save();
        
        // Draw projectile at screen coordinates
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * this.game.terrainSystem.zoom, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Optional: Add a glowing effect
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius * 2 * this.game.terrainSystem.zoom
        );
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.restore();
    }
}