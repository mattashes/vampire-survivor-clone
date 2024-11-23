import { Entity } from '../entities/entity.js';
import { Projectile } from './projectile.js';

export class Weapon {
    constructor(config = {}) {
        this.owner = null;
        this.damage = config.damage || 10;
        this.fireRate = config.fireRate || 1; // Shots per second
        this.projectileSpeed = config.projectileSpeed || 300;
        this.projectileLifetime = config.projectileLifetime || 2; // seconds
        this.projectileSize = config.projectileSize || 5;
        this.projectileColor = config.projectileColor || '#ffff00';
        this.level = 1;
        this.lastFireTime = 0;
        this.spread = config.spread || 0; // Spread angle in radians
        this.projectilesPerShot = config.projectilesPerShot || 1;
        this.debug = true;
    }

    setOwner(owner) {
        if (!owner || typeof owner.x !== 'number' || typeof owner.y !== 'number') {
            console.warn('Invalid owner provided to weapon', { owner });
            return;
        }
        this.owner = owner;
        if (this.debug) {
            console.log(`Weapon owner set to ${owner.constructor.name} at (${owner.x.toFixed(2)}, ${owner.y.toFixed(2)})`);
        }
    }

    update(deltaTime) {
        if (!this.owner) {
            console.warn('Weapon has no owner during update');
            return;
        }

        if (this.canFire()) {
            this.fire();
            this.lastFireTime = performance.now();
        }
    }

    canFire() {
        if (!this.owner) return false;
        const currentTime = performance.now();
        return currentTime - this.lastFireTime > (1000 / this.fireRate);
    }

    fire(angle) {
        if (!this.owner) {
            console.warn('Cannot fire weapon: missing owner');
            return;
        }

        if (typeof this.owner.x !== 'number' || typeof this.owner.y !== 'number') {
            console.warn('Invalid owner coordinates during fire', {
                ownerX: this.owner.x,
                ownerY: this.owner.y
            });
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

        this.createProjectile(angle);
    }

    createProjectile(angle) {
        if (!this.owner || typeof this.owner.x !== 'number' || typeof this.owner.y !== 'number') {
            console.warn('Invalid owner coordinates for projectile creation');
            return;
        }

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
                if (this.debug) {
                    console.log(`Created projectile at angle ${angle.toFixed(2)}`);
                }
            } else {
                console.warn('Game entities not found for projectile creation');
            }
        } catch (error) {
            console.error('Failed to create projectile:', error);
        }
    }

    findClosestEnemy(enemies) {
        if (!Array.isArray(enemies) || enemies.length === 0) return null;
        
        let closest = null;
        let minDistance = Infinity;

        for (const enemy of enemies) {
            if (!enemy || typeof enemy.x !== 'number' || typeof enemy.y !== 'number') continue;

            const dx = enemy.x - this.owner.x;
            const dy = enemy.y - this.owner.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < minDistance) {
                minDistance = distance;
                closest = enemy;
            }
        }

        return closest;
    }

    draw(ctx) {
        // Base weapon has no visual representation
    }

    onHeroLevelUp() {
        this.levelUp();
    }

    levelUp() {
        this.level++;
        this.damage *= 1.2;
        if (this.debug) {
            console.log(`${this.constructor.name} leveled up to ${this.level}`);
        }
    }
}