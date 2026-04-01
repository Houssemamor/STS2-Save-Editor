import { dataStore } from './data-store.js';
import { formatDescription } from './utils.js';

export class AscensionEditor {
    constructor(saveManager) {
        this.saveManager = saveManager;
        this.container = null;
    }

    render(parentContainer) {
        this.container = document.createElement('div');
        this.container.className = 'ascension-editor section';
        this.container.innerHTML = `
            <h3>Ascension Level</h3>
            <div class="ascension-controls">
                <div class="control-row">
                    <label for="ascension-slider">Level:</label>
                    <input 
                        type="range" 
                        id="ascension-slider" 
                        min="0" 
                        max="20" 
                        value="${this.saveManager.getAscension()}"
                        class="slider"
                    >
                    <span id="ascension-value">${this.saveManager.getAscension()}</span>
                </div>
                <div id="ascension-description" class="item-description"></div>
            </div>
        `;

        parentContainer.appendChild(this.container);
        this.attachListeners();
        this.updateDescription();
    }

    attachListeners() {
        const slider = this.container.querySelector('#ascension-slider');
        const valueDisplay = this.container.querySelector('#ascension-value');

        slider.addEventListener('input', (e) => {
            const level = parseInt(e.target.value);
            this.saveManager.setAscension(level);
            valueDisplay.textContent = level;
            this.updateDescription();
        });
    }

    updateDescription() {
        const level = this.saveManager.getAscension();
        const descContainer = this.container.querySelector('#ascension-description');
        
        // Find ascension data by level
        const allAscensions = dataStore.getAllAscensions();
        const ascension = allAscensions.find(a => a.level === level);
        
        if (ascension && ascension.description) {
            descContainer.innerHTML = `<p>${formatDescription(ascension.description)}</p>`;
        } else {
            descContainer.innerHTML = '<p>Ascension information unavailable</p>';
        }
    }
}
