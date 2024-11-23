import { Projectile } from './projectile.js';

export class BeamSegment extends Projectile {
    constructor(config) {
        super(config);
        this.distance = config.distance || 100;
        this.width = config.width || 2;
    }

    draw(ctx) {
        const endX = this.x + Math.cos(this.angle) * this.distance;
        const endY = this.y + Math.sin(this.angle) * this.distance;

        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.width;
        ctx.lineCap = 'round';

        // Add glow effect
        ctx.shadowBlur = this.width * 2;
        ctx.shadowColor = this.color;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw particles along the beam
        this.drawBeamParticles(ctx, endX, endY);
    }

    drawBeamParticles(ctx, endX, endY) {
        const particleCount = 5;
        for (let i = 0; i < particleCount; i++) {
            const t = i / (particleCount - 1);
            const particleX = this.x + (endX - this.x) * t;
            const particleY = this.y + (endY - this.y) * t;
            
            ctx.beginPath();
            ctx.arc(particleX, particleY, this.width * 0.8, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }
}