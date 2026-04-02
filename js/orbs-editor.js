import { dataStore } from './data-store.js';
import { itemBrowser } from './item-browser.js';
import { formatDescription } from './utils.js';

export class OrbsEditor {
    constructor(saveManager, playerIndex) {
        this.saveManager = saveManager;
        this.playerIndex = playerIndex;
        this.container = null;
        this.orbSlotCount = 0;
    }

    render(parentContainer) {
        const player = this.saveManager.getPlayer(this.playerIndex);
        
        // Only show orbs editor for Defect
        if (!player || player.character_id !== 'CHARACTER.DEFECT') {
            return;
        }

        this.orbSlotCount = this.saveManager.getOrbSlotCount(this.playerIndex);

        this.container = document.createElement('div');
        this.container.className = 'orbs-editor section';
        this.container.innerHTML = `
            <h3>Orb Slots</h3>
            <div class="orbs-controls">
                <div class="control-row">
                    <label for="orb-slots">Max Slots:</label>
                    <input 
                        type="number" 
                        id="orb-slots" 
                        min="0" 
                        max="8" 
                        value="${this.orbSlotCount}"
                        class="number-input"
                    >
                    <span class="hint">Defect can typically have 0-8 orb slots</span>
                </div>
            </div>
            <div id="orbs-list" class="orbs-list"></div>
        `;

        parentContainer.appendChild(this.container);
        this.renderOrbsList();
        this.attachListeners();
    }

    renderOrbsList() {
        const list = this.container.querySelector('#orbs-list');
        list.innerHTML = '';

        const allOrbs = dataStore.getAllOrbs();
        if (allOrbs.length === 0) {
            list.innerHTML = '<p class="empty-state">No orbs available</p>';
            return;
        }

        list.innerHTML = `<p class="info-text">Defect base orb slot count: ${this.orbSlotCount}</p>`;

        const orbsList = document.createElement('div');
        orbsList.className = 'orbs-available';

        allOrbs.forEach(orb => {
            const item = document.createElement('div');
            item.className = 'orb-info';
            item.innerHTML = `
                <h4>${orb.name}</h4>
                <p class="description">${formatDescription(orb.description)}</p>
            `;
            orbsList.appendChild(item);
        });

        list.appendChild(orbsList);
    }

    attachListeners() {
        const slotsInput = this.container.querySelector('#orb-slots');
        slotsInput?.addEventListener('change', (e) => {
            const count = Math.max(0, Math.min(8, parseInt(e.target.value) || 0));
            e.target.value = count;
            this.orbSlotCount = count;
            this.saveManager.setOrbSlotCount(this.playerIndex, count);
        });
    }
}
