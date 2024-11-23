import { BasicGun } from '../weapons/basic-gun.js';
import { PulseCannon } from '../weapons/pulse-cannon.js';
import { EnergyBeam } from '../weapons/energy-beam.js';
import { Shotgun } from '../weapons/shotgun.js';
import { MiniGun } from '../weapons/minigun.js';

export class WeaponMenu {
    constructor(game) {
        this.game = game;
        this.isVisible = false;
        this.weapons = [
            { name: 'Basic Gun', class: BasicGun },
            { name: 'Pulse Cannon', class: PulseCannon },
            { name: 'Energy Beam', class: EnergyBeam },
            { name: 'Shotgun', class: Shotgun },
            { name: 'MiniGun', class: MiniGun }
        ];
        
        this.createMenu();
        this.setupEventListeners();
    }

    createMenu() {
        // Create menu container
        this.menuElement = document.createElement('div');
        this.menuElement.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            padding: 10px;
            border-radius: 5px;
            color: white;
            font-family: Arial, sans-serif;
            display: none;
            z-index: 1000;
        `;

        // Add title
        const title = document.createElement('div');
        title.textContent = 'Weapon Testing Menu';
        title.style.cssText = `
            font-weight: bold;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #444;
        `;
        this.menuElement.appendChild(title);

        // Create weapon buttons
        this.weapons.forEach(weapon => {
            const button = document.createElement('button');
            button.textContent = weapon.name;
            button.style.cssText = `
                display: block;
                width: 100%;
                padding: 5px 10px;
                margin: 5px 0;
                background: #444;
                border: none;
                border-radius: 3px;
                color: white;
                cursor: pointer;
                transition: background 0.2s;
            `;
            button.addEventListener('mouseover', () => {
                button.style.background = '#666';
            });
            button.addEventListener('mouseout', () => {
                button.style.background = '#444';
            });
            button.addEventListener('click', () => this.equipWeapon(weapon.class));
            this.menuElement.appendChild(button);
        });

        // Add clear weapons button
        const clearButton = document.createElement('button');
        clearButton.textContent = 'Clear All Weapons';
        clearButton.style.cssText = `
            display: block;
            width: 100%;
            padding: 5px 10px;
            margin: 5px 0;
            background: #aa0000;
            border: none;
            border-radius: 3px;
            color: white;
            cursor: pointer;
            transition: background 0.2s;
        `;
        clearButton.addEventListener('mouseover', () => {
            clearButton.style.background = '#cc0000';
        });
        clearButton.addEventListener('mouseout', () => {
            clearButton.style.background = '#aa0000';
        });
        clearButton.addEventListener('click', () => this.clearWeapons());
        this.menuElement.appendChild(clearButton);

        // Add to document
        document.body.appendChild(this.menuElement);
    }

    setupEventListeners() {
        // Toggle menu with 'T' key
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 't') {
                this.toggleMenu();
            }
        });
    }

    toggleMenu() {
        this.isVisible = !this.isVisible;
        this.menuElement.style.display = this.isVisible ? 'block' : 'none';
    }

    equipWeapon(WeaponClass) {
        const hero = this.game?.gameEntities?.entities?.hero;
        if (!hero) {
            console.warn('Hero not found, cannot equip weapon');
            return;
        }

        try {
            // Create and add the weapon
            const weapon = new WeaponClass(hero);
            hero.combat.addWeapon(weapon);
            console.log(`Equipped ${weapon.constructor.name}`);
        } catch (error) {
            console.error('Failed to equip weapon:', error);
        }
    }

    clearWeapons() {
        const hero = this.game?.gameEntities?.entities?.hero;
        if (!hero) {
            console.warn('Hero not found, cannot clear weapons');
            return;
        }

        try {
            // Clear all weapons except the basic gun
            const weapons = Array.from(hero.combat.weapons);
            weapons.forEach(weapon => {
                if (!(weapon instanceof BasicGun)) {
                    hero.combat.removeWeapon(weapon);
                }
            });
            console.log('Cleared all weapons except Basic Gun');
        } catch (error) {
            console.error('Failed to clear weapons:', error);
        }
    }
}
