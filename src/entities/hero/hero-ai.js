import { logDebug } from '../../config.js';

export class HeroAI {
    constructor(hero) {
        this.hero = hero;
        this.currentBehavior = 'kite';
        this.behaviorTimer = 0;
        this.behaviorDuration = Math.random() * 2 + 1;
        this.avoidanceRadius = 100;
        this.kiteRadius = 200;
        this.debug = hero.debug;
    }

    update(deltaTime) {
        // Update AI behavior
        this.behaviorTimer += deltaTime;
        if (this.behaviorTimer >= this.behaviorDuration) {
            this.changeBehavior();
            this.behaviorTimer = 0;
            this.behaviorDuration = Math.random() * 2 + 1;
        }
        this.updateMovement(deltaTime);
    }

    changeBehavior() {
        this.behaviorTimer = 0;
        this.behaviorDuration = Math.random() * 2 + 1;
        this.currentBehavior = Math.random() < 0.7 ? 'kite' : 'aggressive';
        
        if (this.debug) {
            logDebug(`Hero behavior changed to: ${this.currentBehavior}`);
        }
    }

    updateMovement(deltaTime) {
        const closestEnemy = this.findClosestEnemy();
        if (!closestEnemy) {
            this.hero.dx = 0;
            this.hero.dy = 0;
            if (this.debug) {
                logDebug('No enemies found for AI movement');
            }
            return;
        }

        const dx = closestEnemy.worldX - this.hero.worldX;
        const dy = closestEnemy.worldY - this.hero.worldY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (this.debug) {
            logDebug(`Hero distance to closest enemy: ${distance}`);
        }

        let moveX = 0;
        let moveY = 0;

        if (this.currentBehavior === 'kite') {
            if (distance < this.kiteRadius) {
                if (distance > 0) {
                    moveX = -dx / distance;
                    moveY = -dy / distance;
                }
            } else {
                if (distance > 0) {
                    moveX = -dy / distance;
                    moveY = dx / distance;
                }
            }
        } else {
            if (distance > this.avoidanceRadius) {
                if (distance > 0) {
                    moveX = dx / distance;
                    moveY = dy / distance;
                }
            } else {
                if (distance > 0) {
                    moveX = -dy / distance;
                    moveY = dx / distance;
                }
            }
        }

        const moveLength = Math.sqrt(moveX * moveX + moveY * moveY);
        if (moveLength > 0) {
            this.hero.dx = moveX / moveLength;
            this.hero.dy = moveY / moveLength;
            
            if (this.debug) {
                logDebug(`Hero movement direction: dx=${this.hero.dx}, dy=${this.hero.dy}`);
            }
        }
    }

    findClosestEnemy() {
        if (!this.hero.game || !this.hero.game.entities || !this.hero.game.entities.enemies) {
            if (this.debug) logDebug('No game or enemies reference in hero');
            return null;
        }

        let closestEnemy = null;
        let closestDistance = Infinity;

        for (const enemy of this.hero.game.entities.enemies) {
            if (enemy.isDead) continue;

            const dx = enemy.worldX - this.hero.worldX;
            const dy = enemy.worldY - this.hero.worldY;
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

    drawDebug(ctx) {
        // Draw avoidance radius
        ctx.beginPath();
        ctx.arc(this.hero.x, this.hero.y, this.avoidanceRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.2)';
        ctx.stroke();

        // Draw kite radius
        ctx.beginPath();
        ctx.arc(this.hero.x, this.hero.y, this.kiteRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
        ctx.stroke();

        // Draw behavior state
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.currentBehavior, this.hero.x, this.hero.y + this.hero.radius + 15);
    }
}