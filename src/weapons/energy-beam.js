import { Weapon } from './weapon.js';
import { GAME_CONFIG } from '../config.js';

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

        if (this.owner && this.owner.game && this.owner.game.entities && this.owner.game.entities.enemies) {
            const enemies = Array.from(this.owner.game.entities.enemies);
            const closestEnemy = this.findClosestEnemy(enemies);
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