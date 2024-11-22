import { BaseWeapon } from './base-weapon.js';
import { Projectile } from './projectile.js';
import { GAME_CONFIG, logDebug } from '../config.js';

class BeamSegment extends Projectile {
    constructor(config) {
        super(config);
        this.distance = config.distance || 100;
        this.width = config.width || 2;
    }

    draw(ctx) {
        const endX = this.x + Math.cos(this.angle) * this.distance;
        const endY = this.y + Math.sin(this.angle) * this.distance;

        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.width;
        ctx.lineCap = 'round';

        // Add glow effect
        ctx.shadowBlur = this.width * 2;
        ctx.shadowColor = this.color;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw particles along the beam
        this.drawBeamParticles(ctx, endX, endY);
    }

    drawBeamParticles(ctx, endX, endY) {
        const particleCount = 5;
        for (let i = 0; i < particleCount; i++) {
            const t = i / (particleCount - 1);
            const particleX = this.x + (endX - this.x) * t;
            const particleY = this.y + (endY - this.y) * t;
            
            ctx.beginPath();
            ctx.arc(particleX, particleY, this.width * 0.8, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }
}

class PulseProjectile extends Projectile {
    constructor(config) {
        super(config);
        this.explosionRadius = config.explosionRadius || 100;
        this.explosionDuration = config.explosionDuration || 0.3;
        this.isExploding = false;
        this.explosionTime = 0;
    }

    update(deltaTime) {
        if (this.isExploding) {
            this.updateExplosion(deltaTime);
            return;
        }

        // Check for collisions before normal update
        if (this.checkCollisions()) {
            this.explode();
            return;
        }

        super.update(deltaTime);
    }

    draw(ctx) {
        if (this.isExploding) {
            this.drawExplosion(ctx);
        } else {
            super.draw(ctx);
        }
    }

    checkCollisions() {
        if (!this.weapon || !this.weapon.game) return false;

        for (const enemy of this.weapon.game.enemies) {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= enemy.radius + this.size) {
                return true;
            }
        }
        return false;
    }

    explode() {
        this.isExploding = true;
        this.explosionTime = 0;
        
        // Deal initial damage to enemies in radius
        if (this.weapon && this.weapon.game) {
            for (const enemy of this.weapon.game.enemies) {
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance <= this.explosionRadius) {
                    const damageMultiplier = 1 - (distance / this.explosionRadius);
                    enemy.takeDamage(this.damage * damageMultiplier);
                }
            }
        }
    }

    updateExplosion(deltaTime) {
        this.explosionTime += deltaTime;
        if (this.explosionTime >= this.explosionDuration) {
            this.shouldRemove = true;
        }
    }

    drawExplosion(ctx) {
        const progress = this.explosionTime / this.explosionDuration;
        const radius = this.explosionRadius * progress;
        const alpha = 1 - progress;

        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 51, 255, ${alpha * 0.3})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.x, this.y, radius * 0.8, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 51, 255, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.stroke();
    }
}

class Weapon extends BaseWeapon {
    constructor(owner) {
        super(owner);
        this.dx = 0;
        this.dy = 0;
        this.muzzleFlashColor = '#ffaa00';
        this.trailColor = '#ff8800';
        this.sparkColor = '#ffff00';
        this.lastFireTime = 0;
    }

    setOwner(owner) {
        this.owner = owner;
        this.game = owner.game;
    }

    update(deltaTime) {
        // Override in subclasses
    }

    fire() {
        // Base fire method - weapons will override this
    }

    draw(ctx) {
        // Base draw method - weapons will override this
    }
}

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
            const closestEnemy = this.owner?.findClosestEnemy();
            if (closestEnemy) {
                this.fire(closestEnemy);
                this.lastFireTime = now;
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
            
            const vx = Math.cos(spreadAngle) * speed;
            const vy = Math.sin(spreadAngle) * speed;

            // Create projectile
            const projectile = new Projectile(
                this.owner.x + Math.cos(baseAngle) * 40,
                this.owner.y + Math.sin(baseAngle) * 40,
                vx,
                vy,
                size,
                this.damage * (size / 4),
                lifetime,
                '#FFA500',
                this.owner
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
            const closestEnemy = this.owner.findClosestEnemy();
            if (closestEnemy) {
                this.fire(closestEnemy);
                this.lastFireTime = now;
            }
        }
    }
}

export class EnergyBeam extends Weapon {
    constructor(owner) {
        super(owner);
        // Beam properties
        this.damage = 20;
        this.maxRange = 2000;
        this.baseBeamWidth = 200;
        this.maxBeamWidth = 400;
        this.beamAngle = 0;
        this.lockedBeamAngle = 0;
        this.debug = GAME_CONFIG.debug;

        // Visual effects configuration
        this.beamColor = '#ff0000';
        this.coreColor = '#ffffff';
        this.outerColor = '#ff6666';
        this.glowColor = '#ff0000';
        
        // Weapon state
        this.state = 'idle';
        this.chargeTime = 0;
        this.fireTime = 0;
        this.CHARGE_DURATION = 7;
        this.FIRE_DURATION = 3;
        
        // Beam growth and exhaustion
        this.currentBeamWidth = 0;
        this.exhaustionParticles = [];
        this.exhaustionRate = 0;
        
        // Recoil effect
        this.recoilOffset = { x: 0, y: 0 };
        this.recoilStrength = 5;
        this.shakeIntensity = 2;
        
        // Charge effect
        this.chargeParticles = [];
        this.chargeSize = 0;
        this.chargeGlow = 0;
        
        // Pulse effect
        this.pulseTime = 0;
        this.pulseSpeed = 15;
        this.pulseMagnitude = 0.3;
        
        // Energy rings
        this.rings = [];
        this.ringSpawnTimer = 0;
        this.ringSpawnInterval = 0.05;
        
        // Shockwave effect
        this.shockwaves = [];
        this.shockwaveTimer = 0;
        this.shockwaveInterval = 0.1;
    }

    update(deltaTime) {
        if (!this.owner || !this.game) return;

        const closestEnemy = this.owner.findClosestEnemy();
        if (closestEnemy) {
            // Only update beam angle when not firing
            if (this.state !== 'firing') {
                const dx = closestEnemy.x - this.owner.x;
                const dy = closestEnemy.y - this.owner.y;
                this.beamAngle = Math.atan2(dy, dx);
            }

            switch(this.state) {
                case 'idle':
                    this.state = 'charging';
                    this.chargeTime = 0;
                    this.chargeSize = 0;
                    this.chargeGlow = 0;
                    this.recoilOffset = { x: 0, y: 0 };
                    break;

                case 'charging':
                    this.chargeTime += deltaTime;
                    this.updateChargeEffects(deltaTime);
                    
                    if (this.chargeTime >= this.CHARGE_DURATION) {
                        this.state = 'firing';
                        this.fireTime = 0;
                        this.lockedBeamAngle = this.beamAngle; 
                        // Create initial blast shockwave
                        for (let i = 0; i < 3; i++) {
                            this.createShockwave(this.owner.x, this.owner.y);
                        }
                    }
                    break;

                case 'firing':
                    this.fireTime += deltaTime;
                    this.updateFiringEffects(deltaTime);
                    this.updateRecoilEffect(deltaTime);
                    
                    // Deal massive damage along the beam
                    this.game.entities.enemies.forEach(enemy => {
                        const distToBeam = this.distanceToBeam(enemy);
                        if (distToBeam < this.getCurrentBeamWidth() / 2) {
                            enemy.takeDamage(this.damage);
                        }
                    });

                    if (this.fireTime >= this.FIRE_DURATION) {
                        this.state = 'idle';
                        this.rings = [];
                        this.shockwaves = [];
                        this.recoilOffset = { x: 0, y: 0 };
                    }
                    break;
            }
        } else {
            this.state = 'idle';
        }

        // Update pulse effect
        this.pulseTime += deltaTime * this.pulseSpeed;
    }

    updateRecoilEffect(deltaTime) {
        // Calculate recoil direction (opposite to beam direction)
        const recoilAngle = this.lockedBeamAngle + Math.PI;
        
        // Add random shake
        const shake = {
            x: (Math.random() - 0.5) * this.shakeIntensity,
            y: (Math.random() - 0.5) * this.shakeIntensity
        };
        
        // Apply recoil and shake
        this.recoilOffset = {
            x: Math.cos(recoilAngle) * this.recoilStrength + shake.x,
            y: Math.sin(recoilAngle) * this.recoilStrength + shake.y
        };
    }

    updateChargeEffects(deltaTime) {
        const chargeProgress = this.chargeTime / this.CHARGE_DURATION;
        this.chargeSize = this.baseBeamWidth * chargeProgress;
        this.chargeGlow = 30 * chargeProgress;

        // Create charging particles
        if (Math.random() < chargeProgress * 0.8) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * this.chargeSize * 2;
            const particleX = this.owner.x + Math.cos(angle) * distance;
            const particleY = this.owner.y + Math.sin(angle) * distance;
            this.chargeParticles.push({
                x: particleX,
                y: particleY,
                angle: Math.atan2(this.owner.y - particleY, this.owner.x - particleX),
                speed: 100 + Math.random() * 200,
                life: 0.5
            });
        }

        // Update charging particles
        this.chargeParticles.forEach(particle => {
            particle.x += Math.cos(particle.angle) * particle.speed * deltaTime;
            particle.y += Math.sin(particle.angle) * particle.speed * deltaTime;
            particle.life -= deltaTime;
        });
        this.chargeParticles = this.chargeParticles.filter(p => p.life > 0);
    }

    updateFiringEffects(deltaTime) {
        // Calculate beam growth and exhaustion
        const growthDuration = this.FIRE_DURATION * 0.4; 
        const exhaustionStart = this.FIRE_DURATION * 0.7; 

        if (this.fireTime < growthDuration) {
            // Growth phase
            const growthProgress = this.fireTime / growthDuration;
            this.currentBeamWidth = this.baseBeamWidth + (this.maxBeamWidth - this.baseBeamWidth) * growthProgress;
            this.exhaustionRate = 0;
        } else if (this.fireTime > exhaustionStart) {
            // Exhaustion phase
            const exhaustionProgress = (this.fireTime - exhaustionStart) / (this.FIRE_DURATION - exhaustionStart);
            this.exhaustionRate = exhaustionProgress;
            
            // Create exhaustion particles
            if (Math.random() < exhaustionProgress * 0.8) {
                const angle = this.lockedBeamAngle + (Math.random() - 0.5) * Math.PI / 2;
                const distance = Math.random() * this.maxRange * 0.8;
                const speed = 100 + Math.random() * 200;
                this.exhaustionParticles.push({
                    x: this.owner.x + Math.cos(this.lockedBeamAngle) * distance,
                    y: this.owner.y + Math.sin(this.lockedBeamAngle) * distance,
                    angle: angle + Math.PI + (Math.random() - 0.5) * Math.PI / 4,
                    speed: speed,
                    life: 0.5 + Math.random() * 0.5,
                    size: 2 + Math.random() * 3
                });
            }
        }

        // Update exhaustion particles
        this.exhaustionParticles.forEach(particle => {
            particle.x += Math.cos(particle.angle) * particle.speed * deltaTime;
            particle.y += Math.sin(particle.angle) * particle.speed * deltaTime;
            particle.life -= deltaTime;
        });
        this.exhaustionParticles = this.exhaustionParticles.filter(p => p.life > 0);

        // Spawn energy rings
        this.ringSpawnTimer += deltaTime;
        if (this.ringSpawnTimer >= this.ringSpawnInterval) {
            const distance = Math.random() * this.maxRange;
            const x = this.owner.x + Math.cos(this.lockedBeamAngle) * distance;
            const y = this.owner.y + Math.sin(this.lockedBeamAngle) * distance;
            this.createEnergyRing(x, y);
            this.ringSpawnTimer = 0;
        }

        // Spawn shockwaves
        this.shockwaveTimer += deltaTime;
        if (this.shockwaveTimer >= this.shockwaveInterval) {
            const x = this.owner.x + Math.cos(this.lockedBeamAngle) * 30;
            const y = this.owner.y + Math.sin(this.lockedBeamAngle) * 30;
            this.createShockwave(x, y);
            this.shockwaveTimer = 0;
        }

        // Update rings
        this.rings.forEach(ring => {
            ring.radius += deltaTime * 200;
            ring.life -= deltaTime * 2;
        });
        this.rings = this.rings.filter(ring => ring.life > 0);

        // Update shockwaves
        this.shockwaves.forEach(wave => {
            wave.radius += deltaTime * 300;
            wave.life -= deltaTime * 2;
        });
        this.shockwaves = this.shockwaves.filter(wave => wave.life > 0);
    }

    createEnergyRing(x, y) {
        this.rings.push({
            x,
            y,
            radius: this.baseBeamWidth * 0.3,
            maxRadius: this.baseBeamWidth * 0.8,
            life: 1,
            angle: this.lockedBeamAngle
        });
    }

    createShockwave(x, y) {
        this.shockwaves.push({
            x,
            y,
            radius: this.baseBeamWidth * 0.5,
            maxRadius: this.baseBeamWidth * 2,
            life: 1
        });
    }

    getCurrentBeamWidth() {
        let width = this.state === 'charging' ? 
            this.chargeSize : this.currentBeamWidth || this.baseBeamWidth;
            
        // Add pulse effect
        width *= (1 + Math.sin(this.pulseTime) * this.pulseMagnitude);
        
        // Add exhaustion effect
        if (this.exhaustionRate > 0) {
            width *= (1 - this.exhaustionRate * 0.3); 
            width *= (1 + (Math.random() - 0.5) * this.exhaustionRate * 0.4); 
        }
        
        return width;
    }

    distanceToBeam(entity) {
        const x1 = this.owner.x;
        const y1 = this.owner.y;
        const x2 = this.owner.x + Math.cos(this.lockedBeamAngle) * this.maxRange;
        const y2 = this.owner.y + Math.sin(this.lockedBeamAngle) * this.maxRange;
        const x0 = entity.x;
        const y0 = entity.y;

        const numerator = Math.abs((y2-y1)*x0 - (x2-x1)*y0 + x2*y1 - y2*x1);
        const denominator = Math.sqrt((y2-y1)**2 + (x2-x1)**2);
        return numerator/denominator;
    }

    draw(ctx) {
        if (this.state === 'idle') return;

        // Apply recoil offset to drawing position
        const drawX = this.owner.x + this.recoilOffset.x;
        const drawY = this.owner.y + this.recoilOffset.y;

        ctx.save();
        
        if (this.state === 'charging') {
            // Draw charge effect
            const gradient = ctx.createRadialGradient(
                drawX, drawY, 0,
                drawX, drawY, this.chargeSize * 2
            );
            gradient.addColorStop(0, 'rgba(255, 0, 0, 0.7)');
            gradient.addColorStop(0.5, 'rgba(255, 0, 0, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(drawX, drawY, this.chargeSize * 2, 0, Math.PI * 2);
            ctx.fill();

            // Draw charging particles
            this.chargeParticles.forEach(particle => {
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${particle.life * 2})`;
                ctx.shadowBlur = 10;
                ctx.shadowColor = this.glowColor;
                ctx.fill();
            });

            // Draw charging core
            ctx.beginPath();
            ctx.arc(drawX, drawY, this.chargeSize, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.shadowBlur = this.chargeGlow;
            ctx.shadowColor = this.glowColor;
            ctx.fill();
        }

        if (this.state === 'firing') {
            // Draw massive outer glow
            const gradient = ctx.createRadialGradient(
                drawX, drawY, 0,
                drawX, drawY, this.maxRange
            );
            gradient.addColorStop(0, `rgba(255, 0, 0, ${0.3 * (1 - this.exhaustionRate * 0.5)})`);
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(drawX, drawY, this.maxRange, 0, Math.PI * 2);
            ctx.fill();

            // Draw exhaustion particles
            this.exhaustionParticles.forEach(particle => {
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, ${100 + Math.random() * 155}, 0, ${particle.life})`;
                ctx.shadowBlur = 10;
                ctx.shadowColor = this.glowColor;
                ctx.fill();
            });

            // Draw shockwaves
            this.shockwaves.forEach(wave => {
                ctx.beginPath();
                ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(255, 0, 0, ${wave.life * 0.3})`;
                ctx.lineWidth = 3;
                ctx.stroke();
            });

            // Calculate current beam width with effects
            const beamWidth = this.getCurrentBeamWidth();
            
            // Draw the main beam with multiple layers
            const layers = [
                { width: beamWidth, color: `rgba(255, 0, 0, ${0.3 * (1 - this.exhaustionRate * 0.5)})`, blur: 30 },
                { width: beamWidth * 0.8, color: `rgba(255, 0, 0, ${0.5 * (1 - this.exhaustionRate * 0.4)})`, blur: 20 },
                { width: beamWidth * 0.6, color: `rgba(255, 0, 0, ${0.7 * (1 - this.exhaustionRate * 0.3)})`, blur: 15 },
                { width: beamWidth * 0.4, color: `rgba(255, ${50 + Math.random() * 50}, 0, ${1 - this.exhaustionRate * 0.2})`, blur: 10 },
                { width: beamWidth * 0.2, color: `rgba(255, 255, 255, ${1 - this.exhaustionRate * 0.5})`, blur: 5 }
            ];

            layers.forEach(layer => {
                ctx.beginPath();
                ctx.shadowBlur = layer.blur;
                ctx.shadowColor = this.glowColor;
                ctx.lineWidth = layer.width * (1 + (Math.random() - 0.5) * this.exhaustionRate * 0.2);
                ctx.strokeStyle = layer.color;
                ctx.lineCap = 'round';
                
                ctx.moveTo(drawX, drawY);
                ctx.lineTo(
                    drawX + Math.cos(this.lockedBeamAngle) * this.maxRange,
                    drawY + Math.sin(this.lockedBeamAngle) * this.maxRange
                );
                ctx.stroke();
            });

            // Draw energy rings
            this.rings.forEach(ring => {
                ctx.beginPath();
                const startAngle = this.lockedBeamAngle - Math.PI/3;
                const endAngle = this.lockedBeamAngle + Math.PI/3;
                ctx.arc(ring.x, ring.y, ring.radius, startAngle, endAngle);
                ctx.strokeStyle = `rgba(255, 255, 255, ${ring.life * 0.7})`;
                ctx.lineWidth = 3;
                ctx.shadowBlur = 10;
                ctx.shadowColor = this.glowColor;
                ctx.stroke();
            });
        }

        ctx.restore();
    }
}

export class PulseCannon extends BaseWeapon {
    constructor(owner) {
        super(owner);
        this.name = 'PulseCannon';
        this.cooldown = 0.8;
        this.lastFireTime = 0;
        this.baseDamage = 120;
        this.chainDelay = 0.08;  // Faster jumps
        this.chainRange = 250;
        this.maxTargets = 35;

        // Lightning effect properties
        this.lightningColors = {
            core: '#ffffff',     // Pure white core
            inner: '#40ffff',    // Bright cyan inner
            outer: '#0080ff',    // Electric blue outer
            impact: '#80ffff'    // Impact flash color
        };
        
        // Lightning generation settings - optimized values
        this.branchProbability = 0.3;     // Reduced branch probability
        this.branchAngleRange = 0.8;
        this.segmentLength = 20;          // Increased segment length
        this.displacement = 0.4;
        this.detail = 6;
        this.maxBranchesPerBolt = 2;      // Limit branches
        this.maxParticlesPerImpact = 8;   // Reduced particles
        this.maxActiveChains = 3;         // Limit active chains
        
        this.activeChains = new Set();
    }

    update(deltaTime) {
        const now = performance.now() / 1000;
        if (now - this.lastFireTime >= this.cooldown) {
            const target = this.owner?.findClosestEnemy();
            if (target) {
                this.fire(target);
                this.lastFireTime = now;
            }
        }

        // Update active chains
        for (const chain of this.activeChains) {
            chain.age += deltaTime;
            
            // Update impact particles
            for (const impact of chain.impacts) {
                impact.age += deltaTime;
                for (const particle of impact.particles) {
                    particle.age += deltaTime;
                    particle.x += particle.vx * deltaTime;
                    particle.y += particle.vy * deltaTime;
                }
            }

            // Remove expired chains
            if (chain.age >= chain.duration) {
                this.activeChains.delete(chain);
            }
        }
    }

    generateImpactParticles(x, y) {
        const particles = [];
        const particleCount = this.maxParticlesPerImpact;

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = Math.random() * 50 + 25;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;

            particles.push({
                x: 0,
                y: 0,
                vx,
                vy,
                age: 0
            });
        }

        return particles;
    }

    async chainLightning(startX, startY, targets) {
        if (!targets || targets.length === 0) return;

        // Limit active chains
        if (this.activeChains.size >= this.maxActiveChains) {
            const oldestChain = Array.from(this.activeChains)[0];
            this.activeChains.delete(oldestChain);
        }

        let currentX = startX;
        let currentY = startY;
        let chain = {
            segments: [],
            branches: [],
            impacts: [],
            age: 0,
            duration: 0.4,
            alpha: 1
        };
        this.activeChains.add(chain);

        // Chain through each target sequentially
        for (let i = 0; i < Math.min(targets.length, this.maxTargets); i++) {
            const target = targets[i];
            if (!target || target.isDead) continue;

            const mainBolt = this.generateLightningPoints(
                currentX, currentY,
                target.x, target.y,
                this.detail,
                true
            );

            chain.impacts.push({
                x: target.x,
                y: target.y,
                age: 0,
                particles: this.generateImpactParticles(target.x, target.y)
            });

            chain.segments.push({
                points: mainBolt,
                age: 0,
                target: target
            });

            if (mainBolt.branches) {
                chain.branches.push(...mainBolt.branches);
            }

            if (!target.isDead) {
                const damageMultiplier = Math.max(0.3, 1 - (i * 0.15));
                const damage = this.baseDamage * damageMultiplier;
                target.takeDamage(damage);

                if (this.owner.game.camera) {
                    const shakeIntensity = 4 * damageMultiplier;
                    this.owner.game.camera.shake(shakeIntensity, 0.15);
                }
            }

            currentX = target.x;
            currentY = target.y;

            await new Promise(resolve => setTimeout(resolve, this.chainDelay * 1000));
        }
    }

    draw(ctx) {
        if (!ctx || !this.owner) return;

        // Render all active lightning chains
        for (const chain of this.activeChains) {
            const alpha = Math.max(0, 1 - (chain.age / chain.duration));
            
            // Batch render all lightning segments for each layer
            const operations = {
                core: [],    // Core white lightning
                inner: [],   // Inner cyan glow
                outer: []    // Outer blue glow
            };

            // Collect all rendering operations
            for (const segment of chain.segments) {
                const points = segment.points;
                if (!points || points.length < 2) continue;

                operations.outer.push(points);
                operations.inner.push(points);
                operations.core.push(points);

                // Add branches if they exist
                if (points.branches) {
                    for (const branch of points.branches) {
                        operations.outer.push(branch);
                        operations.inner.push(branch);
                        operations.core.push(branch);
                    }
                }
            }

            // Render each layer with different settings
            ctx.globalAlpha = alpha;
            this.batchRenderLightning(ctx, operations.outer, this.lightningColors.outer, 8, 16);
            this.batchRenderLightning(ctx, operations.inner, this.lightningColors.inner, 4, 8);
            this.batchRenderLightning(ctx, operations.core, this.lightningColors.core, 2, 4);

            // Render impact effects
            this.batchRenderImpacts(ctx, chain.impacts);
            ctx.globalAlpha = 1;
        }
    }

    batchRenderLightning(ctx, operations, color, width, blur) {
        if (operations.length === 0) return;

        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = color;
        ctx.shadowBlur = blur;
        ctx.globalCompositeOperation = 'screen';

        ctx.beginPath();
        for (const points of operations) {
            if (!points || points.length < 2) continue;

            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
        }
        ctx.stroke();
        ctx.restore();
    }

    batchRenderImpacts(ctx, impacts) {
        if (!impacts || impacts.length === 0) return;

        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        for (const impact of impacts) {
            if (!impact || impact.age >= 0.3) continue;

            const alpha = Math.max(0, 1 - (impact.age / 0.3));
            const radius = 10 * (1 + impact.age * 2);

            // Draw impact flash
            ctx.beginPath();
            ctx.arc(impact.x, impact.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(128, 255, 255, ${alpha * 0.5})`;
            ctx.fill();

            // Draw particles
            for (const particle of impact.particles) {
                if (!particle || particle.age >= 0.3) continue;
                const particleAlpha = Math.max(0, 1 - (particle.age / 0.3));
                ctx.beginPath();
                ctx.arc(
                    impact.x + particle.x,
                    impact.y + particle.y,
                    2,
                    0,
                    Math.PI * 2
                );
                ctx.fillStyle = `rgba(128, 255, 255, ${particleAlpha})`;
                ctx.fill();
            }
        }
        ctx.restore();
    }

    generateDetailPoints(startX, startY, endX, endY, detail) {
        const points = [];
        const dx = endX - startX;
        const dy = endY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Base case - if distance is too small or detail is 0
        if (distance < 10 || detail === 0) {
            points.push({ x: startX, y: startY });
            points.push({ x: endX, y: endY });
            return points;
        }
        
        // Add start point
        points.push({ x: startX, y: startY });
        
        // Calculate midpoint with displacement
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        
        // Add perpendicular displacement
        const perpX = -dy / distance;
        const perpY = dx / distance;
        
        // Random displacement scaled by distance and detail level
        const displacement = (Math.random() - 0.5) * distance * this.displacement * (detail / 5);
        const displacedMidX = midX + perpX * displacement;
        const displacedMidY = midY + perpY * displacement;
        
        // Recursively generate points for each half
        const leftPoints = this.generateDetailPoints(startX, startY, displacedMidX, displacedMidY, detail - 1);
        const rightPoints = this.generateDetailPoints(displacedMidX, displacedMidY, endX, endY, detail - 1);
        
        // Combine points, removing duplicates at the midpoint
        points.push(...leftPoints.slice(1, -1));
        points.push({ x: displacedMidX, y: displacedMidY });
        points.push(...rightPoints.slice(1));
        
        return points;
    }

    simplifyPoints(points, targetCount) {
        if (!points || points.length <= targetCount) return points;
        
        const step = points.length / targetCount;
        const simplified = [];
        
        for (let i = 0; i < targetCount; i++) {
            const index = Math.min(Math.floor(i * step), points.length - 1);
            simplified.push(points[index]);
        }
        
        // Always include the last point
        if (simplified[simplified.length - 1] !== points[points.length - 1]) {
            simplified.push(points[points.length - 1]);
        }
        
        return simplified;
    }

    generateLightningPoints(startX, startY, endX, endY, detail, canBranch = true) {
        // Generate main lightning bolt points
        const points = this.generateDetailPoints(startX, startY, endX, endY, detail);
        
        // Add branches if allowed
        if (canBranch && detail > 1) {
            points.branches = [];
            
            // Consider creating branches from each segment
            for (let i = 0; i < points.length - 1; i++) {
                if (Math.random() < this.branchProbability && points.branches.length < this.maxBranchesPerBolt) {
                    const start = points[i];
                    const next = points[i + 1];
                    
                    // Calculate branch endpoint
                    const dx = next.x - start.x;
                    const dy = next.y - start.y;
                    const distance = Math.sqrt(dx * dx + dy * dy) * 0.6; // Branch length is 60% of segment
                    
                    // Random angle deviation
                    const baseAngle = Math.atan2(dy, dx);
                    const branchAngle = baseAngle + (Math.random() - 0.5) * this.branchAngleRange;
                    
                    const branchEndX = start.x + Math.cos(branchAngle) * distance;
                    const branchEndY = start.y + Math.sin(branchAngle) * distance;
                    
                    // Generate branch with reduced detail and no further branching
                    const branchPoints = this.generateDetailPoints(
                        start.x, start.y,
                        branchEndX, branchEndY,
                        detail - 1
                    );
                    
                    points.branches.push(branchPoints);
                }
            }
        }
        
        return points;
    }

    async fire(target) {
        if (!this.owner || !this.owner.game) return;
        
        const currentTime = performance.now() / 1000;
        if (currentTime - this.lastFireTime < this.cooldown) return;
        this.lastFireTime = currentTime;

        // Convert Set to Array before filtering
        const enemies = Array.from(this.owner.game.entities.enemies);
        
        // Find nearby enemies within range
        const nearbyEnemies = enemies
            .filter(enemy => !enemy.isDead)
            .filter(enemy => {
                const dx = enemy.x - this.owner.x;
                const dy = enemy.y - this.owner.y;
                return Math.hypot(dx, dy) <= this.chainRange;
            })
            .sort((a, b) => {
                const distA = Math.hypot(a.x - this.owner.x, a.y - this.owner.y);
                const distB = Math.hypot(b.x - this.owner.x, b.y - this.owner.y);
                return distA - distB;
            });

        if (nearbyEnemies.length > 0) {
            await this.chainLightning(this.owner.x, this.owner.y, nearbyEnemies);
        }
    }
}