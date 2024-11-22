import { utils, logDebug } from '../config.js';

export default class Entity {
    constructor(x, y, radius, color = '#ffffff', speed = 100, game) {
        if (typeof x !== 'number' || typeof y !== 'number' || isNaN(x) || isNaN(y)) {
            throw new Error(`Invalid coordinates provided to Entity: (${x}, ${y})`);
        }
        this.x = x;
        this.y = y;
        this.radius = radius || 10;
        this.game = game;
        this.color = color;
        this.speed = speed;
        this.dx = 0;
        this.dy = 0;
        this.health = 100;
        this.maxHealth = 100;
        this.isDead = false;
        this.debug = false;
    }

    update(deltaTime) {
        if (!deltaTime || isNaN(deltaTime)) {
            logDebug(`Invalid deltaTime in entity update: ${deltaTime}`);
            return;
        }

        // Update position based on velocity
        this.x += this.dx * this.speed * deltaTime;
        this.y += this.dy * this.speed * deltaTime;

        // Keep entity within canvas bounds
        if (this.game && this.game.canvas) {
            this.x = Math.max(this.radius, Math.min(this.x, this.game.canvas.width - this.radius));
            this.y = Math.max(this.radius, Math.min(this.y, this.game.canvas.height - this.radius));
        }
    }

    draw(ctx) {
        if (!ctx) return;
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Draw health bar if entity has less than max health
        if (this.health < this.maxHealth) {
            const healthBarWidth = this.radius * 2;
            const healthBarHeight = 4;
            const healthPercent = this.health / this.maxHealth;
            
            // Background
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fillRect(
                this.x - healthBarWidth/2,
                this.y - this.radius - 10,
                healthBarWidth,
                healthBarHeight
            );
            
            // Health remaining
            ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
            ctx.fillRect(
                this.x - healthBarWidth/2,
                this.y - this.radius - 10,
                healthBarWidth * healthPercent,
                healthBarHeight
            );
        }
        
        ctx.closePath();
        ctx.restore();
    }

    moveToward(target, deltaTime) {
        if (!target || typeof target.x !== 'number' || typeof target.y !== 'number' ||
            isNaN(target.x) || isNaN(target.y)) {
            if (this.debug) logDebug(`Invalid target for moveToward: ${JSON.stringify(target)}`);
            return;
        }

        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0 && !isNaN(distance)) {
            this.dx = dx / distance;
            this.dy = dy / distance;
        } else {
            this.dx = 0;
            this.dy = 0;
        }
    }

    moveAway(target, deltaTime) {
        const dx = this.x - target.x;
        const dy = this.y - target.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            this.dx = dx / distance;
            this.dy = dy / distance;
        }
    }

    strafeAround(target, deltaTime, direction = 1) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            // Calculate perpendicular vector for strafing
            this.dx = -dy / distance * direction;
            this.dy = dx / distance * direction;
        }
    }

    getDistanceTo(target) {
        return utils.distance(this.x, this.y, target.x, target.y);
    }

    getAngleTo(target) {
        return utils.angle(this.x, this.y, target.x, target.y);
    }

    collidesWith(other) {
        if (!other || typeof other.x !== 'number' || typeof other.y !== 'number' || !other.radius) {
            return false;
        }
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (this.radius + other.radius);
    }

    takeDamage(amount) {
        if (this.isDead) return; // Don't damage dead entities
        
        this.health = Math.max(0, this.health - amount);
        if (this.health <= 0 && !this.isDead) {
            this.isDead = true;
            if (typeof this.onDeath === 'function') {
                this.onDeath();
            }
            // Remove from game if it exists
            if (this.game) {
                if (this.constructor.name.includes('Enemy')) {
                    this.game.removeEnemy(this);
                } else if (this.constructor.name.includes('Projectile')) {
                    this.game.removeProjectile(this);
                }
            }
        }
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
}