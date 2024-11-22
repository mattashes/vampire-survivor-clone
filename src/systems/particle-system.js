class Particle {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
        this.velocity = config.velocity;
        this.color = config.color;
        this.size = config.size || 3;
        this.lifetime = config.lifetime || 0.5;
        this.timeAlive = 0;
        this.alpha = 1;
        this.friction = 0.98;
    }

    update(deltaTime) {
        this.timeAlive += deltaTime;
        this.alpha = 1 - (this.timeAlive / this.lifetime);
        
        // Update position with velocity
        this.x += this.velocity.x * deltaTime;
        this.y += this.velocity.y * deltaTime;
        
        // Apply friction
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        
        // Shrink size over time
        this.size *= 0.95;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.getRGBAColor();
        
        // Add glow effect
        ctx.shadowBlur = this.size * 2;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.closePath();
    }

    getRGBAColor() {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(this.color);
        if (result) {
            const r = parseInt(result[1], 16);
            const g = parseInt(result[2], 16);
            const b = parseInt(result[3], 16);
            return `rgba(${r}, ${g}, ${b}, ${this.alpha})`;
        }
        return `rgba(255, 255, 255, ${this.alpha})`;
    }

    isDead() {
        return this.timeAlive >= this.lifetime || this.size < 0.1;
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    createParticle(x, y, velocityX, velocityY, color, lifetime, size) {
        this.particles.push({
            x,
            y,
            velocity: {
                x: velocityX,
                y: velocityY
            },
            color,
            size: size || 3,
            lifetime,
            maxLifetime: lifetime
        });
    }

    update(deltaTime) {
        // Update all particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Update position
            particle.x += particle.velocity.x * deltaTime;
            particle.y += particle.velocity.y * deltaTime;
            
            // Update lifetime
            particle.lifetime -= deltaTime;
            
            // Remove dead particles
            if (particle.lifetime <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        ctx.save();
        
        // Draw all particles
        for (const particle of this.particles) {
            const alpha = particle.lifetime / particle.maxLifetime;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

export { ParticleSystem, Particle };