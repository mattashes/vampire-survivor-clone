import Entity from '../entity.js';
import { GAME_CONFIG, logDebug } from '../../config.js';
import { HeroAI } from './hero-ai.js';
import { HeroCombat } from './hero-combat.js';
import { HeroDash } from './hero-dash.js';

export class Hero extends Entity {
    constructor(x, y, game) {
        super(x, y, GAME_CONFIG.hero.radius, GAME_CONFIG.hero.color, GAME_CONFIG.hero.maxSpeed, game);
        
        // Core properties
        this.baseRadius = GAME_CONFIG.hero.radius;
        this.radius = this.baseRadius;
        this.maxRadius = this.baseRadius * 2.5;
        this.color = GAME_CONFIG.hero.color;
        this.maxSpeed = GAME_CONFIG.hero.maxSpeed;
        this.speed = this.maxSpeed;
        this.level = 1;
        
        // Kill system
        this.kills = 0;
        this.killsToNextLevel = 100; // First level up at 100 kills
        this.killThresholds = [
            100,  // Level 2
            250,  // Level 3
            400,  // Level 4
            600,  // Level 5
            900,  // Level 6
            1200  // Level 7
        ];
        
        // Health system
        this.maxHealth = GAME_CONFIG.hero.maxHealth;
        this.health = this.maxHealth;
        this.regeneration = GAME_CONFIG.hero.regeneration;
        this.lastRegenTime = 0;
        this.regenCooldown = GAME_CONFIG.hero.regenCooldown;
        
        // World coordinates
        this.worldX = x;
        this.worldY = y;
        
        // Power state
        this.powerState = {
            scale: 1,
            growing: false,
            charged: false,
            exhausted: false
        };
        
        // Force system
        this.forceX = 0;
        this.forceY = 0;
        this.forceDuration = 0;
        
        // Debug
        this.debug = GAME_CONFIG.debug;
        
        // Initialize components
        this.ai = new HeroAI(this);
        this.combat = new HeroCombat(this);
        this.dash = new HeroDash(this);
    }

    update(deltaTime) {
        // Store old world position for collision check
        const oldWorldX = this.worldX;
        const oldWorldY = this.worldY;

        // Update components
        this.ai.update(deltaTime);
        this.combat.update(deltaTime);
        this.dash.update(deltaTime);

        // Update world position based on velocity
        if (!this.dash.isDashing) {
            this.worldX += this.dx * this.speed * deltaTime;
            this.worldY += this.dy * this.speed * deltaTime;
        }

        // Check collision with terrain
        if (this.game.terrainSystem && this.game.terrainSystem.checkCollision(this)) {
            // If collision occurred, revert position
            this.worldX = oldWorldX;
            this.worldY = oldWorldY;
        }

        // Update screen position based on camera
        const camera = this.game.terrainSystem.camera;
        const zoom = this.game.terrainSystem.zoom;
        this.x = (this.worldX - camera.x) * zoom;
        this.y = (this.worldY - camera.y) * zoom;

        // Health regeneration
        const currentTime = performance.now();
        if (currentTime - this.lastRegenTime > this.regenCooldown) {
            this.heal(this.regeneration);
            this.lastRegenTime = currentTime;
            if (this.debug) {
                logDebug(`Hero regenerated ${this.regeneration} health`);
            }
        }

        // Apply force if active
        if (this.forceDuration > 0) {
            this.worldX += this.forceX * deltaTime;
            this.worldY += this.forceY * deltaTime;
            this.forceDuration -= deltaTime;
            
            if (this.forceDuration <= 0) {
                this.forceX = 0;
                this.forceY = 0;
            }
        }

        super.update(deltaTime);
    }

    draw(ctx) {
        ctx.save();
        
        // Draw hero body
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * this.powerState.scale, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Draw weapons
        this.combat.draw(ctx);

        // Draw health bar
        const healthBarWidth = 30;
        const healthBarHeight = 4;
        const healthPercentage = this.health / this.maxHealth;
        
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - healthBarWidth/2, this.y - this.radius - 10, healthBarWidth, healthBarHeight);
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x - healthBarWidth/2, this.y - this.radius - 10, healthBarWidth * healthPercentage, healthBarHeight);

        // Draw kill progress bar
        const killBarY = this.y - this.radius - 15;
        const killPercentage = this.kills / this.killsToNextLevel;
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(this.x - healthBarWidth/2, killBarY, healthBarWidth, healthBarHeight);
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(this.x - healthBarWidth/2, killBarY, healthBarWidth * killPercentage, healthBarHeight);

        // Draw level indicator
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Lv ${this.level}`, this.x, this.y - this.radius - 5);

        // Draw debug info
        if (this.debug) {
            this.ai.drawDebug(ctx);
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
        if (this.dash.isInvincible) return;
        
        const damage = Number(amount) || 10;
        this.health = Math.max(0, this.health - damage);
        
        if (this.debug) {
            logDebug(`Hero took ${damage} damage, health: ${this.health}`);
        }
        
        if (this.health <= 0) {
            this.game.gameOver();
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