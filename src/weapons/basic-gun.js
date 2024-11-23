import { Weapon } from './weapon.js';
import { Projectile } from './projectile.js';
import { GAME_CONFIG } from '../config.js';

export class BasicGun extends Weapon {
    constructor(owner) {
        super({
            damage: 25,
            fireRate: 2,
            projectileSpeed: 600,
            projectileLifetime: 0.8,
            projectileSize: 5,
            projectileColor: '#ffff00'
        });
        this.setOwner(owner);
        this.debug = GAME_CONFIG.debug;
    }

    canFire() {
        if (!this.owner) return false;
        const now = performance.now() / 1000;
        return now - this.lastFireTime >= this.cooldown;
    }

    fire(angle) {
        if (!this.owner || typeof this.owner.x !== 'number' || typeof this.owner.y !== 'number') {
            console.warn('Invalid owner position for basic gun fire');
            return;
        }

        // If no angle provided, try to find nearest enemy
        if (typeof angle !== 'number') {
            const enemies = this.owner.game?.gameEntities?.entities?.enemies;
            if (!enemies || enemies.size === 0) return;

            const target = this.findClosestEnemy(Array.from(enemies));
            if (!target) return;

            angle = Math.atan2(
                target.y - this.owner.y,
                target.x - this.owner.x
            );
        }

        if (!this.canFire()) return;

        try {
            const projectile = new Projectile({
                x: this.owner.x,
                y: this.owner.y,
                angle: angle,
                speed: this.projectileSpeed,
                lifetime: this.projectileLifetime,
                size: this.projectileSize,
                color: this.projectileColor,
                damage: this.damage,
                weapon: this
            });

            if (this.owner.game?.gameEntities) {
                this.owner.game.gameEntities.addProjectile(projectile);
                this.lastFireTime = performance.now() / 1000;
                if (this.debug) {
                    console.log(`BasicGun fired projectile at angle ${angle.toFixed(2)}`);
                }
            }
        } catch (error) {
            console.error('Failed to create basic gun projectile:', error);
        }
    }

    update(deltaTime) {
        // Weapon logic update if needed
    }

    draw(ctx) {
        // Weapon visualization if needed
    }
}