import { dataStore } from './data-store.js';
import { itemBrowser } from './item-browser.js';

export class DiscoveredItemsEditor {
    constructor(saveManager, playerIndex) {
        this.saveManager = saveManager;
        this.playerIndex = playerIndex;
        this.container = null;
        this.discoveredCards = [];
        this.discoveredRelics = [];
    }

    render(parentContainer) {
        this.discoveredCards = this.saveManager.getDiscoveredCards(this.playerIndex);
        this.discoveredRelics = this.saveManager.getDiscoveredRelics(this.playerIndex);

        this.container = document.createElement('div');
        this.container.className = 'discovered-items-editor section';
        this.container.innerHTML = `
            <h3>Discovered Items</h3>
            <div class="discovered-tabs">
                <button class="tab-btn active" data-tab="cards">Cards (${this.discoveredCards.length})</button>
                <button class="tab-btn" data-tab="relics">Relics (${this.discoveredRelics.length})</button>
            </div>
            <div id="discovered-cards-panel" class="discovered-panel active">
                <button class="btn btn-primary btn-sm" id="btn-add-card">+ Add Card</button>
                <div id="discovered-cards-list" class="items-list"></div>
            </div>
            <div id="discovered-relics-panel" class="discovered-panel">
                <button class="btn btn-primary btn-sm" id="btn-add-relic">+ Add Relic</button>
                <div id="discovered-relics-list" class="items-list"></div>
            </div>
        `;

        parentContainer.appendChild(this.container);
        this.renderLists();
        this.attachListeners();
    }

    renderLists() {
        this.renderCardsList();
        this.renderRelicsList();
    }

    renderCardsList() {
        const list = this.container.querySelector('#discovered-cards-list');
        list.innerHTML = '';

        if (this.discoveredCards.length === 0) {
            list.innerHTML = '<p class="empty-state">No cards discovered</p>';
            return;
        }

        this.discoveredCards.forEach((cardId, index) => {
            const card = dataStore.getCardBySaveId(cardId);
            if (!card) return;

            const item = document.createElement('div');
            item.className = 'discovered-item';
            item.innerHTML = `
                <span>${card.name}</span>
                <button class="btn btn-danger btn-xs" data-index="${index}" data-type="card">×</button>
            `;

            item.querySelector('button').addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.index);
                this.discoveredCards.splice(idx, 1);
                this.saveManager.setDiscoveredCards(this.playerIndex, this.discoveredCards);
                this.renderCardsList();
            });

            list.appendChild(item);
        });
    }

    renderRelicsList() {
        const list = this.container.querySelector('#discovered-relics-list');
        list.innerHTML = '';

        if (this.discoveredRelics.length === 0) {
            list.innerHTML = '<p class="empty-state">No relics discovered</p>';
            return;
        }

        this.discoveredRelics.forEach((relicId, index) => {
            const relic = dataStore.getRelicBySaveId(relicId);
            if (!relic) return;

            const item = document.createElement('div');
            item.className = 'discovered-item';
            item.innerHTML = `
                <span>${relic.name}</span>
                <button class="btn btn-danger btn-xs" data-index="${index}" data-type="relic">×</button>
            `;

            item.querySelector('button').addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.index);
                this.discoveredRelics.splice(idx, 1);
                this.saveManager.setDiscoveredRelics(this.playerIndex, this.discoveredRelics);
                this.renderRelicsList();
            });

            list.appendChild(item);
        });
    }

    attachListeners() {
        // Tab switching
        this.container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                this.container.querySelectorAll('.discovered-panel').forEach(p => p.classList.remove('active'));
                e.target.classList.add('active');
                document.getElementById(`discovered-${e.target.dataset.tab}-panel`).classList.add('active');
            });
        });

        // Add buttons
        const addCardBtn = this.container.querySelector('#btn-add-card');
        const addRelicBtn = this.container.querySelector('#btn-add-relic');

        addCardBtn?.addEventListener('click', () => this.openCardBrowser());
        addRelicBtn?.addEventListener('click', () => this.openRelicBrowser());
    }

    openCardBrowser() {
        itemBrowser.open('card', {
            onSelect: (selected) => {
                if (selected && !this.discoveredCards.includes(selected.id)) {
                    this.discoveredCards.push(selected.id);
                    this.saveManager.setDiscoveredCards(this.playerIndex, this.discoveredCards);
                    this.renderCardsList();
                    itemBrowser.close();
                }
            }
        });
    }

    openRelicBrowser() {
        itemBrowser.open('relic', {
            onSelect: (selected) => {
                if (selected && !this.discoveredRelics.includes(selected.id)) {
                    this.discoveredRelics.push(selected.id);
                    this.saveManager.setDiscoveredRelics(this.playerIndex, this.discoveredRelics);
                    this.renderRelicsList();
                    itemBrowser.close();
                }
            }
        });
    }
}
