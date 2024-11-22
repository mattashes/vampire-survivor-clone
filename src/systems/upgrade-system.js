import { GAME_CONFIG, logDebug } from '../config.js';
import { Shotgun, MiniGun, EnergyBeam, PulseCannon } from '../weapons/weapon-types.js';

export class UpgradeSystem {
    constructor(game) {
        this.game = game;
        this.isUpgradeMenuOpen = false;
        this.availableUpgrades = [];
        this.createUpgradeMenu();
        this.debug = GAME_CONFIG.debug;
    }

    createUpgradeMenu() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: none;
            z-index: 999;
        `;

        // Create upgrade menu container
        this.menuContainer = document.createElement('div');
        this.menuContainer.id = 'upgradeMenu';
        this.menuContainer.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(20, 20, 40, 0.95);
            padding: 30px;
            border-radius: 15px;
            border: 2px solid #4a4a6b;
            color: white;
            font-family: Arial, sans-serif;
            min-width: 400px;
            display: none;
            z-index: 1000;
            text-align: center;
            box-shadow: 0 0 20px rgba(74, 74, 107, 0.5);
        `;

        // Add level up header
        const header = document.createElement('h2');
        header.textContent = 'Level Up!';
        header.style.cssText = `
            color: #ffff00;
            font-size: 28px;
            margin-bottom: 20px;
            text-shadow: 0 0 10px rgba(255, 255, 0, 0.5);
        `;
        this.menuContainer.appendChild(header);

        // Create upgrade options container
        this.upgradeOptions = document.createElement('div');
        this.upgradeOptions.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 15px;
            margin-top: 20px;
            max-height: 70vh;
            overflow-y: auto;
            padding: 10px;
        `;
        this.menuContainer.appendChild(this.upgradeOptions);

        document.body.appendChild(this.overlay);
        document.body.appendChild(this.menuContainer);
    }

    showUpgradeMenu() {
        if (this.debug) {
            logDebug('Showing upgrade menu');
        }
        this.isUpgradeMenuOpen = true;
        this.overlay.style.display = 'block';
        this.menuContainer.style.display = 'block';
        this.game.isPaused = true;
        
        // Generate random upgrades
        this.generateUpgrades();
    }

    hideUpgradeMenu() {
        if (this.debug) {
            logDebug('Hiding upgrade menu');
        }
        this.isUpgradeMenuOpen = false;
        this.overlay.style.display = 'none';
        this.menuContainer.style.display = 'none';
        this.game.isPaused = false;
    }

    update() {
        // Check if hero leveled up
        const hero = this.game.entities.hero;
        if (hero && hero.needsLevelUp && !this.isUpgradeMenuOpen) {
            if (this.debug) {
                logDebug('Hero needs level up, showing menu');
            }
            this.showUpgradeMenu();
            hero.needsLevelUp = false;
        }
    }

    generateUpgrades() {
        if (this.debug) {
            logDebug('Generating upgrades');
        }
        this.upgradeOptions.innerHTML = '';
        const upgrades = this.getAvailableUpgrades();
        
        upgrades.forEach(upgrade => {
            const button = document.createElement('button');
            button.style.cssText = `
                background: linear-gradient(to bottom, #4a4a6b, #2a2a4b);
                border: 2px solid #6a6a8b;
                padding: 20px;
                margin: 5px;
                color: white;
                border-radius: 10px;
                cursor: pointer;
                font-size: 16px;
                transition: all 0.3s ease;
                width: 100%;
                text-align: left;
                position: relative;
                overflow: hidden;
            `;
            
            const title = document.createElement('div');
            title.style.cssText = `
                font-size: 20px;
                font-weight: bold;
                margin-bottom: 8px;
                color: #ffff00;
            `;
            title.textContent = upgrade.name;
            
            const description = document.createElement('div');
            description.style.cssText = `
                font-size: 14px;
                color: #cccccc;
                line-height: 1.4;
            `;
            description.textContent = upgrade.description;
            
            button.appendChild(title);
            button.appendChild(description);
            
            button.addEventListener('mouseover', () => {
                button.style.background = 'linear-gradient(to bottom, #5a5a7b, #3a3a5b)';
                button.style.transform = 'scale(1.02)';
                button.style.boxShadow = '0 0 15px rgba(106, 106, 139, 0.5)';
            });
            
            button.addEventListener('mouseout', () => {
                button.style.background = 'linear-gradient(to bottom, #4a4a6b, #2a2a4b)';
                button.style.transform = 'scale(1)';
                button.style.boxShadow = 'none';
            });
            
            button.addEventListener('click', () => {
                if (this.debug) {
                    logDebug(`Selected upgrade: ${upgrade.name}`);
                }
                this.applyUpgrade(upgrade);
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
                apply: (hero) => {
                    const shotgun = new Shotgun(hero);
                    hero.weapons.add(shotgun);
                },
                isWeapon: true,
                weaponClass: Shotgun
            },
            {
                name: 'Mini Gun',
                description: 'Add a rapid-fire weapon with high rate of fire',
                apply: (hero) => {
                    const miniGun = new MiniGun(hero);
                    hero.weapons.add(miniGun);
                },
                isWeapon: true,
                weaponClass: MiniGun
            },
            {
                name: 'Energy Beam',
                description: 'Add an energy weapon that fires rapid beams with visual effects',
                apply: (hero) => {
                    const beam = new EnergyBeam(hero);
                    hero.weapons.add(beam);
                },
                isWeapon: true,
                weaponClass: EnergyBeam
            },
            {
                name: 'Pulse Cannon',
                description: 'Add a cannon that fires explosive projectiles for area damage',
                apply: (hero) => {
                    const cannon = new PulseCannon(hero);
                    hero.weapons.add(cannon);
                },
                isWeapon: true,
                weaponClass: PulseCannon
            }
        ];

        // Get available upgrades excluding weapons the hero already has
        const availableUpgrades = allUpgrades.filter(upgrade => {
            if (!upgrade.isWeapon) return true;
            // Check if hero already has this weapon type
            const heroWeapons = Array.from(this.game.entities.hero.weapons);
            return !heroWeapons.some(w => upgrade.weaponClass && w instanceof upgrade.weaponClass);
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

        if (this.debug) {
            logDebug(`Generated ${selectedUpgrades.length} upgrades`);
        }

        return selectedUpgrades;
    }

    applyUpgrade(upgrade) {
        if (this.game.entities.hero) {
            upgrade.apply(this.game.entities.hero);
            if (this.debug) {
                logDebug(`Applied upgrade: ${upgrade.name}`);
            }
        }
    }
}