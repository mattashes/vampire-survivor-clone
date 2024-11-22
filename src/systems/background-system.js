export class BackgroundSystem {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.width = game.canvas.width;
        this.height = game.canvas.height;
        
        // Grid settings
        this.gridSize = 50;
        this.gridOpacity = 0.15;
        
        // Animation settings
        this.time = 0;
        this.waveSpeed = 0.5;
        
        // Gradient colors
        this.colors = {
            background: ['#0a0a2c', '#1a1a3c'],
            grid: '#4a4a6b',
            highlights: '#6a6a8b'
        };
        
        // Initialize patterns
        this.patterns = new Map();
        this.createPatterns();
    }

    createPatterns() {
        // Create dot pattern
        const dotSize = 2;
        const dotCanvas = document.createElement('canvas');
        dotCanvas.width = this.gridSize;
        dotCanvas.height = this.gridSize;
        const dotCtx = dotCanvas.getContext('2d');
        
        dotCtx.fillStyle = this.colors.grid;
        dotCtx.beginPath();
        dotCtx.arc(dotSize, dotSize, dotSize, 0, Math.PI * 2);
        dotCtx.fill();
        
        this.patterns.set('dots', this.ctx.createPattern(dotCanvas, 'repeat'));
    }

    update(deltaTime) {
        // Update animation time
        this.time += deltaTime * this.waveSpeed;
    }

    draw() {
        this.drawBackground();
        this.drawGrid();
        this.drawTerrainEffects();
    }

    drawBackground() {
        // Create gradient background
        const gradient = this.ctx.createRadialGradient(
            this.width / 2, this.height / 2, 0,
            this.width / 2, this.height / 2, this.width * 0.8
        );
        gradient.addColorStop(0, this.colors.background[0]);
        gradient.addColorStop(1, this.colors.background[1]);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawGrid() {
        // Save context state
        this.ctx.save();
        
        // Set grid style
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = this.gridOpacity;
        
        // Draw vertical lines
        for (let x = 0; x < this.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = 0; y < this.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
        
        // Draw grid intersection points
        this.ctx.fillStyle = this.patterns.get('dots');
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Restore context state
        this.ctx.restore();
    }

    drawTerrainEffects() {
        // Save context state
        this.ctx.save();
        
        // Set terrain effect style
        this.ctx.globalAlpha = 0.1;
        this.ctx.strokeStyle = this.colors.highlights;
        this.ctx.lineWidth = 2;

        // Draw simple diagonal lines
        const spacing = this.height / 6;
        
        for (let i = 0; i < 5; i++) {
            const yPos = spacing * (i + 1);
            const offset = Math.sin(this.time) * 20;
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, yPos + offset);
            this.ctx.lineTo(this.width, yPos - offset);
            this.ctx.stroke();
        }

        // Draw some circles for additional effect
        for (let i = 0; i < 3; i++) {
            const x = this.width * (0.25 + i * 0.25);
            const y = this.height * 0.5;
            const radius = 50 + Math.sin(this.time + i) * 20;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // Restore context state
        this.ctx.restore();
    }

    handleResize() {
        this.width = this.game.canvas.width;
        this.height = this.game.canvas.height;
        this.createPatterns();
    }
}