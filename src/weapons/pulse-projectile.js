import { Projectile } from './projectile.js';

export class PulseProjectile extends Projectile {
    constructor(config) {
        super(config);
        this.explosionRadius = config.explosionRadius || 100;
        this.explosionDuration = config.explosionDuration || 0.3;
        this.isExploding = false;
        this.explosionTime = 0;
    }

    update(deltaTime) {
        if (this.isExploding) {
            this.updateExplosion(deltaTime);
            return;
        }

        // Check for collisions before normal update
        if (this.checkCollisions()) {
            this.explode();
            return;
        }

        super.update(deltaTime);
    }

    draw(ctx) {
        if (this.isExploding) {
            this.drawExplosion(ctx);
        } else {
            super.draw(ctx);
        }
    }

    checkCollisions() {
        if (!this.weapon || !this.weapon.game) return false;

        for (const enemy of this.weapon.game.enemies) {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= enemy.radius + this.size) {
                return true;
            }
        }
        return false;
    }

    explode() {
        this.isExploding = true;
        this.explosionTime = 0;
        
        // Deal initial damage to enemies in radius
        if (this.weapon && this.weapon.game) {
            for (const enemy of this.weapon.game.enemies) {
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance <= this.explosionRadius) {
                    const damageMultiplier = 1 - (distance / this.explosionRadius);
                    enemy.takeDamage(this.damage * damageMultiplier);
                }
            }
        }
    }

    updateExplosion(deltaTime) {
        this.explosionTime += deltaTime;
        if (this.explosionTime >= this.explosionDuration) {
            this.shouldRemove = true;
        }
    }

    drawExplosion(ctx) {
        const progress = this.explosionTime / this.explosionDuration;
        const radius = this.explosionRadius * progress;
        const alpha = 1 - progress;

        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 51, 255, ${alpha * 0.3})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.x, this.y, radius * 0.8, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 51, 255, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.stroke();
    }
}