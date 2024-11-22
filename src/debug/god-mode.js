import { GAME_CONFIG, logDebug } from '../config.js';

export class GodMode {
    constructor(game) {
        this.game = game;
        this.isVisible = false;
        this.container = null;
        this.createGodModeWindow();
    }

    createGodModeWindow() {
        // Create container
        this.container = document.createElement('div');
        this.container.id = 'godModeWindow';
        this.container.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            padding: 15px;
            border-radius: 5px;
            color: white;
            font-family: Arial, sans-serif;
            min-width: 250px;
            display: none;
            z-index: 1000;
            max-height: 80vh;
            overflow-y: auto;
        `;

        // Add styles for sliders
        const style = document.createElement('style');
        style.textContent = `
            .slider-container {
                margin-bottom: 15px;
            }
            .slider-container label {
                display: block;
                margin-bottom: 5px;
            }
            .slider-container .slider-info {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 5px;
            }
            .slider-container input[type="range"] {
                width: 100%;
                height: 8px;
                background: #333;
                border-radius: 4px;
                outline: none;
                -webkit-appearance: none;
            }
            .slider-container input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 16px;
                height: 16px;
                background: #4CAF50;
                border-radius: 50%;
                cursor: pointer;
                transition: background 0.15s ease-in-out;
            }
            .slider-container input[type="range"]::-webkit-slider-thumb:hover {
                background: #45a049;
            }
            .slider-container .value-display {
                min-width: 45px;
                text-align: right;
                margin-left: 10px;
            }
            .section-header {
                color: #4CAF50;
                border-bottom: 1px solid #4CAF50;
                margin-bottom: 10px;
                padding-bottom: 5px;
            }
        `;
        document.head.appendChild(style);

        // Add header
        const header = document.createElement('div');
        header.innerHTML = '<h3 style="margin: 0 0 10px 0; color: #4CAF50;">God Mode</h3>';
        this.container.appendChild(header);

        // Add controls
        this.addHeroControls();
        this.addWeaponControls();
        this.addEnemyControls();
        this.addLevelControls();
        this.addMiscControls();

        // Add toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.textContent = 'God Mode';
        toggleBtn.style.cssText = `
            position: fixed;
            bottom: 60px;
            right: 10px;
            padding: 8px 15px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            z-index: 1001;
            font-weight: bold;
            transition: background 0.2s;
        `;
        toggleBtn.addEventListener('mouseover', () => {
            toggleBtn.style.background = '#45a049';
        });
        toggleBtn.addEventListener('mouseout', () => {
            toggleBtn.style.background = '#4CAF50';
        });
        toggleBtn.addEventListener('click', () => this.toggle());

        // Add to document
        document.body.appendChild(this.container);
        document.body.appendChild(toggleBtn);
    }

    addSlider(parent, label, min, max, step, defaultValue, onChange) {
        const container = document.createElement('div');
        container.className = 'slider-container';

        const labelElem = document.createElement('div');
        labelElem.className = 'slider-info';

        const labelText = document.createElement('label');
        labelText.textContent = label;
        labelElem.appendChild(labelText);

        const valueDisplay = document.createElement('span');
        valueDisplay.className = 'value-display';
        valueDisplay.textContent = defaultValue;
        labelElem.appendChild(valueDisplay);

        container.appendChild(labelElem);

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.value = defaultValue;

        slider.addEventListener('input', (e) => {
            const value = Number(e.target.value);
            valueDisplay.textContent = value;
            onChange(value);
        });

        container.appendChild(slider);
        parent.appendChild(container);
        return slider;
    }

    createSection(title) {
        const section = document.createElement('div');
        section.style.marginBottom = '20px';
        
        const header = document.createElement('h4');
        header.className = 'section-header';
        header.textContent = title;
        header.style.margin = '0 0 10px 0';
        
        section.appendChild(header);
        this.container.appendChild(section);
        return section;
    }

    addEnemyControls() {
        const section = this.createSection('Enemy Controls');

        // Spawn rate control
        this.addSlider(section, 'Spawn Rate (sec)', 0.1, 10, 0.1, 1, (value) => {
            this.game.enemySpawner.spawnRate = value;
        });

        // Max enemies control
        this.addSlider(section, 'Max Enemies', 1, 100, 1, 50, (value) => {
            GAME_CONFIG.enemies.maxCount = value;
        });

        // Enemies per wave control
        this.addSlider(section, 'Enemies Per Wave', 1, 20, 1, 5, (value) => {
            this.game.enemySpawner.enemiesPerWave = value;
        });

        // Enemy weights section
        const weightSection = document.createElement('div');
        weightSection.style.marginTop = '15px';
        weightSection.innerHTML = '<div style="margin-bottom: 8px; color: #4CAF50;">Enemy Weights:</div>';
        section.appendChild(weightSection);

        // Fast enemy weight
        this.addSlider(weightSection, 'Fast', 0, 10, 1, 2, (value) => {
            this.game.enemySpawner.enemyTypes[0].weight = value;
        });

        // Tank enemy weight
        this.addSlider(weightSection, 'Tank', 0, 10, 1, 1, (value) => {
            this.game.enemySpawner.enemyTypes[1].weight = value;
        });

        // Swarm enemy weight
        this.addSlider(weightSection, 'Swarm', 0, 10, 1, 3, (value) => {
            this.game.enemySpawner.enemyTypes[2].weight = value;
        });

        // Clear enemies button
        const clearBtn = document.createElement('button');
        clearBtn.textContent = 'Clear All Enemies';
        clearBtn.style.cssText = `
            width: 100%;
            padding: 8px;
            margin-top: 10px;
            background: #f44336;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.2s;
        `;
        clearBtn.addEventListener('mouseover', () => {
            clearBtn.style.background = '#d32f2f';
        });
        clearBtn.addEventListener('mouseout', () => {
            clearBtn.style.background = '#f44336';
        });
        clearBtn.addEventListener('click', () => {
            this.game.entities.enemies.forEach(enemy => {
                enemy.isDead = true;
            });
            this.game.entities.enemies.clear();
        });
        section.appendChild(clearBtn);

        // Pause spawning toggle
        this.addToggle(section, 'Pause Spawning', (checked) => {
            this.game.enemySpawner.isPaused = checked;
        });
    }

    addWeaponControls() {
        const section = this.createSection('Weapon Controls');

        // Create debug output display
        const debugOutput = document.createElement('div');
        debugOutput.style.cssText = `
            background: rgba(0, 0, 0, 0.8);
            padding: 10px;
            margin: 10px 0;
            border-radius: 4px;
            font-family: monospace;
            white-space: pre;
            color: #4CAF50;
            user-select: all;
            cursor: text;
        `;
        section.appendChild(debugOutput);

        // Keep track of current values
        const currentValues = {
            fireRate: 2,
            damage: 25,
            projectileSpeed: 400,
            projectileSize: 6,
            projectileLifetime: 1.5,
            noCooldown: false
        };

        // Function to update debug output
        const updateDebugOutput = () => {
            const output = `Current Weapon Settings:
---------------------------
Fire Rate: ${currentValues.fireRate}
Damage: ${currentValues.damage}
Projectile Speed: ${currentValues.projectileSpeed}
Projectile Size: ${currentValues.projectileSize}
Projectile Lifetime: ${currentValues.projectileLifetime}
No Cooldown: ${currentValues.noCooldown ? 'ON' : 'OFF'}
---------------------------`;
            debugOutput.textContent = output;
        };

        // Basic weapon stats
        this.addSlider(section, 'Fire Rate', 0.1, 20, 0.1, currentValues.fireRate, (value) => {
            if (this.game.entities.hero) {
                for (const weapon of this.game.entities.hero.weapons) {
                    weapon.fireRate = value;
                }
            }
            currentValues.fireRate = value;
            updateDebugOutput();
        });

        this.addSlider(section, 'Damage', 1, 1000, 1, currentValues.damage, (value) => {
            if (this.game.entities.hero) {
                for (const weapon of this.game.entities.hero.weapons) {
                    weapon.damage = value;
                }
            }
            currentValues.damage = value;
            updateDebugOutput();
        });

        this.addSlider(section, 'Projectile Speed', 100, 1000, 50, currentValues.projectileSpeed, (value) => {
            if (this.game.entities.hero) {
                for (const weapon of this.game.entities.hero.weapons) {
                    weapon.projectileSpeed = value;
                }
            }
            currentValues.projectileSpeed = value;
            updateDebugOutput();
        });

        this.addSlider(section, 'Projectile Size', 2, 20, 1, currentValues.projectileSize, (value) => {
            if (this.game.entities.hero) {
                for (const weapon of this.game.entities.hero.weapons) {
                    weapon.projectileSize = value;
                }
            }
            currentValues.projectileSize = value;
            updateDebugOutput();
        });

        this.addSlider(section, 'Projectile Lifetime', 0.1, 5, 0.1, currentValues.projectileLifetime, (value) => {
            if (this.game.entities.hero) {
                for (const weapon of this.game.entities.hero.weapons) {
                    weapon.projectileLifetime = value;
                }
            }
            currentValues.projectileLifetime = value;
            updateDebugOutput();
        });

        // No cooldown toggle
        this.addToggle(section, 'No Cooldown', (checked) => {
            if (this.game.entities.hero) {
                for (const weapon of this.game.entities.hero.weapons) {
                    weapon.noCooldown = checked;
                }
            }
            currentValues.noCooldown = checked;
            updateDebugOutput();
        });

        // Initial debug output
        updateDebugOutput();
    }

    addHeroControls() {
        const section = this.createSection('Hero Controls');

        // Movement speed
        this.addSlider(section, 'Movement Speed', 50, 500, 10, 150, (value) => {
            if (this.game.entities.hero) {
                this.game.entities.hero.maxSpeed = value;
                this.game.entities.hero.speed = value;
            }
        });

        // Max health
        this.addSlider(section, 'Max Health', 50, 1000, 10, 100, (value) => {
            if (this.game.entities.hero) {
                this.game.entities.hero.maxHealth = value;
                this.game.entities.hero.health = value;
            }
        });

        // Invincible toggle
        this.addToggle(section, 'Invincible', (checked) => {
            if (this.game.entities.hero) {
                this.game.entities.hero.isInvincible = checked;
            }
        });
    }

    addToggle(parent, label, onChange) {
        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            align-items: center;
            margin: 10px 0;
        `;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.style.marginRight = '8px';
        checkbox.addEventListener('change', (e) => onChange(e.target.checked));

        const labelElem = document.createElement('label');
        labelElem.textContent = label;

        container.appendChild(checkbox);
        container.appendChild(labelElem);
        parent.appendChild(container);
    }

    addMiscControls() {
        const section = this.createSection('Misc Controls');

        // Kill all enemies button
        const killAllBtn = document.createElement('button');
        killAllBtn.textContent = 'Kill All Enemies';
        killAllBtn.style.cssText = `
            width: 100%;
            padding: 8px;
            margin-top: 10px;
            background: #f44336;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.2s;
        `;
        killAllBtn.addEventListener('mouseover', () => {
            killAllBtn.style.background = '#d32f2f';
        });
        killAllBtn.addEventListener('mouseout', () => {
            killAllBtn.style.background = '#f44336';
        });
        killAllBtn.addEventListener('click', () => {
            this.game.entities.enemies.forEach(enemy => {
                enemy.takeDamage(99999);
            });
        });
        section.appendChild(killAllBtn);

        // Clear projectiles button
        const clearProjectilesBtn = document.createElement('button');
        clearProjectilesBtn.textContent = 'Clear Projectiles';
        clearProjectilesBtn.style.cssText = `
            width: 100%;
            padding: 8px;
            margin-top: 10px;
            background: #f44336;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.2s;
        `;
        clearProjectilesBtn.addEventListener('mouseover', () => {
            clearProjectilesBtn.style.background = '#d32f2f';
        });
        clearProjectilesBtn.addEventListener('mouseout', () => {
            clearProjectilesBtn.style.background = '#f44336';
        });
        clearProjectilesBtn.addEventListener('click', () => {
            this.game.entities.projectiles.forEach(proj => {
                this.game.removeProjectile(proj);
            });
        });
        section.appendChild(clearProjectilesBtn);
    }

    addLevelControls() {
        const section = this.createSection('Level Controls');

        // Level control
        this.addSlider(section, 'Set Level', 1, 100, 1, 1, (value) => {
            const hero = this.game.entities.hero;
            hero.level = value;
            // Trigger upgrade menu
            this.game.upgradeSystem.showUpgradeMenu();
        });

        // Experience control
        this.addSlider(section, 'Add Experience', 0, 1000, 10, 0, (value) => {
            const hero = this.game.entities.hero;
            hero.gainExperience(value);
        });
    }

    toggle() {
        this.isVisible = !this.isVisible;
        this.container.style.display = this.isVisible ? 'block' : 'none';
    }
}
