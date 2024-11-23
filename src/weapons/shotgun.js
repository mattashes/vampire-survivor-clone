import { BaseWeapon } from './base-weapon.js';
import { Projectile } from './projectile.js';

export class Shotgun extends BaseWeapon {
    constructor(owner) {
        super(owner);
        this.fireRate = 1.2;  // Original fire rate restored
        this.damage = 35;
        this.projectileSpeed = 800;
        this.projectileLifetime = 0.6; 
        this.spread = Math.PI / 3; 
        this.projectilesPerShot = 24; 
        this.lastFireTime = 0;
        this.cooldown = 1 / this.fireRate;
        this.recoilForce = 200;
        this.muzzleFlashScale = 2.5;
        
        // Define specific channels for more consistent spread
        this.channels = [];
        const channelCount = 8; 
        for (let i = 0; i < channelCount; i++) {
            // Create three pellets per channel with slight variation
            const baseAngle = (i / channelCount) - 0.5; 
            this.channels.push(
                baseAngle * this.spread, 
                (baseAngle - 0.04) * this.spread, 
                (baseAngle + 0.04) * this.spread  
            );
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

    fire(target) {
        if (!this.owner) return;

        const baseAngle = Math.atan2(target.y - this.owner.y, target.x - this.owner.x);
        
        // MASSIVE muzzle flash
        this.createMuzzleFlash(baseAngle);

        // Apply subtle recoil
        if (this.owner.applyForce) {
            this.owner.applyForce(
                -Math.cos(baseAngle) * this.recoilForce,
                -Math.sin(baseAngle) * this.recoilForce,
                0.08
            );
        }

        // Create pellets with channel-based distribution
        for (let i = 0; i < this.projectilesPerShot; i++) {
            // Use channel angles for main spread pattern
            let spreadAngle;
            if (i < this.channels.length) {
                // Use predefined channel
                spreadAngle = baseAngle + this.channels[i] + (Math.random() - 0.5) * 0.1;
            } else {
                // Random spread for remaining pellets
                spreadAngle = baseAngle + (Math.random() - 0.5) * this.spread;
            }
            
            // Randomize properties with more consistent ranges
            const speedVariation = 0.85 + Math.random() * 0.3;
            const speed = this.projectileSpeed * speedVariation;
            const size = 3 + Math.random() * 4;
            const lifetime = this.projectileLifetime * (0.8 + Math.random() * 0.4);
            
            const startX = this.owner.x + Math.cos(baseAngle) * 40;
            const startY = this.owner.y + Math.sin(baseAngle) * 40;
            const vx = Math.cos(spreadAngle) * speed;
            const vy = Math.sin(spreadAngle) * speed;

            // Create projectile with correct constructor parameters
            const projectile = new Projectile(
                startX,
                startY,
                vx,
                vy,
                size,
                this.damage * (size / 4),
                lifetime,
                '#FFA500',
                this
            );

            // Custom draw for pellets
            projectile.draw = function(ctx) {
                if (!ctx || this.isDead) return;

                ctx.save();
                
                // Stretched pellet effect based on velocity
                const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                const stretch = Math.min(speed / 400, 3);
                const angle = Math.atan2(this.vy, this.vx);
                
                // Draw stretched pellet
                ctx.translate(this.x, this.y);
                ctx.rotate(angle);
                ctx.scale(stretch, 1);
                
                // Main pellet
                ctx.fillStyle = '#8B4513';
                ctx.beginPath();
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                ctx.fill();
                
                // Bright front
                ctx.fillStyle = '#FFA500';
                ctx.beginPath();
                ctx.arc(this.size/2, 0, this.size * 0.7, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();

                // Speed trail
                if (speed > 400) {
                    ctx.save();
                    const trailLength = Math.min((speed - 400) / 100, 10);
                    const gradient = ctx.createLinearGradient(
                        this.x - Math.cos(angle) * this.size * trailLength,
                        this.y - Math.sin(angle) * this.size * trailLength,
                        this.x,
                        this.y
                    );
                    gradient.addColorStop(0, 'rgba(255, 165, 0, 0)');
                    gradient.addColorStop(1, 'rgba(255, 165, 0, 0.5)');
                    
                    ctx.strokeStyle = gradient;
                    ctx.lineWidth = this.size;
                    ctx.beginPath();
                    ctx.moveTo(
                        this.x - Math.cos(angle) * this.size * trailLength,
                        this.y - Math.sin(angle) * this.size * trailLength
                    );
                    ctx.lineTo(this.x, this.y);
                    ctx.stroke();
                    ctx.restore();
                }
            };

            // Add hit effect
            projectile.onHit = (target) => {
                this.createHitEffect(projectile.x, projectile.y);
            };

            if (this.owner.game.entities && this.owner.game.entities.projectiles) {
                this.owner.game.entities.projectiles.add(projectile);
            }
        }

        // Screen shake
        if (this.owner.game.camera) {
            this.owner.game.camera.shake(10, 0.2);
        }
    }
}