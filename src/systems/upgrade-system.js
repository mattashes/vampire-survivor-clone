import { GAME_CONFIG, logDebug } from '../config.js';

export class UpgradeSystem {
    constructor(game) {
        this.game = game;
        this.isUpgradeMenuOpen = false;
        this.availableUpgrades = [];
        this.createUpgradeMenu();
        this.debug = GAME_CONFIG.debug;
    }

    createUpgradeMenu() {
        // Create upgrade menu container
        this.menuContainer = document.createElement('div');
        this.menuContainer.id = 'upgradeMenu';
        this.menuContainer.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            padding: 20px;
            border-radius: 10px;
            color: white;
            font-family: Arial, sans-serif;
            min-width: 300px;
            display: none;
            z-index: 1000;
            text-align: center;
        `;

        // Add level up header
        const header = document.createElement('h2');
        header.textContent = 'Level Up!';
        header.style.color = '#ffff00';
        this.menuContainer.appendChild(header);

        // Create upgrade options container
        this.upgradeOptions = document.createElement('div');
        this.upgradeOptions.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-top: 20px;
        `;
        this.menuContainer.appendChild(this.upgradeOptions);

        document.body.appendChild(this.menuContainer);
    }

    showUpgradeMenu() {
        this.isUpgradeMenuOpen = true;
        this.menuContainer.style.display = 'block';
        this.game.isPaused = true;
        
        // Generate random upgrades
        this.generateUpgrades();
    }

    hideUpgradeMenu() {
        this.isUpgradeMenuOpen = false;
        this.menuContainer.style.display = 'none';
        this.game.isPaused = false;
    }

    update() {
        // Check if hero leveled up
        const hero = this.game.entities.hero;
        if (hero && hero.needsLevelUp && !this.isUpgradeMenuOpen) {
            this.showUpgradeMenu();
            hero.needsLevelUp = false;
        }
    }

    generateUpgrades() {
        this.upgradeOptions.innerHTML = '';
        const upgrades = this.getAvailableUpgrades();
        
        upgrades.forEach(upgrade => {
            const button = document.createElement('button');
            button.style.cssText = `
                background: #444;
                border: none;
                padding: 15px;
                margin: 5px;
                color: white;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                transition: background 0.3s;
            `;
            button.innerHTML = `
                <strong>${upgrade.name}</strong><br>
                <small>${upgrade.description}</small>
            `;
            
            button.addEventListener('mouseover', () => {
                button.style.background = '#666';
            });
            
            button.addEventListener('mouseout', () => {
                button.style.background = '#444';
            });
            
            button.addEventListener('click', async () => {
                await this.applyUpgrade(upgrade);
                this.hideUpgradeMenu();
            });
            
            this.upgradeOptions.appendChild(button);
        });
    }

    getAvailableUpgrades() {
        // Get 3 random upgrades from the available pool
        const allUpgrades = [
            {
                name: 'Health Up',
                description: 'Increase max health by 20%',
                apply: (hero) => {
                    const increase = hero.maxHealth * 0.2;
                    hero.maxHealth += increase;
                    hero.health += increase;
                }
            },
            {
                name: 'Speed Up',
                description: 'Increase movement speed by 15%',
                apply: (hero) => {
                    hero.speed *= 1.15;
                }
            },
            {
                name: 'Regeneration',
                description: 'Increase health regeneration by 1',
                apply: (hero) => {
                    hero.regeneration += 1;
                }
            },
            {
                name: 'Weapon Mastery',
                description: 'Reduce weapon cooldowns by 10%',
                apply: (hero) => {
                    for (const weapon of hero.weapons) {
                        weapon.cooldown *= 0.9;
                    }
                }
            },
            {
                name: 'Projectile Size',
                description: 'Increase projectile size by 20%',
                apply: (hero) => {
                    for (const weapon of hero.weapons) {
                        if (weapon.projectileRadius) {
                            weapon.projectileRadius *= 1.2;
                        }
                    }
                }
            },
            // Add new weapon choices
            {
                name: 'Shotgun',
                description: 'Add a shotgun that fires multiple projectiles in a spread pattern',
                apply: async (hero) => {
                    const Shotgun = (await import('../weapons/weapon-types.js')).Shotgun;
                    const shotgun = new Shotgun(hero);
                    hero.weapons.add(shotgun);
                },
                isWeapon: true
            },
            {
                name: 'Energy Beam',
                description: 'Add an energy weapon that fires rapid beams with visual effects',
                apply: async (hero) => {
                    const EnergyBeam = (await import('../weapons/weapon-types.js')).EnergyBeam;
                    const beam = new EnergyBeam(hero);
                    hero.weapons.add(beam);
                },
                isWeapon: true
            },
            {
                name: 'Pulse Cannon',
                description: 'Add a cannon that fires explosive projectiles for area damage',
                apply: async (hero) => {
                    const PulseCannon = (await import('../weapons/weapon-types.js')).PulseCannon;
                    const cannon = new PulseCannon(hero);
                    hero.weapons.add(cannon);
                },
                isWeapon: true
            }
        ];

        // Get available upgrades excluding weapons the hero already has
        const availableUpgrades = allUpgrades.filter(upgrade => {
            if (!upgrade.isWeapon) return true;
            // Convert Set to Array for checking weapon types
            const heroWeapons = Array.from(this.game.entities.hero.weapons);
            return !heroWeapons.some(w => w.constructor.name === upgrade.name.replace(' ', ''));
        });

        // Ensure at least one weapon choice if available
        const weaponUpgrades = availableUpgrades.filter(u => u.isWeapon);
        const statUpgrades = availableUpgrades.filter(u => !u.isWeapon);
        
        let selectedUpgrades = [];
        
        // Add a weapon upgrade if available
        if (weaponUpgrades.length > 0) {
            selectedUpgrades.push(weaponUpgrades[Math.floor(Math.random() * weaponUpgrades.length)]);
        }
        
        // Fill remaining slots with random stat upgrades
        while (selectedUpgrades.length < 3 && statUpgrades.length > 0) {
            const index = Math.floor(Math.random() * statUpgrades.length);
            selectedUpgrades.push(statUpgrades[index]);
            statUpgrades.splice(index, 1);
        }

        return selectedUpgrades;
    }

    async applyUpgrade(upgrade) {
        if (this.game.entities.hero) {
            await upgrade.apply(this.game.entities.hero);
            if (this.debug) {
                logDebug(`Applied upgrade: ${upgrade.name}`);
            }
        }
    }
}
