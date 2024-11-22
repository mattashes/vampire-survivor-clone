export class Weapon {
    constructor(config = {}) {
        this.owner = null;
        this.damage = config.damage || 10;
        this.fireRate = config.fireRate || 1; // Shots per second
        this.projectileSpeed = config.projectileSpeed || 300;
        this.projectileLifetime = config.projectileLifetime || 2; // seconds
        this.projectileSize = config.projectileSize || 5;
        this.projectileColor = config.projectileColor || '#ffff00';
        this.level = 1;
        this.lastFireTime = 0;
        this.spread = config.spread || 0; // Spread angle in radians
        this.projectilesPerShot = config.projectilesPerShot || 1;
        this.debug = true;
    }

    setOwner(owner) {
        if (!owner || typeof owner.x !== 'number' || typeof owner.y !== 'number') {
            console.warn('Invalid owner provided to weapon', { owner });
            return;
        }
        this.owner = owner;
        if (this.debug) {
            console.log(`Weapon owner set to ${owner.constructor.name} at (${owner.x.toFixed(2)}, ${owner.y.toFixed(2)})`);
        }
    }

    update(deltaTime) {
        if (!this.owner) {
            console.warn('Weapon has no owner during update');
            return;
        }

        const currentTime = performance.now();
        if (currentTime - this.lastFireTime > (1000 / this.fireRate)) {
            this.fire();
            this.lastFireTime = currentTime;
        }
    }

    fire() {
        if (!this.owner || !window.game) {
            console.warn('Cannot fire weapon: missing owner or game instance');
            return;
        }

        if (typeof this.owner.x !== 'number' || typeof this.owner.y !== 'number') {
            console.warn('Invalid owner coordinates during fire', {
                ownerX: this.owner.x,
                ownerY: this.owner.y
            });
            return;
        }

        const enemies = Array.from(window.game.enemies);
        if (enemies.length === 0) return;

        // Find closest enemy for targeting
        const target = this.findClosestEnemy(enemies);
        if (!target) return;

        // Calculate angle to target
        const angle = Math.atan2(
            target.y - this.owner.y,
            target.x - this.owner.x
        );

        this.createProjectile(angle);
    }

    createProjectile(angle) {
        if (!this.owner || typeof this.owner.x !== 'number' || typeof this.owner.y !== 'number') {
            console.warn('Invalid owner coordinates for projectile creation');
            return;
        }

        const projectile = new Projectile({
            x: this.owner.x,
            y: this.owner.y,
            angle: angle,
            speed: this.projectileSpeed,
            lifetime: this.projectileLifetime,
            size: this.projectileSize,
            color: this.projectileColor,
            damage: this.damage,
            weapon: this
        });

        if (window.game) {
            window.game.addProjectile(projectile);
        } else {
            console.warn('Game instance not found for projectile creation');
        }
    }

    findClosestEnemy(enemies) {
        if (!enemies || enemies.length === 0) return null;
        
        return enemies.reduce((closest, current) => {
            const distanceToCurrent = Math.sqrt(
                Math.pow(current.x - this.owner.x, 2) + 
                Math.pow(current.y - this.owner.y, 2)
            );
            
            if (!closest) return current;
            
            const distanceToClosest = Math.sqrt(
                Math.pow(closest.x - this.owner.x, 2) + 
                Math.pow(closest.y - this.owner.y, 2)
            );
            
            return distanceToCurrent < distanceToClosest ? current : closest;
        }, null);
    }

    draw(ctx) {
        // Base weapon class doesn't draw anything
        // Subclasses can override this to add visual effects
    }

    onHeroLevelUp() {
        // Improve weapon stats on hero level up
        this.damage *= 1.1; // 10% more damage
        this.projectileSpeed *= 1.05; // 5% more speed
        if (this.debug) console.log(`Weapon upgraded: damage=${this.damage}, speed=${this.projectileSpeed}`);
    }

    levelUp() {
        this.level++;
        this.damage *= 1.2; // 20% more damage per weapon level
        this.fireRate *= 1.1; // 10% faster firing rate
        this.projectileSize *= 1.1; // 10% larger projectiles
        if (this.debug) console.log(`Weapon leveled up to ${this.level}`);
    }
}

export class Projectile {
    constructor(config) {
        if (typeof config.x !== 'number' || typeof config.y !== 'number') {
            throw new Error('Invalid coordinates for projectile');
        }

        this.x = config.x;
        this.y = config.y;
        this.angle = config.angle;
        this.speed = config.speed;
        this.lifetime = config.lifetime * 1000; // Convert to milliseconds
        this.size = config.size;
        this.color = config.color;
        this.damage = config.damage;
        this.weapon = config.weapon;
        this.timeAlive = 0;
        this.shouldRemove = false;
        this.debug = true;

        // Calculate velocity based on angle and speed
        this.velocity = {
            x: Math.cos(this.angle) * this.speed,
            y: Math.sin(this.angle) * this.speed
        };

        // Particle effects
        this.particles = [];
        this.particleEmissionRate = 0.05; // seconds between particle emissions
        this.lastParticleTime = 0;

        if (this.debug) {
            console.log(`Projectile created at (${this.x.toFixed(2)}, ${this.y.toFixed(2)})`);
        }
    }

    update(deltaTime) {
        // Update position
        this.x += this.velocity.x * deltaTime;
        this.y += this.velocity.y * deltaTime;

        // Update lifetime
        this.timeAlive += deltaTime;
        if (this.timeAlive >= this.lifetime) {
            this.shouldRemove = true;
            return;
        }

        // Check for collisions with enemies
        this.checkCollisions();

        // Update particles
        this.updateParticles(deltaTime);

        // Check if out of bounds
        const canvas = document.getElementById('gameCanvas');
        if (this.x < 0 || this.x > canvas.width || 
            this.y < 0 || this.y > canvas.height) {
            this.shouldRemove = true;
        }
    }

    draw(ctx) {
        // Draw particles first
        this.drawParticles(ctx);

        // Draw projectile
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Add glow effect
        ctx.shadowBlur = this.size * 2;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    checkCollisions() {
        if (!window.game) return;

        for (const enemy of window.game.enemies) {
            const dx = this.x - enemy.x;
            const dy = this.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < enemy.radius + this.size) {
                enemy.takeDamage(this.damage);
                this.shouldRemove = true;
                this.createHitEffect();
                if (this.debug) console.log(`Projectile hit enemy at (${enemy.x}, ${enemy.y})`);
                break;
            }
        }
    }

    createHitEffect() {
        // Create particles for hit effect
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            this.particles.push({
                x: this.x,
                y: this.y,
                velocity: {
                    x: Math.cos(angle) * this.speed * 0.5,
                    y: Math.sin(angle) * this.speed * 0.5
                },
                size: this.size * 0.5,
                lifetime: 0.2,
                timeAlive: 0
            });
        }
    }

    updateParticles(deltaTime) {
        // Create trail particles
        const currentTime = performance.now() / 1000;
        if (currentTime - this.lastParticleTime > this.particleEmissionRate) {
            this.particles.push({
                x: this.x,
                y: this.y,
                velocity: {
                    x: (Math.random() - 0.5) * this.speed * 0.2,
                    y: (Math.random() - 0.5) * this.speed * 0.2
                },
                size: this.size * 0.5,
                lifetime: 0.5,
                timeAlive: 0
            });
            this.lastParticleTime = currentTime;
        }

        // Update existing particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.timeAlive += deltaTime;
            
            if (particle.timeAlive >= particle.lifetime) {
                this.particles.splice(i, 1);
                continue;
            }

            particle.x += particle.velocity.x * deltaTime;
            particle.y += particle.velocity.y * deltaTime;
            particle.size *= 0.95; // Shrink particle over time
        }
    }

    drawParticles(ctx) {
        for (const particle of this.particles) {
            const alpha = 1 - (particle.timeAlive / particle.lifetime);
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.hexToRgb(this.color)},${alpha})`;
            ctx.fill();
        }
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? 
            `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}` 
            : '255,255,255';
    }
}