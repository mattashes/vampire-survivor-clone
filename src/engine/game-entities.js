import { Hero } from '../entities/hero.js';
import { logDebug } from '../config.js';

export class GameEntities {
    constructor(game) {
        this.game = game;
        this.initEntities();
    }

    initEntities() {
        this.entities = {
            hero: null,
            enemies: new Set(),
            projectiles: new Set(),
            all: new Set()
        };

        // Initialize hero at center of screen
        const heroX = this.game.canvas.width / 2;
        const heroY = this.game.canvas.height / 2;
        this.entities.hero = new Hero(heroX, heroY, this.game);
        this.entities.all.add(this.entities.hero);
    }

    addEnemy(enemy) {
        this.entities.enemies.add(enemy);
        this.entities.all.add(enemy);
        if (this.game.debug) {
            logDebug(`Added enemy, total enemies: ${this.entities.enemies.size}`);
        }
    }

    removeEnemy(enemy) {
        if (this.entities.enemies.has(enemy)) {
            this.entities.enemies.delete(enemy);
            this.entities.all.delete(enemy);
            this.game.kills++;
            this.game.killCount++;
            this.game.updateHeroLevel();
            
            if (this.game.debug) {
                logDebug(`Enemy removed. Total kills: ${this.game.kills}`);
            }
        }
    }

    addProjectile(projectile) {
        if (!projectile || typeof projectile.x !== 'number' || typeof projectile.y !== 'number') {
            console.warn('Attempted to add invalid projectile');
            return;
        }
        this.entities.projectiles.add(projectile);
        this.entities.all.add(projectile);
        if (this.game.debug) {
            logDebug(`Added projectile, total projectiles: ${this.entities.projectiles.size}`);
        }
    }

    removeProjectile(projectile) {
        this.entities.projectiles.delete(projectile);
        this.entities.all.delete(projectile);
    }

    cleanupEntities() {
        for (const entity of this.entities.all) {
            if (entity.isDead) {
                this.entities.all.delete(entity);
                if (entity.constructor.name.includes('Enemy')) {
                    this.entities.enemies.delete(entity);
                } else if (entity.constructor.name.includes('Projectile')) {
                    this.entities.projectiles.delete(entity);
                }
            }
        }
    }

    update(deltaTime) {
        if (this.entities.hero) {
            this.entities.hero.update(deltaTime);
        }

        for (const enemy of this.entities.enemies) {
            if (!enemy.isDead) {
                enemy.update(deltaTime);
            }
        }

        for (const projectile of this.entities.projectiles) {
            if (!projectile.isDead) {
                projectile.update(deltaTime);
            }
        }

        this.cleanupEntities();
    }

    draw(ctx) {
        if (this.entities.hero) {
            this.entities.hero.draw(ctx);
        }

        for (const enemy of this.entities.enemies) {
            if (!enemy.isDead) {
                enemy.draw(ctx);
            }
        }

        for (const projectile of this.entities.projectiles) {
            if (!projectile.isDead) {
                projectile.draw(ctx);
            }
        }
    }

    get enemies() {
        return this.entities.enemies;
    }

    get hero() {
        return this.entities.hero;
    }

    get all() {
        return this.entities.all;
    }
}