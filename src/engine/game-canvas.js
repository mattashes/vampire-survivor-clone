export class GameCanvas {
    constructor(game) {
        this.game = game;
        this.initCanvas();
        this.initScreenShake();
        this.addResizeHandler();
    }

    initCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            throw new Error('Canvas element not found');
        }
        this.ctx = this.canvas.getContext('2d');
        
        // Set initial canvas size
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    initScreenShake() {
        this.screenShake = {
            intensity: 0,
            duration: 0,
            timer: 0,
            offsetX: 0,
            offsetY: 0
        };
    }

    addResizeHandler() {
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    handleResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        if (this.game.backgroundSystem) {
            this.game.backgroundSystem.handleResize();
        }
    }

    startScreenShake(intensity, duration) {
        this.screenShake.intensity = intensity;
        this.screenShake.duration = duration;
        this.screenShake.timer = duration;
    }

    updateScreenShake(deltaTime) {
        if (this.screenShake.timer > 0) {
            this.screenShake.timer -= deltaTime;
            const progress = this.screenShake.timer / this.screenShake.duration;
            const currentIntensity = this.screenShake.intensity * progress;
            this.screenShake.offsetX = (Math.random() - 0.5) * 2 * currentIntensity;
            this.screenShake.offsetY = (Math.random() - 0.5) * 2 * currentIntensity;
        } else {
            this.screenShake.offsetX = 0;
            this.screenShake.offsetY = 0;
        }
    }

    beginDraw() {
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply screen shake
        this.ctx.save();
        this.ctx.translate(this.screenShake.offsetX, this.screenShake.offsetY);
    }

    endDraw() {
        this.ctx.restore();
    }
}