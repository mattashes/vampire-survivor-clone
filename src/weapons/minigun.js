import { Weapon } from './weapon.js';
import { GAME_CONFIG } from '../config.js';

export class MiniGun extends Weapon {
    constructor(owner) {
        super({
            damage: 10,
            fireRate: 10,
            projectileSpeed: 500,
            projectileLifetime: 0.5,
            projectileSize: 4,
            projectileColor: '#ffff00',
            spread: Math.PI / 12 // Small spread for slight inaccuracy
        });
        this.setOwner(owner);
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