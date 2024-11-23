import { GAME_CONFIG, logDebug } from '../../config.js';

export class HeroDash {
    constructor(hero) {
        this.hero = hero;
        this.isDashing = false;
        this.dashSpeed = GAME_CONFIG.hero.dash.speed;
        this.dashDuration = GAME_CONFIG.hero.dash.duration;
        this.dashCooldown = GAME_CONFIG.hero.dash.cooldown;
        this.lastDashTime = 0;
        this.dashTimer = 0;
        this.dashDamage = GAME_CONFIG.hero.dash.damage;
        this.isInvincible = false;
        this.dashDirX = 0;
        this.dashDirY = 0;
        this.debug = hero.debug;
    }

    update(deltaTime) {
        if (this.isDashing) {
            this.updateDash(deltaTime);
        }
    }

    updateDash(deltaTime) {
        this.dashTimer += deltaTime;
        
        // Move during dash
        const dashSpeed = GAME_CONFIG.hero.dash.speed;
        this.hero.worldX += this.dashDirX * dashSpeed * deltaTime;
        this.hero.worldY += this.dashDirY * dashSpeed * deltaTime;
        
        // Create trail particles
        if (this.hero.game.particleSystem) {
            const particleSpeed = 50;
            this.hero.game.particleSystem.createParticle(
                this.hero.x, this.hero.y,
                -this.dashDirX * particleSpeed + (Math.random() - 0.5) * 20,
                -this.dashDirY * particleSpeed + (Math.random() - 0.5) * 20,
                '#4CAF50',
                0.3,
                3
            );
        }
        
        if (this.dashTimer >= this.dashDuration) {
            this.endDash();
        }
        
        // Damage enemies during dash
        this.hero.game.entities.enemies.forEach(enemy => {
            const dx = enemy.worldX - this.hero.worldX;
            const dy = enemy.worldY - this.hero.worldY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = this.hero.radius + enemy.radius;

            if (distance < minDistance) {
                enemy.takeDamage(this.dashDamage);
                const angle = Math.atan2(dy, dx);
                const force = 800;
                enemy.worldX += Math.cos(angle) * force * deltaTime;
                enemy.worldY += Math.sin(angle) * force * deltaTime;
                
                if (this.hero.game.particleSystem) {
                    const particleCount = 10;
                    for (let i = 0; i < particleCount; i++) {
                        const particleAngle = angle + (Math.random() - 0.5) * Math.PI;
                        const speed = Math.random() * 300 + 200;
                        this.hero.game.particleSystem.createParticle(
                            enemy.x, enemy.y,
                            Math.cos(particleAngle) * speed,
                            Math.sin(particleAngle) * speed,
                            '#ff4444',
                            0.3,
                            4
                        );
                    }
                }
            }
        });
    }

    startDash(dirX, dirY) {
        if (this.isDashing) return;
        
        // Normalize direction
        const length = Math.sqrt(dirX * dirX + dirY * dirY);
        if (length === 0) {
            dirX = 1;
            dirY = 0;
        } else {
            dirX /= length;
            dirY /= length;
        }
        
        this.isDashing = true;
        this.isInvincible = true;
        this.dashTimer = 0;
        this.lastDashTime = performance.now();
        
        this.dashDirX = dirX;
        this.dashDirY = dirY;
        
        if (GAME_CONFIG.hero.dash.screenShake) {
            const { intensity, duration } = GAME_CONFIG.hero.dash.screenShake;
            this.hero.game.startScreenShake(intensity, duration);
        }
        
        if (this.hero.game.particleSystem) {
            const particleCount = 20;
            for (let i = 0; i < particleCount; i++) {
                const angle = (Math.PI * 2 * i) / particleCount;
                const speed = Math.random() * 200 + 100;
                const lifetime = Math.random() * 0.3 + 0.2;
                this.hero.game.particleSystem.createParticle(
                    this.hero.x, this.hero.y,
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed,
                    '#4CAF50',
                    lifetime,
                    5
                );
            }
        }
    }

    endDash() {
        this.isDashing = false;
        this.isInvincible = false;
        this.hero.speed = this.hero.maxSpeed;
        if (this.debug) {
            logDebug('Hero ended dash');
        }
    }

    canDash() {
        return !this.isDashing && performance.now() - this.lastDashTime >= this.dashCooldown;
    }
}