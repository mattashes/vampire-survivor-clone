import Entity from './entity.js';
import { GAME_CONFIG, logDebug } from '../config.js';
import { MiniGun, EnergyBeam, PulseCannon } from '../weapons/weapon-types.js';
import { BasicGun } from '../weapons/basic-gun.js';

export class Hero extends Entity {
    constructor(x, y, game) {
        super(x, y, GAME_CONFIG.hero.radius, GAME_CONFIG.hero.color, GAME_CONFIG.hero.maxSpeed, game);
        this.baseRadius = GAME_CONFIG.hero.radius;
        this.radius = this.baseRadius;
        this.maxRadius = this.baseRadius * 2.5; // Maximum size during power-up
        this.color = GAME_CONFIG.hero.color;
        this.maxSpeed = GAME_CONFIG.hero.maxSpeed;
        this.speed = this.maxSpeed; // Set the actual speed
        this.level = 1;
        this.maxHealth = GAME_CONFIG.hero.maxHealth;
        this.health = this.maxHealth;
        this.regeneration = GAME_CONFIG.hero.regeneration;
        this.lastRegenTime = 0;
        this.regenCooldown = GAME_CONFIG.hero.regenCooldown;
        this.weapons = new Set([
            new BasicGun(this),  // Start with only the basic gun
            new PulseCannon(this)  // Add PulseCannon
        ]);
        this.targetPosition = { x, y };
        this.avoidanceRadius = 100;
        this.kiteRadius = 200;
        
        // Dash mechanic
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

        // AI state
        this.currentBehavior = 'kite';
        this.behaviorTimer = 0;
        this.behaviorDuration = Math.random() * 2 + 1; // 1-3 seconds
        
        this.debug = GAME_CONFIG.debug;
        this.powerState = {
            scale: 1,
            growing: false,
            charged: false,
            exhausted: false
        };
        logDebug('Hero initialized with AI control');

        // Add force system properties
        this.forceX = 0;
        this.forceY = 0;
        this.forceDuration = 0;
    }

    update(deltaTime) {
        if (this.isDashing) {
            this.updateDash(deltaTime);
        }

        // Update AI behavior
        this.behaviorTimer += deltaTime;
        if (this.behaviorTimer >= this.behaviorDuration) {
            this.changeBehavior();
            this.behaviorTimer = 0;
            this.behaviorDuration = Math.random() * 2 + 1; // 1-3 seconds
        }
        this.updateAIMovement(deltaTime);

        // Update weapons with current position
        let hasActiveEnergyBeam = false;
        for (const weapon of this.weapons) {
            if (weapon.owner !== this) {
                weapon.setOwner(this);
            }
            if (weapon instanceof EnergyBeam && weapon.state !== 'idle') {
                hasActiveEnergyBeam = true;
            }
            weapon.update(deltaTime);
        }

        // Only update power state if using EnergyBeam
        if (hasActiveEnergyBeam) {
            // Handle power state for energy beam
            const energyBeam = Array.from(this.weapons).find(w => w instanceof EnergyBeam);
            if (energyBeam) {
                if (energyBeam.state === 'charging') {
                    this.powerState.growing = true;
                    this.powerState.charged = false;
                    this.powerState.exhausted = false;
                    // Gradually increase size during charge
                    const chargeProgress = energyBeam.chargeTime / energyBeam.CHARGE_DURATION;
                    this.radius = this.baseRadius + (this.maxRadius - this.baseRadius) * chargeProgress;
                } else if (energyBeam.state === 'firing') {
                    this.powerState.growing = false;
                    this.powerState.charged = true;
                    this.powerState.exhausted = false;
                    this.radius = this.maxRadius;
                } else {
                    this.powerState.growing = false;
                    this.powerState.charged = false;
                    this.powerState.exhausted = false;
                    this.radius = this.baseRadius;
                }
            }
        } else {
            // Reset power state and size when not using energy beam
            this.powerState.growing = false;
            this.powerState.charged = false;
            this.powerState.exhausted = false;
            this.radius = this.baseRadius;
        }

        // Health regeneration
        const currentTime = performance.now();
        if (currentTime - this.lastRegenTime > this.regenCooldown) {
            this.heal(this.regeneration);
            this.lastRegenTime = currentTime;
            if (this.debug) {
                logDebug(`Hero regenerated ${this.regeneration} health`);
            }
        }

        // Handle collisions with enemies differently based on power state
        this.game.entities.enemies.forEach(enemy => {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = this.radius + enemy.radius;

            if (distance < minDistance) {
                if (this.powerState.charged) {
                    // Blast enemies away when charged
                    const angle = Math.atan2(dy, dx);
                    const force = 1000;
                    enemy.x += Math.cos(angle) * force * deltaTime;
                    enemy.y += Math.sin(angle) * force * deltaTime;
                    enemy.takeDamage(10);
                } else if (this.powerState.growing) {
                    // Push enemies back less forcefully while charging
                    const angle = Math.atan2(dy, dx);
                    const force = 500;
                    enemy.x += Math.cos(angle) * force * deltaTime;
                    enemy.y += Math.sin(angle) * force * deltaTime;
                    enemy.takeDamage(5);
                } else if (!this.isInvincible) {
                    // Normal collision when not invincible
                    this.takeDamage(enemy.damage || 10); // Default damage if enemy.damage is undefined
                }
            }
        });

        // Apply force if active
        if (this.forceDuration > 0) {
            this.x += this.forceX * deltaTime;
            this.y += this.forceY * deltaTime;
            this.forceDuration -= deltaTime;
            
            // Clear force when duration expires
            if (this.forceDuration <= 0) {
                this.forceX = 0;
                this.forceY = 0;
            }
        }

        // Call parent update for basic movement and bounds checking
        super.update(deltaTime);
    }

    updateDash(deltaTime) {
        this.dashTimer += deltaTime;
        
        // Move during dash
        const dashSpeed = GAME_CONFIG.hero.dash.speed;
        this.x += this.dashDirX * dashSpeed * deltaTime;
        this.y += this.dashDirY * dashSpeed * deltaTime;
        
        // Create trail particles
        if (this.game.particleSystem) {
            const particleSpeed = 50;
            this.game.particleSystem.createParticle(
                this.x, this.y,
                -this.dashDirX * particleSpeed + (Math.random() - 0.5) * 20,
                -this.dashDirY * particleSpeed + (Math.random() - 0.5) * 20,
                '#4CAF50',
                0.3,
                3
            );
        }
        
        // Check if dash is complete
        if (this.dashTimer >= this.dashDuration) {
            this.endDash();
        }
        
        // Damage enemies during dash
        this.game.entities.enemies.forEach(enemy => {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = this.radius + enemy.radius;

            if (distance < minDistance) {
                enemy.takeDamage(this.dashDamage);
                // Push enemy back
                const angle = Math.atan2(dy, dx);
                const force = 800;
                enemy.x += Math.cos(angle) * force * deltaTime;
                enemy.y += Math.sin(angle) * force * deltaTime;
                
                // Create hit particles
                if (this.game.particleSystem) {
                    const particleCount = 10;
                    for (let i = 0; i < particleCount; i++) {
                        const particleAngle = angle + (Math.random() - 0.5) * Math.PI;
                        const speed = Math.random() * 300 + 200;
                        this.game.particleSystem.createParticle(
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

    changeBehavior() {
        this.behaviorTimer = 0;
        this.behaviorDuration = Math.random() * 2 + 1;

        // Choose between kiting and aggressive behavior
        this.currentBehavior = Math.random() < 0.7 ? 'kite' : 'aggressive';
        
        if (this.debug) {
            logDebug(`Hero behavior changed to: ${this.currentBehavior}`);
        }
    }

    updateAIMovement(deltaTime) {
        const closestEnemy = this.findClosestEnemy();
        if (!closestEnemy) {
            this.dx = 0;
            this.dy = 0;
            if (this.debug) {
                logDebug('No enemies found for AI movement');
            }
            return;
        }

        const dx = closestEnemy.x - this.x;
        const dy = closestEnemy.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (this.debug) {
            logDebug(`Hero distance to closest enemy: ${distance}`);
        }

        // Normalize movement vector
        let moveX = 0;
        let moveY = 0;

        if (this.currentBehavior === 'kite') {
            if (distance < this.kiteRadius) {
                // Move away from enemy if too close
                if (distance > 0) {
                    moveX = -dx / distance;
                    moveY = -dy / distance;
                }
            } else {
                // Strafe around at medium range
                if (distance > 0) {
                    moveX = -dy / distance;
                    moveY = dx / distance;
                }
            }
        } else { // aggressive behavior
            if (distance > this.avoidanceRadius) {
                // Move toward enemy if far
                if (distance > 0) {
                    moveX = dx / distance;
                    moveY = dy / distance;
                }
            } else {
                // Strafe around at close range
                if (distance > 0) {
                    moveX = -dy / distance;
                    moveY = dx / distance;
                }
            }
        }

        // Set normalized movement direction
        const moveLength = Math.sqrt(moveX * moveX + moveY * moveY);
        if (moveLength > 0) {
            this.dx = moveX / moveLength;
            this.dy = moveY / moveLength;
            
            if (this.debug) {
                logDebug(`Hero movement direction: dx=${this.dx}, dy=${this.dy}`);
            }
        }
    }

    findClosestEnemy() {
        if (!this.game || !this.game.entities || !this.game.entities.enemies) {
            if (this.debug) logDebug('No game or enemies reference in hero');
            return null;
        }

        let closestEnemy = null;
        let closestDistance = Infinity;

        for (const enemy of this.game.entities.enemies) {
            if (enemy.isDead) continue;

            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestEnemy = enemy;
            }
        }

        if (this.debug && closestEnemy) {
            logDebug(`Found closest enemy at distance ${closestDistance}`);
        }

        return closestEnemy;
    }

    draw(ctx) {
        ctx.save();
        
        // Draw hero body
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * this.powerState.scale, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Draw weapons
        for (const weapon of this.weapons) {
            weapon.draw(ctx);
        }

        // Draw health bar
        const healthBarWidth = 30;
        const healthBarHeight = 4;
        const healthPercentage = this.health / this.maxHealth;
        
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - healthBarWidth/2, this.y - this.radius - 10, healthBarWidth, healthBarHeight);
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x - healthBarWidth/2, this.y - this.radius - 10, healthBarWidth * healthPercentage, healthBarHeight);

        // Draw level indicator
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Lv ${this.level}`, this.x, this.y - this.radius - 5);

        // Draw debug info if enabled
        if (this.debug) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.avoidanceRadius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.2)';
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(this.x, this.y, this.kiteRadius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
            ctx.stroke();
        }
        ctx.restore();
    }

    addWeapon(WeaponClass) {
        const existingWeapon = Array.from(this.weapons).find(w => w instanceof WeaponClass);
        if (existingWeapon) {
            existingWeapon.upgrade();
        } else {
            this.weapons.add(new WeaponClass(this));
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

    gainExperience(amount) {
        // No-op since we're using kill-based leveling
    }

    levelUp() {
        this.level++;
        this.needsLevelUp = true;
    }

    takeDamage(amount) {
        if (this.isInvincible) return;
        
        // Ensure amount is a valid number
        const damage = Number(amount) || 10; // Default to 10 if amount is invalid
        this.health = Math.max(0, this.health - damage);
        
        if (this.debug) {
            logDebug(`Hero took ${damage} damage, health: ${this.health}`);
        }
        
        if (this.health <= 0) {
            this.game.gameOver();
        }
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
        this.dashTimer = 0;
        this.lastDashTime = performance.now();
        
        // Store dash direction
        this.dashDirX = dirX;
        this.dashDirY = dirY;
        
        // Add screen shake
        if (GAME_CONFIG.hero.dash.screenShake) {
            const { intensity, duration } = GAME_CONFIG.hero.dash.screenShake;
            this.game.startScreenShake(intensity, duration);
        }
        
        // Create dash effect particles
        if (this.game.particleSystem) {
            const particleCount = 20;
            for (let i = 0; i < particleCount; i++) {
                const angle = (Math.PI * 2 * i) / particleCount;
                const speed = Math.random() * 200 + 100;
                const lifetime = Math.random() * 0.3 + 0.2;
                this.game.particleSystem.createParticle(
                    this.x, this.y,
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
        this.speed = this.maxSpeed;
        this.isInvincible = false;
        if (this.debug) {
            logDebug('Hero ended dash');
        }
    }

    // Add force application method
    applyForce(forceX, forceY, duration) {
        this.forceX = forceX;
        this.forceY = forceY;
        this.forceDuration = duration;
    }
}