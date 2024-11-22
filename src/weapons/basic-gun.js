import { BaseWeapon } from './base-weapon.js';
import { Projectile } from './projectile.js';
import { logDebug } from '../config.js';

export class BasicGun extends BaseWeapon {
    constructor(owner) {
        super(owner);
        this.fireRate = 2; // Restored to original 2 shots per second
        this.damage = 391; // Increased from 25 to 391
        this.projectileSpeed = 500; // Increased from 400 to 500
        this.projectileSize = 6; // Kept at 6
        this.projectileLifetime = 0.3; // Decreased from 1.5 to 0.3 seconds
        this.projectileColor = '#ffff00'; // Bright yellow
        this.lastFireTime = 0;
        this.cooldown = 1 / this.fireRate;
    }

    fire(target) {
        if (!this.owner) return;

        // Calculate direction to enemy
        const dx = target.x - this.owner.x;
        const dy = target.y - this.owner.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length === 0) return;

        // Normalize direction and calculate velocity
        const normalizedDx = dx / length;
        const normalizedDy = dy / length;
        const vx = normalizedDx * this.projectileSpeed;
        const vy = normalizedDy * this.projectileSpeed;

        // Create projectile with new constructor format
        const projectile = new Projectile(
            this.owner.x,
            this.owner.y,
            vx,
            vy,
            this.projectileSize,
            this.damage,
            this.projectileLifetime,
            this.projectileColor,
            this.owner
        );

        // Add to game entities
        if (this.owner.game.entities && this.owner.game.entities.projectiles) {
            this.owner.game.entities.projectiles.add(projectile);
        }
    }

    update(deltaTime) {
        const now = performance.now() / 1000;
        if (now - this.lastFireTime >= this.cooldown) {
            const closestEnemy = this.owner?.findClosestEnemy();
            if (closestEnemy) {
                this.fire(closestEnemy);
                this.lastFireTime = now;
            }
        }
    }

    draw(ctx) {
        // Basic gun has no visual representation when not firing
    }

    upgrade() {
        super.upgrade();
        // Additional basic gun specific upgrades
        this.fireRate *= 1.2;
        this.damage *= 1.3;
        this.projectileSpeed *= 1.1;
    }
}
