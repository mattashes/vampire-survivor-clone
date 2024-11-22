import { GAME_CONFIG } from '../config.js';

export class DebugUI {
    constructor() {
        this.isVisible = false;
        this.container = null;
        this.createDebugWindow();
    }

    createDebugWindow() {
        // Create container
        this.container = document.createElement('div');
        this.container.id = 'debugWindow';
        this.container.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            padding: 15px;
            border-radius: 5px;
            color: white;
            font-family: Arial, sans-serif;
            min-width: 200px;
            display: none;
            z-index: 1000;
        `;

        // Add header
        const header = document.createElement('div');
        header.innerHTML = '<h3 style="margin: 0 0 10px 0;">Debug Controls</h3>';
        this.container.appendChild(header);

        // Add enemy speed controls
        this.addEnemySpeedControls();

        // Add toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.textContent = 'Toggle Debug UI';
        toggleBtn.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 5px 10px;
            background: #444;
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            z-index: 1001;
        `;
        toggleBtn.addEventListener('click', () => this.toggle());

        // Add to document
        document.body.appendChild(this.container);
        document.body.appendChild(toggleBtn);
    }

    addEnemySpeedControls() {
        const enemyTypes = ['fast', 'tank', 'swarm'];
        
        enemyTypes.forEach(type => {
            const container = document.createElement('div');
            container.style.marginBottom = '10px';

            const label = document.createElement('label');
            label.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} Enemy Speed: `;
            label.style.display = 'block';
            label.style.marginBottom = '5px';

            const valueDisplay = document.createElement('span');
            valueDisplay.textContent = GAME_CONFIG.enemies.types[type].speed;
            valueDisplay.style.marginLeft = '10px';

            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = '50';
            slider.max = '300';
            slider.value = GAME_CONFIG.enemies.types[type].speed;
            slider.style.width = '100%';

            slider.addEventListener('input', (e) => {
                const newSpeed = parseInt(e.target.value);
                GAME_CONFIG.enemies.types[type].speed = newSpeed;
                valueDisplay.textContent = newSpeed;
            });

            container.appendChild(label);
            container.appendChild(slider);
            container.appendChild(valueDisplay);
            this.container.appendChild(container);
        });
    }

    toggle() {
        this.isVisible = !this.isVisible;
        this.container.style.display = this.isVisible ? 'block' : 'none';
    }
}
