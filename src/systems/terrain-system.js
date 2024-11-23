export class TerrainSystem {
    constructor(game) {
        this.game = game;
        this.camera = { x: 0, y: 0 };
        this.zoom = 1;
        this.smoothing = 0.1;
        this.maxOffset = 50;
        
        this.terrainTypes = {
            EMPTY: 0,
            WALL: 1
        };

        this.chunks = new Map();
        this.chunkSize = 512;
        this.tileSize = 32;

        if (this.game && this.game.canvas) {
            this.camera = {
                x: this.game.canvas.width / 2,
                y: this.game.canvas.height / 2
            };
        }
    }

    draw(ctx) {
        // Draw visible chunks
        const visibleChunks = this.getVisibleChunks();
        for (const chunk of visibleChunks) {
            this.drawChunk(ctx, chunk);
        }
    }

    drawChunk(ctx, chunk) {
        // For now, just draw a grid to represent the terrain
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        
        const startX = chunk.x * this.chunkSize;
        const startY = chunk.y * this.chunkSize;
        
        // Draw vertical lines
        for (let x = 0; x <= this.chunkSize; x += this.tileSize) {
            ctx.beginPath();
            ctx.moveTo(startX + x, startY);
            ctx.lineTo(startX + x, startY + this.chunkSize);
            ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = 0; y <= this.chunkSize; y += this.tileSize) {
            ctx.beginPath();
            ctx.moveTo(startX, startY + y);
            ctx.lineTo(startX + this.chunkSize, startY + y);
            ctx.stroke();
        }
    }

    getVisibleChunks() {
        // Calculate visible area based on camera position and canvas size
        const startX = Math.floor((this.camera.x - this.game.canvas.width / 2) / this.chunkSize);
        const startY = Math.floor((this.camera.y - this.game.canvas.height / 2) / this.chunkSize);
        const endX = Math.ceil((this.camera.x + this.game.canvas.width / 2) / this.chunkSize);
        const endY = Math.ceil((this.camera.y + this.game.canvas.height / 2) / this.chunkSize);
        
        const visibleChunks = [];
        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                visibleChunks.push({ x, y });
            }
        }
        return visibleChunks;
    }

    update(deltaTime) {
        if (!this.game || !this.game.gameEntities || !this.game.gameEntities.entities) return;

        const hero = this.game.gameEntities.entities.hero;
        if (!hero) return;

        const targetX = hero.worldX - (this.game.canvas.width / this.zoom / 2);
        const targetY = hero.worldY - (this.game.canvas.height / this.zoom / 2);

        this.camera.x += (targetX - this.camera.x) * this.smoothing;
        this.camera.y += (targetY - this.camera.y) * this.smoothing;

        this.constrainCamera();
    }

    constrainCamera() {
        const maxX = (this.chunkSize * 2) - (this.game.canvas.width / this.zoom);
        const maxY = (this.chunkSize * 2) - (this.game.canvas.height / this.zoom);
        
        this.camera.x = Math.max(0, Math.min(this.camera.x, maxX));
        this.camera.y = Math.max(0, Math.min(this.camera.y, maxY));
    }
}