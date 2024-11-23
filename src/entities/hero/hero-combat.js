import { GAME_CONFIG, logDebug } from '../../config.js';
import { BasicGun } from '../../weapons/basic-gun.js';
import { PulseCannon, EnergyBeam } from '../../weapons/weapon-types.js';

export class HeroCombat {
    constructor(hero) {
        this.hero = hero;
        this.game = hero.game;
        this.weapons = new Set();
        this.lastDamageTime = 0;
        this.damageImmunityTime = 500;
        this.debug = GAME_CONFIG.debug;
        
        // Initialize default weapons
        this.initializeWeapons();
    }

    initializeWeapons() {
        // Add default weapons
        this.addWeapon(new BasicGun(this.hero));
        
        if (this.debug) {
            logDebug('Initialized hero weapons');
        }
    }

    addWeapon(weapon) {
        weapon.setOwner(this.hero);
        this.weapons.add(weapon);
        
        if (this.debug) {
            logDebug(`Added weapon: ${weapon.constructor.name}`);
        }
    }

    removeWeapon(weapon) {
        this.weapons.delete(weapon);
        
        if (this.debug) {
            logDebug(`Removed weapon: ${weapon.constructor.name}`);
        }
    }

    update(deltaTime) {
        // Safety check for game reference
        if (!this.game || !this.game.gameEntities) {
            if (this.debug) logDebug('No valid game reference in hero combat');
            return;
        }

        let hasActiveEnergyBeam = false;
        
        // Update all weapons
        for (const weapon of this.weapons) {
            if (!weapon) continue;

            // Ensure weapon has owner
            if (weapon.owner !== this.hero) {
                weapon.setOwner(this.hero);
            }
            
            // Track energy beam state
            if (weapon instanceof EnergyBeam && weapon.state !== 'idle') {
                hasActiveEnergyBeam = true;
            }
            
            // Update weapon
            weapon.update(deltaTime);
            
            // Auto-fire weapons if they have the canFire method
            if (typeof weapon.canFire === 'function' && weapon.canFire()) {
                const nearestEnemy = this.findNearestEnemy();
                if (nearestEnemy) {
                    const angle = Math.atan2(
                        nearestEnemy.y - this.hero.y,
                        nearestEnemy.x - this.hero.x
                    );
                    weapon.fire(angle);
                }
            }
        }

        // Handle enemy collisions
        this.handleEnemyCollisions();
    }

    findNearestEnemy() {
        if (!this.hero.game?.gameEntities?.entities?.enemies) return null;
        
        const enemies = Array.from(this.hero.game.gameEntities.entities.enemies);
        if (enemies.length === 0) return null;

        let nearest = null;
        let minDistance = Infinity;

        for (const enemy of enemies) {
            const dx = enemy.x - this.hero.x;
            const dy = enemy.y - this.hero.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < minDistance) {
                minDistance = distance;
                nearest = enemy;
            }
        }

        return nearest;
    }

    handleEnemyCollisions() {
        // Safety check for game entities
        if (!this.game?.gameEntities?.entities?.enemies) {
            if (this.debug) logDebug('No valid enemies reference in hero combat');
            return;
        }

        const currentTime = performance.now();
        const enemies = this.game.gameEntities.entities.enemies;

        for (const enemy of enemies) {
            if (!enemy.isDead) {
                const dx = enemy.x - this.hero.x;
                const dy = enemy.y - this.hero.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Add a small buffer to the collision radius
                const collisionRadius = this.hero.radius + enemy.radius + 5;
                
                if (distance < collisionRadius) {
                    // Check if immunity period has passed
                    if (currentTime - this.lastDamageTime > this.damageImmunityTime) {
                        this.hero.takeDamage(enemy.damage || 10);
                        this.lastDamageTime = currentTime;
                        
                        // Create damage particles
                        if (this.game.particleSystem) {
                            this.createDamageParticles(enemy.damage || 10);
                        }

                        if (this.debug) {
                            logDebug(`Hero took ${enemy.damage || 10} damage from enemy collision`);
                        }
                    }
                }
            }
        }
    }

    createDamageParticles(damage) {
        const particleCount = Math.ceil(damage / 2);
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 200 + 100;
            this.game.particleSystem.createParticle(
                this.hero.x,
                this.hero.y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                '#ff0000',
                0.5,
                5
            );
        }
    }

    draw(ctx) {
        // Draw all weapons
        for (const weapon of this.weapons) {
            weapon.draw(ctx);
        }
    }
}