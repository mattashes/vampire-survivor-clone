import { GAME_CONFIG, logDebug } from '../config.js';

export class BaseWeapon {
    constructor(owner) {
        this.owner = owner;
        this.game = owner.game;
        this.level = 1;
        this.cooldown = 1; // seconds
        this.lastFireTime = 0;
        this.damage = 10;
        this.projectileSpeed = 300;
        this.debug = GAME_CONFIG.debug;
    }

    update(deltaTime) {
        if (!this.owner || !this.game) return;

        const currentTime = performance.now();
        if (currentTime - this.lastFireTime >= this.cooldown * 1000) {
            this.fire();
            this.lastFireTime = currentTime;
        }
    }

    fire() {
        // Override in subclasses
        if (this.debug) {
            logDebug('Base weapon fire method called');
        }
    }

    upgrade() {
        this.level++;
        this.cooldown *= 0.9;
        this.damage *= 1.2;
        
        if (this.debug) {
            logDebug(`Weapon upgraded to level ${this.level}`);
            logDebug(`New stats - Cooldown: ${this.cooldown}, Damage: ${this.damage}`);
        }
    }

    setOwner(owner) {
        this.owner = owner;
        this.game = owner.game;
    }

    draw(ctx) {
        // Base draw method - override in subclasses
    }

    findClosestEnemy(enemies) {
        if (!enemies || enemies.length === 0) return null;
        
        let closestEnemy = null;
        let closestDistance = Infinity;
        
        for (const enemy of enemies) {
            const dx = enemy.x - this.owner.x;
            const dy = enemy.y - this.owner.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < closestDistance) {
                closestDistance = distance;
                closestEnemy = enemy;
            }
        }
        
        return closestEnemy;
    }
}
