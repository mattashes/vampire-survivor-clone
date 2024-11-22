import { GAME_CONFIG, logDebug } from '../config.js';
import Entity from './entity.js';

class Enemy extends Entity {
    constructor(x, y, game) {
        super(x, y, 10, '#ffffff', 100, game);
        this.targetEntity = null;
        this.state = 'chase'; // chase, flank
        this.stateTimer = 0;
        this.stateDuration = 3; // seconds
        this.debug = GAME_CONFIG.debug;
    }

    update(deltaTime) {
        if (!this.targetEntity) return;
        
        // Update state
        this.stateTimer += deltaTime;
        if (this.stateTimer >= this.stateDuration) {
            this.switchState();
            this.stateTimer = 0;
        }

        // Move based on current state
        if (this.state === 'chase') {
            this.chaseTarget(deltaTime);
        } else if (this.state === 'flank') {
            this.flankTarget(deltaTime);
        }

        // Call parent update for movement and bounds checking
        super.update(deltaTime);
    }

    switchState() {
        // 30% chance to switch to flanking
        if (this.state === 'chase' && Math.random() < 0.3) {
            this.state = 'flank';
        } else {
            this.state = 'chase';
        }
        if (this.debug) {
            logDebug(`Enemy switched to ${this.state} state`);
        }
    }

    chaseTarget(deltaTime) {
        if (!this.targetEntity) return;
        
        const dx = this.targetEntity.x - this.x;
        const dy = this.targetEntity.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.dx = (dx / distance);
            this.dy = (dy / distance);
        }
    }

    flankTarget(deltaTime) {
        if (!this.targetEntity) return;
        
        const dx = this.targetEntity.x - this.x;
        const dy = this.targetEntity.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Move perpendicular to the target
            this.dx = (dy / distance);
            this.dy = (-dx / distance);
        }
    }

    onDeath() {
        if (this.game && this.game.entities.hero) {
            this.game.entities.hero.gainExperience(this.experienceValue);
            if (this.debug) logDebug(`Granted ${this.experienceValue} experience to hero`);
        }
    }
}

class FastEnemy extends Enemy {
    constructor(x, y, game) {
        super(x, y, game);
        this.radius = 15;
        this.color = '#ff3333';
        this.speed = 150;
        this.health = 50;
        this.maxHealth = 50;
        this.experienceValue = 10;
    }

    adapt(weaponType) {
        super.adapt(weaponType);
        // Fast enemies become even faster when adapting
        this.speed *= 1.2;
    }
}

class TankEnemy extends Enemy {
    constructor(x, y, game) {
        super(x, y, game);
        this.radius = 25;
        this.color = '#ff6600';
        this.speed = 75;
        this.health = 200;
        this.maxHealth = 200;
        this.experienceValue = 25;
    }

    adapt(weaponType) {
        super.adapt(weaponType);
        // Tank enemies gain more health when adapting
        this.maxHealth *= 1.3;
        this.health = this.maxHealth;
    }
}

class SwarmEnemy extends Enemy {
    constructor(x, y, game) {
        super(x, y, game);
        this.radius = 12;
        this.color = '#ff3399';
        this.speed = 100;
        this.health = 30;
        this.maxHealth = 30;
        this.experienceValue = 5;
    }

    update(deltaTime) {
        if (!this.game || !this.game.entities || !this.game.entities.enemies) return;

        // First update normal enemy behavior
        super.update(deltaTime);

        // Then add swarm behavior
        const nearbySwarms = Array.from(this.game.entities.enemies)
            .filter(e => e instanceof SwarmEnemy && e !== this && !e.isDead)
            .filter(e => {
                const dx = e.x - this.x;
                const dy = e.y - this.y;
                return Math.sqrt(dx * dx + dy * dy) < 100;
            });

        if (nearbySwarms.length > 0) {
            // Calculate average position of nearby swarms
            const avgX = nearbySwarms.reduce((sum, e) => sum + e.x, 0) / nearbySwarms.length;
            const avgY = nearbySwarms.reduce((sum, e) => sum + e.y, 0) / nearbySwarms.length;
            
            // Move towards average position
            const dx = avgX - this.x;
            const dy = avgY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                this.dx = (this.dx + (dx / dist) * 0.3) / 1.3;
                this.dy = (this.dy + (dy / dist) * 0.3) / 1.3;
            }
        }
    }
}

export { Enemy, FastEnemy, TankEnemy, SwarmEnemy };