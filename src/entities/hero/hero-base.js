import { Entity } from '../entity.js';
import { GAME_CONFIG, logDebug } from '../../config.js';
import { HeroCombat } from './hero-combat.js';
import { HeroDash } from './hero-dash.js';

export class Hero extends Entity {
    constructor(x, y, game) {
        super(x, y, GAME_CONFIG.hero.radius, GAME_CONFIG.hero.color, GAME_CONFIG.hero.maxSpeed, game);
        
        // Ensure game reference is set
        if (!game) {
            throw new Error('Game reference is required for Hero initialization');
        }
        this.game = game;

        // Store initial position
        this.initialX = x;
        this.initialY = y;

        // Use the shared input manager
        this.input = game.inputManager;

        // Initialize components with proper game reference
        this.combat = new HeroCombat(this);
        this.dash = new HeroDash(this);
        
        if (this.game.debug) {
            logDebug('Hero initialized with game reference');
        }
    }

    initializeReferences() {
        // Initialize references after entity system is ready
        if (this.game?.gameEntities?.entities) {
            this.enemies = this.game.gameEntities.entities.enemies;
        } else if (this.game.debug) {
            logDebug('No game or enemies reference in hero');
        }
    }

    initializeProperties() {
        // Core properties
        this.baseRadius = GAME_CONFIG.hero.radius;
        this.radius = this.baseRadius;
        this.maxRadius = this.baseRadius * 2.5;
        this.color = GAME_CONFIG.hero.color;
        this.maxSpeed = GAME_CONFIG.hero.maxSpeed;
        this.speed = this.maxSpeed;
        this.level = 1;
        
        // Power state
        this.powerState = {
            scale: 1,
            duration: 0,
            active: false
        };
        
        // Health system
        this.maxHealth = GAME_CONFIG.hero.maxHealth;
        this.health = this.maxHealth;
        this.regeneration = GAME_CONFIG.hero.regeneration;
        this.lastRegenTime = 0;
        this.regenCooldown = GAME_CONFIG.hero.regenCooldown;
        
        // World coordinates
        this.worldX = this.initialX;
        this.worldY = this.initialY;
        
        // Debug
        this.debug = GAME_CONFIG.debug;
    }

    update(deltaTime) {
        if (!this.game) {
            if (this.debug) logDebug('No game reference in hero');
            return;
        }

        // Get mouse position
        const mousePos = this.input.getMousePosition();
        
        // Convert mouse position to canvas coordinates
        const rect = this.game.canvas.getBoundingClientRect();
        const canvasX = mousePos.x - rect.left;
        const canvasY = mousePos.y - rect.top;

        // Calculate direction to mouse
        const dx = canvasX - this.x;
        const dy = canvasY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Move towards mouse if not too close
        if (distance > 5) {
            const moveX = (dx / distance) * this.speed * deltaTime;
            const moveY = (dy / distance) * this.speed * deltaTime;
            
            this.x += moveX;
            this.y += moveY;
        }

        // Update components
        this.combat.update(deltaTime);
        this.dash.update(deltaTime);

        // Keep hero within bounds
        this.x = Math.max(0, Math.min(this.x, this.game.canvas.width));
        this.y = Math.max(0, Math.min(this.y, this.game.canvas.height));
    }

    draw(ctx) {
        ctx.save();
        
        // Draw hero body
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * (this.powerState?.scale || 1), 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.stroke();
        ctx.closePath();

        // Draw health bar
        const healthBarWidth = this.radius * 2;
        const healthBarHeight = 4;
        const healthBarX = this.x - healthBarWidth / 2;
        const healthBarY = this.y - this.radius - 10;

        // Background
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

        // Health
        ctx.fillStyle = '#00ff00';
        const currentHealthWidth = (this.health / this.maxHealth) * healthBarWidth;
        ctx.fillRect(healthBarX, healthBarY, currentHealthWidth, healthBarHeight);

        // Draw level
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Lv ${this.level}`, this.x, this.y - this.radius - 5);

        // Draw debug info
        if (this.debug) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px Arial';
            ctx.fillText(`HP: ${Math.round(this.health)}/${this.maxHealth}`, this.x, this.y + this.radius + 15);
            ctx.fillText(`Speed: ${Math.round(this.speed)}`, this.x, this.y + this.radius + 25);
        }

        ctx.restore();
    }

    gainExperience(amount) {
        // Each enemy death counts as 1 kill
        this.kills += amount;
        if (this.debug) {
            logDebug(`Hero gained ${amount} kill, total: ${this.kills}/${this.killsToNextLevel}`);
        }
        
        // Check for level up
        if (this.kills >= this.killsToNextLevel) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.needsLevelUp = true;
        
        // Set next level threshold
        const nextThresholdIndex = this.level - 2; // -2 because array is 0-based and we start at level 1
        if (nextThresholdIndex < this.killThresholds.length) {
            this.killsToNextLevel = this.killThresholds[nextThresholdIndex];
        } else {
            // For levels beyond our defined thresholds, add 300 kills per level
            this.killsToNextLevel = this.killThresholds[this.killThresholds.length - 1] + 
                                  ((nextThresholdIndex - this.killThresholds.length + 1) * 300);
        }
        
        // Consistent stat increases per level
        this.maxHealth += 10;
        this.health = this.maxHealth; // Heal to full on level up
        
        // Small regeneration increase every 3 levels
        if (this.level % 3 === 0) {
            this.regeneration += 0.2;
        }
        
        if (this.debug) {
            logDebug(`Hero reached level ${this.level}!`);
            logDebug(`Next level requires ${this.killsToNextLevel} kills`);
        }
    }

    takeDamage(amount) {
        if (this.isDead || this.dash.isInvincible) return;

        this.health = Math.max(0, this.health - amount);
        
        // Create damage particles
        if (this.game.particleSystem) {
            const particleCount = Math.ceil(amount / 2);
            for (let i = 0; i < particleCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 200 + 100;
                this.game.particleSystem.createParticle(
                    this.x, this.y,
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed,
                    '#ff0000',
                    0.5,
                    5
                );
            }
        }

        if (this.health <= 0 && !this.isDead) {
            this.isDead = true;
            // Call game core's gameOver method instead
            if (this.game && this.game.core) {
                this.game.core.gameOver();
            }
            if (this.debug) {
                logDebug('Hero died');
            }
        }
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    applyForce(forceX, forceY, duration) {
        this.forceX = forceX;
        this.forceY = forceY;
        this.forceDuration = duration;
    }
}