export class TerrainSystem {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.chunks = new Map();
        this.chunkSize = 512;
        this.tileSize = 32;
        this.zoom = 1;
        this.camera = {
            x: 0,
            y: 0,
            minZoom: 0.5,
            maxZoom: 2
        };
        
        this.terrainTypes = {
            GROUND: 0,
            WALL: 1,
            WATER: 2
        };

        this.noiseScale = 0.05;
        this.waterThreshold = 0.3;
        this.wallThreshold = 0.7;

        // Initialize the first chunk
        this.generateChunk(0, 0);

        this.initZoomHandler();
    }

    initZoomHandler() {
        this.game.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomSpeed = 0.1;
            const delta = -Math.sign(e.deltaY) * zoomSpeed;
            this.zoom = Math.max(this.camera.minZoom, 
                               Math.min(this.camera.maxZoom, 
                                      this.zoom + delta));
        });
    }

    noise(x, y) {
        const X = Math.floor(Math.abs(x)) & 255;
        const Y = Math.floor(Math.abs(y)) & 255;
        return (Math.sin(X * 12.9898 + Y * 78.233) * 43758.5453123) % 1;
    }

    generateChunk(chunkX, chunkY) {
        const tilesPerChunk = Math.floor(this.chunkSize / this.tileSize);
        const chunk = {
            x: chunkX,
            y: chunkY,
            tiles: new Array(tilesPerChunk)
        };

        for (let x = 0; x < tilesPerChunk; x++) {
            chunk.tiles[x] = new Array(tilesPerChunk);
            for (let y = 0; y < tilesPerChunk; y++) {
                const worldX = (chunkX * this.chunkSize) + (x * this.tileSize);
                const worldY = (chunkY * this.chunkSize) + (y * this.tileSize);
                
                const noiseValue = this.noise(worldX * this.noiseScale, 
                                           worldY * this.noiseScale);
                
                let terrainType;
                if (noiseValue < this.waterThreshold) {
                    terrainType = this.terrainTypes.WATER;
                } else if (noiseValue > this.wallThreshold) {
                    terrainType = this.terrainTypes.WALL;
                } else {
                    terrainType = this.terrainTypes.GROUND;
                }
                
                chunk.tiles[x][y] = terrainType;
            }
        }

        this.chunks.set(`${chunkX},${chunkY}`, chunk);
    }

    getTerrainAt(worldX, worldY) {
        const chunkX = Math.floor(worldX / this.chunkSize);
        const chunkY = Math.floor(worldY / this.chunkSize);
        const chunk = this.chunks.get(`${chunkX},${chunkY}`);
        
        if (!chunk) {
            this.generateChunk(chunkX, chunkY);
            return this.getTerrainAt(worldX, worldY);
        }

        // Handle negative coordinates properly
        let tileX = Math.floor((worldX - chunkX * this.chunkSize) / this.tileSize);
        let tileY = Math.floor((worldY - chunkY * this.chunkSize) / this.tileSize);

        // Ensure tile coordinates are within bounds
        const tilesPerChunk = Math.floor(this.chunkSize / this.tileSize);
        tileX = Math.max(0, Math.min(tilesPerChunk - 1, tileX));
        tileY = Math.max(0, Math.min(tilesPerChunk - 1, tileY));
        
        return chunk.tiles[tileX][tileY];
    }

    checkCollision(entity) {
        if (!entity.worldX || !entity.worldY) return false;
        
        // Get the terrain type at entity's world position
        const terrain = this.getTerrainAt(entity.worldX, entity.worldY);
        return terrain === this.terrainTypes.WALL;
    }

    update(deltaTime) {
        // Update camera position based on hero position
        const hero = this.game.entities.hero;
        if (hero) {
            this.camera.x = hero.worldX - (this.game.canvas.width / 2 / this.zoom);
            this.camera.y = hero.worldY - (this.game.canvas.height / 2 / this.zoom);
        }
    }

    draw() {
        this.ctx.save();
        
        // Apply camera transform
        this.ctx.scale(this.zoom, this.zoom);
        this.ctx.translate(-this.camera.x, -this.camera.y);

        // Calculate visible chunks
        const visibleChunks = this.getVisibleChunks();
        
        // Draw visible chunks
        for (const chunk of visibleChunks) {
            this.drawChunk(chunk);
        }

        this.ctx.restore();
    }

    getVisibleChunks() {
        const visibleChunks = [];
        const screenWidth = this.game.canvas.width / this.zoom;
        const screenHeight = this.game.canvas.height / this.zoom;

        const startChunkX = Math.floor(this.camera.x / this.chunkSize);
        const startChunkY = Math.floor(this.camera.y / this.chunkSize);
        const endChunkX = Math.ceil((this.camera.x + screenWidth) / this.chunkSize);
        const endChunkY = Math.ceil((this.camera.y + screenHeight) / this.chunkSize);

        for (let x = startChunkX; x <= endChunkX; x++) {
            for (let y = startChunkY; y <= endChunkY; y++) {
                let chunk = this.chunks.get(`${x},${y}`);
                if (!chunk) {
                    this.generateChunk(x, y);
                    chunk = this.chunks.get(`${x},${y}`);
                }
                visibleChunks.push(chunk);
            }
        }

        return visibleChunks;
    }

    drawChunk(chunk) {
        const chunkScreenX = chunk.x * this.chunkSize;
        const chunkScreenY = chunk.y * this.chunkSize;

        for (let x = 0; x < chunk.tiles.length; x++) {
            for (let y = 0; y < chunk.tiles[x].length; y++) {
                const terrainType = chunk.tiles[x][y];
                const screenX = chunkScreenX + (x * this.tileSize);
                const screenY = chunkScreenY + (y * this.tileSize);

                switch (terrainType) {
                    case this.terrainTypes.WATER:
                        this.ctx.fillStyle = '#4444aa';
                        break;
                    case this.terrainTypes.WALL:
                        this.ctx.fillStyle = '#666666';
                        break;
                    default:
                        this.ctx.fillStyle = '#228822';
                        break;
                }

                this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
                
                this.ctx.strokeStyle = '#000000';
                this.ctx.globalAlpha = 0.1;
                this.ctx.strokeRect(screenX, screenY, this.tileSize, this.tileSize);
                this.ctx.globalAlpha = 1;
            }
        }
    }
}