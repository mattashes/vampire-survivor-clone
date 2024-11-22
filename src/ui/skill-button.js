export class SkillButton {
    constructor(game, key, cooldown) {
        this.game = game;
        this.key = key;
        this.maxCooldown = cooldown;
        this.currentCooldown = 0;
        this.isOnCooldown = false;
        this.keyPressed = false;
        
        // Create button element
        this.element = document.createElement('div');
        this.element.className = 'skill-button';
        this.element.innerHTML = `
            <div class="skill-key">${key}</div>
            <div class="cooldown-overlay"></div>
        `;
        
        // Add to document
        document.body.appendChild(this.element);
        
        // Add keyboard listener
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === this.key.toLowerCase() && !this.keyPressed) {
                this.keyPressed = true;
                this.onPress();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.key.toLowerCase() === this.key.toLowerCase()) {
                this.keyPressed = false;
            }
        });
    }
    
    onPress() {
        if (!this.isOnCooldown && !this.game.isPaused) {
            // Trigger the skill
            if (this.game.entities.hero) {
                const hero = this.game.entities.hero;
                // Get direction based on current movement or facing direction
                let dirX = hero.dx;
                let dirY = hero.dy;
                
                // If not moving, dash towards mouse/closest enemy
                if (dirX === 0 && dirY === 0) {
                    const closestEnemy = hero.findClosestEnemy();
                    if (closestEnemy) {
                        const dx = closestEnemy.x - hero.x;
                        const dy = closestEnemy.y - hero.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        dirX = dx / dist;
                        dirY = dy / dist;
                    } else {
                        dirX = 1;
                        dirY = 0;
                    }
                }
                
                hero.startDash(dirX, dirY);
            }
            
            // Start cooldown
            this.startCooldown();
        }
    }
    
    startCooldown() {
        this.isOnCooldown = true;
        this.currentCooldown = this.maxCooldown;
        this.element.classList.add('on-cooldown');
        this.updateCooldownDisplay();
    }
    
    updateCooldownDisplay() {
        const percent = (this.currentCooldown / this.maxCooldown) * 100;
        this.element.style.setProperty('--cooldown-percent', `${percent}%`);
    }
    
    update(deltaTime) {
        if (this.isOnCooldown) {
            this.currentCooldown -= deltaTime * 1000; // Convert to milliseconds
            if (this.currentCooldown <= 0) {
                this.isOnCooldown = false;
                this.element.classList.remove('on-cooldown');
                this.currentCooldown = 0;
            }
            this.updateCooldownDisplay();
        }
    }
}
