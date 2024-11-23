import { GAME_CONFIG, logDebug } from '../config.js';
import Entity from './entity.js';

class Enemy extends Entity {
    constructor(x, y, game) {
        super(x, y, 10, '#ffffff', 100, game);
        this.targetEntity = null;
        this.state = 'chase'; // chase, flank
        this.stateTimer = 0;
        this.stateDuration = 3; // seconds
        this.debug = GAME_CONFIG.debug;
        this.worldX = x;
        this.worldY = y;
    }

    update(deltaTime) {
        if (!this.targetEntity) return;
        
        // Update state
        this.stateTimer += deltaTime;
        if (this.stateTimer >= this.stateDuration) {
            this.switchState();
            this.stateTimer = 0;
        }

        // Store old position for collision check
        const oldWorldX = this.worldX;
        const oldWorldY = this.worldY;

        // Move based on current state
        if (this.state === 'chase') {
            this.chaseTarget(deltaTime);
        } else if (this.state === 'flank') {
            this.flankTarget(deltaTime);
        }

        // Update world position based on velocity
        this.worldX += this.dx * this.speed * deltaTime;
        this.worldY += this.dy * this.speed * deltaTime;

        // Check collision with terrain
        if (this.game.terrainSystem && this.game.terrainSystem.checkCollision(this)) {
            // If collision occurred, revert position
            this.worldX = oldWorldX;
            this.worldY = oldWorldY;
        }

        // Set screen coordinates for rendering
        // Since the terrain system applies camera transform and zoom,
        // we just use world coordinates directly
        this.x = this.worldX;
        this.y = this.worldY;

        // Keep within world bounds
        if (this.game && this.game.canvas) {
            const worldWidth = this.game.canvas.width / this.game.terrainSystem.zoom;
            const worldHeight = this.game.canvas.height / this.game.terrainSystem.zoom;
            const margin = 50; // Keep enemies from getting stuck at edges
            this.worldX = Math.max(margin, Math.min(this.worldX, worldWidth - margin));
            this.worldY = Math.max(margin, Math.min(this.worldY, worldHeight - margin));
        }
    }

    draw(ctx) {
        // Save context before drawing
        ctx.save();
        
        // Draw the enemy
        ctx.beginPath();
        ctx.arc(this.worldX, this.worldY, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Draw health bar if not at full health
        if (this.health < this.maxHealth) {
            const healthBarWidth = this.radius * 2;
            const healthBarHeight = 4;
            const healthPercent = this.health / this.maxHealth;
            
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fillRect(
                this.worldX - healthBarWidth/2,
                this.worldY - this.radius - 10,
                healthBarWidth,
                healthBarHeight
            );
            
            ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
            ctx.fillRect(
                this.worldX - healthBarWidth/2,
                this.worldY - this.radius - 10,
                healthBarWidth * healthPercent,
                healthBarHeight
            );
        }
        
        ctx.restore();
    }

    switchState() {
        // 30% chance to switch to flanking
        if (this.state === 'chase' && Math.random() < 0.3) {
            this.state = 'flank';
        } else {
            this.state = 'chase';
        }
        if (this.debug) {
            logDebug(`Enemy switched to ${this.state} state`);
        }
    }

    chaseTarget(deltaTime) {
        if (!this.targetEntity) return;
        
        // Calculate direction in world coordinates
        const dx = this.targetEntity.worldX - this.worldX;
        const dy = this.targetEntity.worldY - this.worldY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Normalize direction vector
            this.dx = dx / distance;
            this.dy = dy / distance;
        } else {
            // If we're exactly on the target (unlikely), stop moving
            this.dx = 0;
            this.dy = 0;
        }
    }

    flankTarget(deltaTime) {
        if (!this.targetEntity) return;
        
        // Calculate direction in world coordinates
        const dx = this.targetEntity.worldX - this.worldX;
        const dy = this.targetEntity.worldY - this.worldY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Move perpendicular to the target direction
            // Rotate the direction vector 90 degrees for flanking
            this.dx = dy / distance;  // Perpendicular vector
            this.dy = -dx / distance; // Negative for clockwise movement
        } else {
            this.dx = 0;
            this.dy = 0;
        }
    }

    onDeath() {
        if (this.game && this.game.entities.hero) {
            this.game.entities.hero.gainExperience(1);
            if (this.debug) logDebug(`Added 1 kill to hero's total`);
        }
    }
}

class FastEnemy extends Enemy {
    constructor(x, y, game) {
        super(x, y, game);
        this.radius = 15;
        this.color = '#ff3333';
        this.speed = 150;
        this.health = 50;
        this.maxHealth = 50;
        this.experienceValue = 1;
        this.worldX = x;
        this.worldY = y;
    }

    adapt(weaponType) {
        super.adapt(weaponType);
        this.speed *= 1.2;
    }
}

class TankEnemy extends Enemy {
    constructor(x, y, game) {
        super(x, y, game);
        this.radius = 25;
        this.color = '#ff6600';
        this.speed = 75;
        this.health = 200;
        this.maxHealth = 200;
        this.experienceValue = 1;
        this.worldX = x;
        this.worldY = y;
    }

    adapt(weaponType) {
        super.adapt(weaponType);
        this.maxHealth *= 1.3;
        this.health = this.maxHealth;
    }
}

class SwarmEnemy extends Enemy {
    constructor(x, y, game) {
        super(x, y, game);
        this.radius = 12;
        this.color = '#ff3399';
        this.speed = 100;
        this.health = 30;
        this.maxHealth = 30;
        this.experienceValue = 1;
        this.worldX = x;
        this.worldY = y;
    }

    update(deltaTime) {
        if (!this.game || !this.game.entities || !this.game.entities.enemies) return;

        // First update normal enemy behavior
        super.update(deltaTime);

        // Then add swarm behavior using world coordinates
        const nearbySwarms = Array.from(this.game.entities.enemies)
            .filter(e => e instanceof SwarmEnemy && e !== this && !e.isDead)
            .filter(e => {
                const dx = e.worldX - this.worldX;
                const dy = e.worldY - this.worldY;
                return Math.sqrt(dx * dx + dy * dy) < 100;
            });

        if (nearbySwarms.length > 0) {
            // Calculate average position of nearby swarms in world coordinates
            const avgX = nearbySwarms.reduce((sum, e) => sum + e.worldX, 0) / nearbySwarms.length;
            const avgY = nearbySwarms.reduce((sum, e) => sum + e.worldY, 0) / nearbySwarms.length;
            
            // Move towards average position
            const dx = avgX - this.worldX;
            const dy = avgY - this.worldY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                this.dx = (this.dx + (dx / dist) * 0.3) / 1.3;
                this.dy = (this.dy + (dy / dist) * 0.3) / 1.3;
            }
        }
    }
}

export { Enemy, FastEnemy, TankEnemy, SwarmEnemy };