export class BackgroundSystem {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.width = game.canvas.width;
        this.height = game.canvas.height;
        
        // Grid settings
        this.gridSize = 100; // Increased for better visibility when zoomed out
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
        const dotSize = 3; // Increased for better visibility
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
        
        // Update dimensions based on current zoom level
        const zoom = this.game.terrainSystem.zoom;
        this.width = this.game.canvas.width / zoom;
        this.height = this.game.canvas.height / zoom;
    }

    draw() {
        const camera = this.game.terrainSystem.camera;
        const zoom = this.game.terrainSystem.zoom;
        
        // Calculate visible area in world coordinates
        const visibleLeft = camera.x;
        const visibleTop = camera.y;
        const visibleRight = visibleLeft + (this.game.canvas.width / zoom);
        const visibleBottom = visibleTop + (this.game.canvas.height / zoom);
        
        // Align grid to camera position
        const startX = Math.floor(visibleLeft / this.gridSize) * this.gridSize;
        const startY = Math.floor(visibleTop / this.gridSize) * this.gridSize;
        const endX = Math.ceil(visibleRight / this.gridSize) * this.gridSize;
        const endY = Math.ceil(visibleBottom / this.gridSize) * this.gridSize;

        this.drawBackground(visibleLeft, visibleTop, visibleRight - visibleLeft, visibleBottom - visibleTop);
        this.drawGrid(startX, startY, endX, endY);
        this.drawTerrainEffects(startX, startY, endX, endY);
    }

    drawBackground(x, y, width, height) {
        // Create gradient background
        const gradient = this.ctx.createRadialGradient(
            x + width / 2, y + height / 2, 0,
            x + width / 2, y + height / 2, width * 0.8
        );
        gradient.addColorStop(0, this.colors.background[0]);
        gradient.addColorStop(1, this.colors.background[1]);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, width, height);
    }

    drawGrid(startX, startY, endX, endY) {
        // Save context state
        this.ctx.save();
        
        // Set grid style
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = this.gridOpacity;
        
        // Draw vertical lines
        for (let x = startX; x <= endX; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, endY);
            this.ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = startY; y <= endY; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(startX, y);
            this.ctx.lineTo(endX, y);
            this.ctx.stroke();
        }
        
        // Draw grid intersection points
        for (let x = startX; x <= endX; x += this.gridSize) {
            for (let y = startY; y <= endY; y += this.gridSize) {
                this.ctx.beginPath();
                this.ctx.arc(x, y, 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        // Restore context state
        this.ctx.restore();
    }

    drawTerrainEffects(startX, startY, endX, endY) {
        // Save context state
        this.ctx.save();
        
        // Set terrain effect style
        this.ctx.globalAlpha = 0.1;
        this.ctx.strokeStyle = this.colors.highlights;
        this.ctx.lineWidth = 2;

        // Draw animated diagonal lines
        const spacing = (endY - startY) / 6;
        
        for (let i = 0; i < 5; i++) {
            const yPos = startY + spacing * (i + 1);
            const offset = Math.sin(this.time + i * 0.5) * 20;
            
            this.ctx.beginPath();
            this.ctx.moveTo(startX, yPos + offset);
            this.ctx.lineTo(endX, yPos - offset);
            this.ctx.stroke();
        }

        // Draw animated circles
        for (let i = 0; i < 3; i++) {
            const x = startX + (endX - startX) * (0.25 + i * 0.25);
            const y = startY + (endY - startY) * 0.5;
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