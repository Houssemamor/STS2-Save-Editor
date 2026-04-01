import { dataStore } from './data-store.js';
import { itemBrowser } from './item-browser.js';
import { formatDescription } from './utils.js';

export class ModifiersEditor {
    constructor(saveManager) {
        this.saveManager = saveManager;
        this.container = null;
        this.currentModifiers = [];
    }

    render(parentContainer) {
        this.currentModifiers = this.saveManager.getModifiers();
        this.container = document.createElement('div');
        this.container.className = 'modifiers-editor section';
        this.container.innerHTML = `
            <h3>Run Modifiers</h3>
            <div class="modifiers-controls">
                <button class="btn btn-primary" id="btn-add-modifier">+ Add Modifier</button>
                <div id="modifiers-list" class="modifiers-list"></div>
            </div>
        `;

        parentContainer.appendChild(this.container);
        this.renderModifiersList();
        this.attachListeners();
    }

    renderModifiersList() {
        const list = this.container.querySelector('#modifiers-list');
        list.innerHTML = '';

        if (this.currentModifiers.length === 0) {
            list.innerHTML = '<p class="empty-state">No modifiers added</p>';
            return;
        }

        this.currentModifiers.forEach((modifierId, index) => {
            const modifier = dataStore.getModifier(modifierId);
            if (!modifier) return;

            const item = document.createElement('div');
            item.className = 'modifier-item';
            item.innerHTML = `
                <div class="item-content">
                    <h4>${modifier.name}</h4>
                    <p class="description">${formatDescription(modifier.description)}</p>
                </div>
                <button class="btn btn-danger btn-sm" data-index="${index}">Remove</button>
            `;

            item.querySelector('button').addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.index);
                this.currentModifiers.splice(idx, 1);
                this.saveManager.setModifiers(this.currentModifiers);
                this.renderModifiersList();
            });

            list.appendChild(item);
        });
    }

    attachListeners() {
        const addBtn = this.container.querySelector('#btn-add-modifier');
        addBtn.addEventListener('click', () => this.openModifierBrowser());
    }

    openModifierBrowser() {
        itemBrowser.open('modifier', {
            onSelect: (selected) => {
                if (selected && !this.currentModifiers.includes(selected.id)) {
                    this.currentModifiers.push(selected.id);
                    this.saveManager.setModifiers(this.currentModifiers);
                    this.renderModifiersList();
                    itemBrowser.close();
                }
            }
        });
    }
}
