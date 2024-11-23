import { BaseWeapon } from './base-weapon.js';

export class PulseCannon extends BaseWeapon {
    constructor(owner) {
        super(owner);
        this.name = 'PulseCannon';
        this.cooldown = 0.8;
        this.lastFireTime = 0;
        this.baseDamage = 120;
        this.chainDelay = 0.08;  // Faster jumps
        this.chainRange = 250;
        this.maxTargets = 35;

        // Lightning effect properties
        this.lightningColors = {
            core: '#ffffff',     // Pure white core
            inner: '#40ffff',    // Bright cyan inner
            outer: '#0080ff',    // Electric blue outer
            impact: '#80ffff'    // Impact flash color
        };
        
        // Lightning generation settings - optimized values
        this.branchProbability = 0.3;     // Reduced branch probability
        this.branchAngleRange = 0.8;
        this.segmentLength = 20;          // Increased segment length
        this.displacement = 0.4;
        this.detail = 6;
        this.maxBranchesPerBolt = 2;      // Limit branches
        this.maxParticlesPerImpact = 8;   // Reduced particles
        this.maxActiveChains = 3;         // Limit active chains
        
        this.activeChains = new Set();
    }

    update(deltaTime) {
        const now = performance.now() / 1000;
        if (now - this.lastFireTime >= this.cooldown) {
            if (this.owner && this.owner.game && this.owner.game.entities && this.owner.game.entities.enemies) {
                const enemies = Array.from(this.owner.game.entities.enemies);
                const target = this.findClosestEnemy(enemies);
                if (target) {
                    this.fire(target);
                    this.lastFireTime = now;
                }
            }
        }

        // Update active chains
        for (const chain of this.activeChains) {
            chain.age += deltaTime;
            
            // Update impact particles
            for (const impact of chain.impacts) {
                impact.age += deltaTime;
                for (const particle of impact.particles) {
                    particle.age += deltaTime;
                    particle.x += particle.vx * deltaTime;
                    particle.y += particle.vy * deltaTime;
                }
            }

            // Remove expired chains
            if (chain.age >= chain.duration) {
                this.activeChains.delete(chain);
            }
        }
    }

    generateImpactParticles(x, y) {
        const particles = [];
        const particleCount = this.maxParticlesPerImpact;

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = Math.random() * 50 + 25;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;

            particles.push({
                x: 0,
                y: 0,
                vx,
                vy,
                age: 0
            });
        }

        return particles;
    }

    async chainLightning(startX, startY, targets) {
        if (!targets || targets.length === 0) return;

        // Limit active chains
        if (this.activeChains.size >= this.maxActiveChains) {
            const oldestChain = Array.from(this.activeChains)[0];
            this.activeChains.delete(oldestChain);
        }

        let currentX = startX;
        let currentY = startY;
        let chain = {
            segments: [],
            branches: [],
            impacts: [],
            age: 0,
            duration: 0.4,
            alpha: 1
        };
        this.activeChains.add(chain);

        // Chain through each target sequentially
        for (let i = 0; i < Math.min(targets.length, this.maxTargets); i++) {
            const target = targets[i];
            if (!target || target.isDead) continue;

            const mainBolt = this.generateLightningPoints(
                currentX, currentY,
                target.x, target.y,
                this.detail,
                true
            );

            chain.impacts.push({
                x: target.x,
                y: target.y,
                age: 0,
                particles: this.generateImpactParticles(target.x, target.y)
            });

            chain.segments.push({
                points: mainBolt,
                age: 0,
                target: target
            });

            if (mainBolt.branches) {
                chain.branches.push(...mainBolt.branches);
            }

            if (!target.isDead) {
                const damageMultiplier = Math.max(0.3, 1 - (i * 0.15));
                const damage = this.baseDamage * damageMultiplier;
                target.takeDamage(damage);

                if (this.owner.game.camera) {
                    const shakeIntensity = 4 * damageMultiplier;
                    this.owner.game.camera.shake(shakeIntensity, 0.15);
                }
            }

            currentX = target.x;
            currentY = target.y;

            await new Promise(resolve => setTimeout(resolve, this.chainDelay * 1000));
        }
    }

    draw(ctx) {
        if (!ctx || !this.owner) return;

        // Render all active lightning chains
        for (const chain of this.activeChains) {
            const alpha = Math.max(0, 1 - (chain.age / chain.duration));
            
            // Batch render all lightning segments for each layer
            const operations = {
                core: [],    // Core white lightning
                inner: [],   // Inner cyan glow
                outer: []    // Outer blue glow
            };

            // Collect all rendering operations
            for (const segment of chain.segments) {
                const points = segment.points;
                if (!points || points.length < 2) continue;

                operations.outer.push(points);
                operations.inner.push(points);
                operations.core.push(points);

                // Add branches if they exist
                if (points.branches) {
                    for (const branch of points.branches) {
                        operations.outer.push(branch);
                        operations.inner.push(branch);
                        operations.core.push(branch);
                    }
                }
            }

            // Render each layer with different settings
            ctx.globalAlpha = alpha;
            this.batchRenderLightning(ctx, operations.outer, this.lightningColors.outer, 8, 16);
            this.batchRenderLightning(ctx, operations.inner, this.lightningColors.inner, 4, 8);
            this.batchRenderLightning(ctx, operations.core, this.lightningColors.core, 2, 4);

            // Render impact effects
            this.batchRenderImpacts(ctx, chain.impacts);
            ctx.globalAlpha = 1;
        }
    }

    batchRenderLightning(ctx, operations, color, width, blur) {
        if (operations.length === 0) return;

        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = color;
        ctx.shadowBlur = blur;
        ctx.globalCompositeOperation = 'screen';

        ctx.beginPath();
        for (const points of operations) {
            if (!points || points.length < 2) continue;

            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
        }
        ctx.stroke();
        ctx.restore();
    }

    batchRenderImpacts(ctx, impacts) {
        if (!impacts || impacts.length === 0) return;

        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        for (const impact of impacts) {
            if (!impact || impact.age >= 0.3) continue;

            const alpha = Math.max(0, 1 - (impact.age / 0.3));
            const radius = 10 * (1 + impact.age * 2);

            // Draw impact flash
            ctx.beginPath();
            ctx.arc(impact.x, impact.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(128, 255, 255, ${alpha * 0.5})`;
            ctx.fill();

            // Draw particles
            for (const particle of impact.particles) {
                if (!particle || particle.age >= 0.3) continue;
                const particleAlpha = Math.max(0, 1 - (particle.age / 0.3));
                ctx.beginPath();
                ctx.arc(
                    impact.x + particle.x,
                    impact.y + particle.y,
                    2,
                    0,
                    Math.PI * 2
                );
                ctx.fillStyle = `rgba(128, 255, 255, ${particleAlpha})`;
                ctx.fill();
            }
        }
        ctx.restore();
    }

    generateDetailPoints(startX, startY, endX, endY, detail) {
        const points = [];
        const dx = endX - startX;
        const dy = endY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Base case - if distance is too small or detail is 0
        if (distance < 10 || detail === 0) {
            points.push({ x: startX, y: startY });
            points.push({ x: endX, y: endY });
            return points;
        }
        
        // Add start point
        points.push({ x: startX, y: startY });
        
        // Calculate midpoint with displacement
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        
        // Add perpendicular displacement
        const perpX = -dy / distance;
        const perpY = dx / distance;
        
        // Random displacement scaled by distance and detail level
        const displacement = (Math.random() - 0.5) * distance * this.displacement * (detail / 5);
        const displacedMidX = midX + perpX * displacement;
        const displacedMidY = midY + perpY * displacement;
        
        // Recursively generate points for each half
        const leftPoints = this.generateDetailPoints(startX, startY, displacedMidX, displacedMidY, detail - 1);
        const rightPoints = this.generateDetailPoints(displacedMidX, displacedMidY, endX, endY, detail - 1);
        
        // Combine points, removing duplicates at the midpoint
        points.push(...leftPoints.slice(1, -1));
        points.push({ x: displacedMidX, y: displacedMidY });
        points.push(...rightPoints.slice(1));
        
        return points;
    }

    simplifyPoints(points, targetCount) {
        if (!points || points.length <= targetCount) return points;
        
        const step = points.length / targetCount;
        const simplified = [];
        
        for (let i = 0; i < targetCount; i++) {
            const index = Math.min(Math.floor(i * step), points.length - 1);
            simplified.push(points[index]);
        }
        
        // Always include the last point
        if (simplified[simplified.length - 1] !== points[points.length - 1]) {
            simplified.push(points[points.length - 1]);
        }
        
        return simplified;
    }

    generateLightningPoints(startX, startY, endX, endY, detail, canBranch = true) {
        // Generate main lightning bolt points
        const points = this.generateDetailPoints(startX, startY, endX, endY, detail);
        
        // Add branches if allowed
        if (canBranch && detail > 1) {
            points.branches = [];
            
            // Consider creating branches from each segment
            for (let i = 0; i < points.length - 1; i++) {
                if (Math.random() < this.branchProbability && points.branches.length < this.maxBranchesPerBolt) {
                    const start = points[i];
                    const next = points[i + 1];
                    
                    // Calculate branch endpoint
                    const dx = next.x - start.x;
                    const dy = next.y - start.y;
                    const distance = Math.sqrt(dx * dx + dy * dy) * 0.6; // Branch length is 60% of segment
                    
                    // Random angle deviation
                    const baseAngle = Math.atan2(dy, dx);
                    const branchAngle = baseAngle + (Math.random() - 0.5) * this.branchAngleRange;
                    
                    const branchEndX = start.x + Math.cos(branchAngle) * distance;
                    const branchEndY = start.y + Math.sin(branchAngle) * distance;
                    
                    // Generate branch with reduced detail and no further branching
                    const branchPoints = this.generateDetailPoints(
                        start.x, start.y,
                        branchEndX, branchEndY,
                        detail - 1
                    );
                    
                    points.branches.push(branchPoints);
                }
            }
        }
        
        return points;
    }

    async fire(target) {
        if (!this.owner || !this.owner.game) return;
        
        const currentTime = performance.now() / 1000;
        if (currentTime - this.lastFireTime < this.cooldown) return;
        this.lastFireTime = currentTime;

        // Convert Set to Array before filtering
        const enemies = Array.from(this.owner.game.entities.enemies);
        
        // Find nearby enemies within range
        const nearbyEnemies = enemies
            .filter(enemy => !enemy.isDead)
            .filter(enemy => {
                const dx = enemy.x - this.owner.x;
                const dy = enemy.y - this.owner.y;
                return Math.hypot(dx, dy) <= this.chainRange;
            })
            .sort((a, b) => {
                const distA = Math.hypot(a.x - this.owner.x, a.y - this.owner.y);
                const distB = Math.hypot(b.x - this.owner.x, b.y - this.owner.y);
                return distA - distB;
            });

        if (nearbyEnemies.length > 0) {
            await this.chainLightning(this.owner.x, this.owner.y, nearbyEnemies);
        }
    }
}