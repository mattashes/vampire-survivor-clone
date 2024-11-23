import { logDebug } from '../../config.js';
import { BasicGun } from '../../weapons/basic-gun.js';
import { PulseCannon, EnergyBeam } from '../../weapons/weapon-types.js';

export class HeroCombat {
    constructor(hero) {
        this.hero = hero;
        this.weapons = new Set([
            new BasicGun(this.hero),
            new PulseCannon(this.hero)
        ]);
        this.debug = hero.debug;
    }

    update(deltaTime) {
        let hasActiveEnergyBeam = false;
        
        // Update weapons
        for (const weapon of this.weapons) {
            if (weapon.owner !== this.hero) {
                weapon.setOwner(this.hero);
            }
            
            if (weapon instanceof EnergyBeam && weapon.state !== 'idle') {
                hasActiveEnergyBeam = true;
            }
            
            weapon.update(deltaTime);
        }

        // Handle power state based on energy beam
        if (hasActiveEnergyBeam) {
            const energyBeam = Array.from(this.weapons).find(w => w instanceof EnergyBeam);
            if (energyBeam) {
                if (energyBeam.state === 'charging') {
                    this.hero.powerState.growing = true;
                    this.hero.powerState.charged = false;
                    this.hero.powerState.exhausted = false;
                    const chargeProgress = energyBeam.chargeTime / energyBeam.CHARGE_DURATION;
                    this.hero.radius = this.hero.baseRadius + (this.hero.maxRadius - this.hero.baseRadius) * chargeProgress;
                } else if (energyBeam.state === 'firing') {
                    this.hero.powerState.growing = false;
                    this.hero.powerState.charged = true;
                    this.hero.powerState.exhausted = false;
                    this.hero.radius = this.hero.maxRadius;
                } else {
                    this.hero.powerState.growing = false;
                    this.hero.powerState.charged = false;
                    this.hero.powerState.exhausted = false;
                    this.hero.radius = this.hero.baseRadius;
                }
            }
        } else {
            this.hero.powerState.growing = false;
            this.hero.powerState.charged = false;
            this.hero.powerState.exhausted = false;
            this.hero.radius = this.hero.baseRadius;
        }

        // Handle collisions with enemies
        this.handleEnemyCollisions(deltaTime);
    }

    handleEnemyCollisions(deltaTime) {
        this.hero.game.entities.enemies.forEach(enemy => {
            const dx = enemy.worldX - this.hero.worldX;
            const dy = enemy.worldY - this.hero.worldY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = this.hero.radius + enemy.radius;

            if (distance < minDistance) {
                if (this.hero.powerState.charged) {
                    // Blast enemies away when charged
                    const angle = Math.atan2(dy, dx);
                    const force = 1000;
                    enemy.worldX += Math.cos(angle) * force * deltaTime;
                    enemy.worldY += Math.sin(angle) * force * deltaTime;
                    enemy.takeDamage(10);
                } else if (this.hero.powerState.growing) {
                    // Push enemies back less forcefully while charging
                    const angle = Math.atan2(dy, dx);
                    const force = 500;
                    enemy.worldX += Math.cos(angle) * force * deltaTime;
                    enemy.worldY += Math.sin(angle) * force * deltaTime;
                    enemy.takeDamage(5);
                } else if (!this.hero.dash.isInvincible) {
                    // Normal collision when not invincible
                    this.hero.takeDamage(enemy.damage || 10);
                }
            }
        });
    }

    draw(ctx) {
        // Draw all weapons
        for (const weapon of this.weapons) {
            weapon.draw(ctx);
        }
    }

    addWeapon(WeaponClass) {
        const existingWeapon = Array.from(this.weapons).find(w => w instanceof WeaponClass);
        if (existingWeapon) {
            existingWeapon.upgrade();
        } else {
            this.weapons.add(new WeaponClass(this.hero));
        }
        if (this.debug) {
            logDebug(`Added weapon: ${WeaponClass.name}`);
        }
    }

    removeWeapon(weapon) {
        this.weapons.delete(weapon);
        if (this.debug) {
            logDebug(`Removed weapon: ${weapon.constructor.name}`);
        }
    }
}