import { Shotgun, EnergyBeam, PulseCannon } from '../weapons/weapon-types.js';

export class WeaponDebugUI {
    constructor(game) {
        this.game = game;
        this.createDebugUI();
    }

    createDebugUI() {
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '10px';
        container.style.right = '10px';
        container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        container.style.padding = '10px';
        container.style.borderRadius = '5px';
        container.style.zIndex = '1000';

        const title = document.createElement('div');
        title.textContent = 'Debug Weapons';
        title.style.color = 'white';
        title.style.marginBottom = '10px';
        container.appendChild(title);

        const weapons = [
            { name: 'Shotgun', class: Shotgun },
            { name: 'Energy Beam', class: EnergyBeam },
            { name: 'Pulse Cannon', class: PulseCannon }
        ];

        weapons.forEach(weapon => {
            const button = document.createElement('button');
            button.textContent = `Equip ${weapon.name}`;
            button.style.display = 'block';
            button.style.margin = '5px 0';
            button.style.padding = '5px 10px';
            button.style.backgroundColor = '#4CAF50';
            button.style.color = 'white';
            button.style.border = 'none';
            button.style.borderRadius = '3px';
            button.style.cursor = 'pointer';

            button.addEventListener('click', () => {
                const hero = this.game.entities.hero;
                if (hero && hero.combat) {
                    hero.combat.addWeapon(weapon.class);
                    console.log(`Equipped ${weapon.name}`);
                } else {
                    console.warn('Hero or hero.combat not found');
                }
            });

            button.addEventListener('mouseover', () => {
                button.style.backgroundColor = '#45a049';
            });

            button.addEventListener('mouseout', () => {
                button.style.backgroundColor = '#4CAF50';
            });

            container.appendChild(button);
        });

        // Add a clear weapons button
        const clearButton = document.createElement('button');
        clearButton.textContent = 'Clear Weapons';
        clearButton.style.display = 'block';
        clearButton.style.margin = '10px 0 5px';
        clearButton.style.padding = '5px 10px';
        clearButton.style.backgroundColor = '#f44336';
        clearButton.style.color = 'white';
        clearButton.style.border = 'none';
        clearButton.style.borderRadius = '3px';
        clearButton.style.cursor = 'pointer';

        clearButton.addEventListener('click', () => {
            const hero = this.game.entities.hero;
            if (hero && hero.combat && hero.combat.weapons) {
                hero.combat.weapons.clear();
                console.log('Cleared all weapons');
            }
        });

        clearButton.addEventListener('mouseover', () => {
            clearButton.style.backgroundColor = '#d32f2f';
        });

        clearButton.addEventListener('mouseout', () => {
            clearButton.style.backgroundColor = '#f44336';
        });

        container.appendChild(clearButton);

        document.body.appendChild(container);
    }
}