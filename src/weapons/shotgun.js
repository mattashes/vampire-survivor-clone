import { Weapon } from './weapon.js';
import { Projectile } from './projectile.js';

export class Shotgun extends Weapon {
    constructor(owner) {
        super({
            damage: 35,
            fireRate: 1.2,
            projectileSpeed: 800,
            projectileLifetime: 0.6,
            projectileSize: 6,
            projectileColor: '#ffff00',
            spread: Math.PI / 3,
            projectilesPerShot: 24
        });
        this.setOwner(owner);
        
        this.recoilForce = 200;
        this.muzzleFlashScale = 2.5;
        
        // Define specific channels for more consistent spread
        this.channels = [];
        const channelCount = 8; 
        for (let i = 0; i < channelCount; i++) {
            const angle = (i / channelCount) * Math.PI * 2;
            this.channels.push({
                angle: angle,
                lastFireTime: 0
            });
        }
        
        // Lighter, more transparent smoke colors
        this.smokeColors = [
            'rgba(180, 180, 180, 0.2)',
            'rgba(200, 200, 200, 0.15)',
            'rgba(220, 220, 220, 0.1)',
            'rgba(160, 160, 160, 0.25)'
        ];
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

    createMuzzleFlash(baseAngle) {
        if (!this.owner || !this.owner.game.particleSystem) return;

        const muzzleX = this.owner.x + Math.cos(baseAngle) * 40;
        const muzzleY = this.owner.y + Math.sin(baseAngle) * 40;

        // Big initial flash
        for (let i = 0; i < 12; i++) {
            const flashSize = (25 + Math.random() * 20) * this.muzzleFlashScale;
            const flashSpeed = 200 + Math.random() * 300;
            const flashAngle = baseAngle + (Math.random() - 0.5) * Math.PI / 3;
            const flashColor = `rgba(255, ${150 + Math.random() * 105}, 0, ${0.5 + Math.random() * 0.3})`; 

            this.owner.game.particleSystem.createParticle(
                muzzleX, muzzleY,
                Math.cos(flashAngle) * flashSpeed,
                Math.sin(flashAngle) * flashSpeed,
                flashColor,
                0.1 + Math.random() * 0.15,
                flashSize,
                -flashSize * 3
            );
        }

        // Lighter smoke cloud
        for (let i = 0; i < 20; i++) {
            const smokeSize = (20 + Math.random() * 30) * this.muzzleFlashScale;
            const smokeSpeed = 100 + Math.random() * 200;
            const smokeAngle = baseAngle + (Math.random() - 0.5) * Math.PI / 2;
            const smokeColor = this.smokeColors[Math.floor(Math.random() * this.smokeColors.length)];
            const lifetime = 0.3 + Math.random() * 0.3; 

            this.owner.game.particleSystem.createParticle(
                muzzleX, muzzleY,
                Math.cos(smokeAngle) * smokeSpeed,
                Math.sin(smokeAngle) * smokeSpeed,
                smokeColor,
                lifetime,
                smokeSize,
                smokeSize * 0.3 
            );

            // Add some white wisps for detail
            if (Math.random() < 0.3) { 
                this.owner.game.particleSystem.createParticle(
                    muzzleX, muzzleY,
                    Math.cos(smokeAngle) * smokeSpeed * 1.2,
                    Math.sin(smokeAngle) * smokeSpeed * 1.2,
                    'rgba(255, 255, 255, 0.1)',
                    lifetime * 0.7,
                    smokeSize * 0.5,
                    smokeSize * 0.2
                );
            }
        }

        // Sparks remain the same but slightly more transparent
        for (let i = 0; i < 15; i++) {
            const sparkSize = 3 + Math.random() * 4;
            const sparkSpeed = 400 + Math.random() * 600;
            const sparkAngle = baseAngle + (Math.random() - 0.5) * this.spread * 1.2;
            
            this.owner.game.particleSystem.createParticle(
                muzzleX, muzzleY,
                Math.cos(sparkAngle) * sparkSpeed,
                Math.sin(sparkAngle) * sparkSpeed,
                'rgba(255, 255, 0, 0.8)', 
                0.1 + Math.random() * 0.2,
                sparkSize,
                -sparkSize * 2
            );
        }
    }

    createHitEffect(x, y) {
        if (!this.owner || !this.owner.game.particleSystem) return;

        // Debris particles
        for (let i = 0; i < 8; i++) {
            const debrisSize = 4 + Math.random() * 6;
            const debrisSpeed = 200 + Math.random() * 300;
            const debrisAngle = Math.random() * Math.PI * 2;
            
            this.owner.game.particleSystem.createParticle(
                x, y,
                Math.cos(debrisAngle) * debrisSpeed,
                Math.sin(debrisAngle) * debrisSpeed,
                '#8B4513', 
                0.3 + Math.random() * 0.3,
                debrisSize,
                -debrisSize
            );
        }

        // Impact sparks
        for (let i = 0; i < 6; i++) {
            const sparkSize = 3 + Math.random() * 3;
            const sparkSpeed = 300 + Math.random() * 400;
            const sparkAngle = Math.random() * Math.PI * 2;
            
            this.owner.game.particleSystem.createParticle(
                x, y,
                Math.cos(sparkAngle) * sparkSpeed,
                Math.sin(sparkAngle) * sparkSpeed,
                '#FFA500',
                0.2 + Math.random() * 0.2,
                sparkSize,
                -sparkSize * 3
            );
        }
    }

    fire(angle) {
        if (!this.owner || typeof this.owner.x !== 'number' || typeof this.owner.y !== 'number') {
            console.warn('Invalid owner position for shotgun fire');
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

        // Create multiple projectiles with spread
        for (let i = 0; i < this.projectilesPerShot; i++) {
            // Calculate spread angle
            const spreadAngle = angle + (Math.random() - 0.5) * this.spread;
            
            try {
                const projectile = new Projectile({
                    x: this.owner.x,
                    y: this.owner.y,
                    angle: spreadAngle,
                    speed: this.projectileSpeed,
                    lifetime: this.projectileLifetime,
                    size: this.projectileSize,
                    color: this.projectileColor,
                    damage: this.damage,
                    weapon: this
                });

                if (this.owner.game?.gameEntities) {
                    this.owner.game.gameEntities.addProjectile(projectile);
                }
            } catch (error) {
                console.error('Failed to create shotgun projectile:', error);
            }
        }
    }
}