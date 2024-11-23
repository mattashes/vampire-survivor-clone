import { Weapon } from './weapon.js';
import { GAME_CONFIG } from '../config.js';

export class MiniGun extends Weapon {
    constructor(owner) {
        super(owner);
        this.fireRate = 10;  
        this.damage = 10;
        this.projectileSpeed = 500;
        this.projectileLifetime = 0.5;
        this.projectileSize = 4;
        this.projectileColor = '#ffff00';  
        this.cooldown = 1 / this.fireRate;
        this.lastFireTime = 0;
        this.debug = GAME_CONFIG.debug;
    }

    update(deltaTime) {
        const now = performance.now() / 1000;
        if (now - this.lastFireTime >= this.cooldown) {
            if (this.owner && this.owner.game && this.owner.game.entities && this.owner.game.entities.enemies) {
                const enemies = Array.from(this.owner.game.entities.enemies);
                const closestEnemy = this.findClosestEnemy(enemies);
                if (closestEnemy) {
                    this.fire(closestEnemy);
                    this.lastFireTime = now;
                }
            }
        }
    }
}