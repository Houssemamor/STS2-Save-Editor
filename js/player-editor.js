import { dataStore } from './data-store.js';
import { SAFE_LIMITS, CHARACTER_COLORS, getCharacterKey } from './constants.js';
import { getCharacterIconUrl, showToast } from './utils.js';
import { DeckEditor } from './deck-editor.js';
import { RelicEditor } from './relic-editor.js';
import { PotionEditor } from './potion-editor.js';

export class PlayerEditor {
    constructor(saveManager) {
        this.saveManager = saveManager;
        this.tabsEl = document.getElementById('player-tabs');
        this.panelsEl = document.getElementById('player-panels');
        this.activeIndex = 0;
    }

    render() {
        this.tabsEl.innerHTML = '';
        this.panelsEl.innerHTML = '';

        const count = this.saveManager.getPlayerCount();

        for (let i = 0; i < count; i++) {
            const player = this.saveManager.getPlayer(i);
            this.createTab(i, player);
            this.createPanel(i, player);
        }

        this.switchToPlayer(0);
    }

    updateFaviconForPlayer(index) {
        const player = this.saveManager.getPlayer(index);
        if (!player || !player.character_id) return;

        const charKey = getCharacterKey(player.character_id);
        const iconHref = getCharacterIconUrl(charKey);

        let faviconEl = document.querySelector('link[rel="icon"]');
        if (!faviconEl) {
            faviconEl = document.createElement('link');
            faviconEl.setAttribute('rel', 'icon');
            faviconEl.setAttribute('type', 'image/png');
            document.head.appendChild(faviconEl);
        }

        faviconEl.setAttribute('href', iconHref);
    }

    createTab(index, player) {
        const charKey = getCharacterKey(player.character_id);
        const char = dataStore.getCharacterBySaveId(player.character_id);
        const name = char ? char.name : charKey;
        const iconUrl = getCharacterIconUrl(charKey);
        const colorInfo = CHARACTER_COLORS[charKey];

        const tab = document.createElement('div');
        tab.className = 'player-tab';
        tab.dataset.index = index;

        tab.innerHTML = `
            <img class="tab-icon" src="${iconUrl}" alt="${name}" onerror="this.style.display='none'">
            <span>${name}</span>
        `;

        if (colorInfo) {
            tab.style.setProperty('--tab-color', colorInfo.css);
        }

        tab.addEventListener('click', () => this.switchToPlayer(index));
        this.tabsEl.appendChild(tab);
    }

    createPanel(index, player) {
        const charKey = getCharacterKey(player.character_id);
        const char = dataStore.getCharacterBySaveId(player.character_id);
        const name = char ? char.name : charKey;
        const iconUrl = getCharacterIconUrl(charKey);

        const panel = document.createElement('div');
        panel.className = 'player-panel';
        panel.dataset.index = index;

        // Player header
        const header = document.createElement('div');
        header.className = 'player-header';
        header.innerHTML = `
            <img class="char-icon" src="${iconUrl}" alt="${name}" onerror="this.style.display='none'">
            <h2>${name}</h2>
        `;
        panel.appendChild(header);

        // Stats grid
        const statsGrid = document.createElement('div');
        statsGrid.className = 'stats-grid';

        const stats = [
            { field: 'current_hp', label: 'Current HP', min: 1, max: SAFE_LIMITS.max_hp },
            { field: 'max_hp', label: 'Max HP', min: 1, max: SAFE_LIMITS.max_hp },
            { field: 'gold', label: 'Gold', min: 0, max: SAFE_LIMITS.gold },
            { field: 'max_energy', label: 'Max Energy', min: 1, max: SAFE_LIMITS.max_energy },
            { field: 'max_potion_slot_count', label: 'Potion Slots', min: 0, max: SAFE_LIMITS.potion_slots },
            { field: 'base_orb_slot_count', label: 'Orb Slots', min: 0, max: 10 }
        ];

        stats.forEach(stat => {
            const field = document.createElement('div');
            field.className = 'stat-field';

            const label = document.createElement('label');
            label.textContent = stat.label;
            label.setAttribute('for', `stat-${index}-${stat.field}`);

            const input = document.createElement('input');
            input.type = 'number';
            input.id = `stat-${index}-${stat.field}`;
            input.min = stat.min;
            input.max = stat.max;
            input.value = player[stat.field] ?? 0;

            input.addEventListener('change', () => {
                let val = parseInt(input.value, 10);
                if (isNaN(val)) val = stat.min;
                val = Math.max(stat.min, Math.min(stat.max, val));
                input.value = val;
                player[stat.field] = val;

                // Auto-cap current_hp to max_hp
                if (stat.field === 'max_hp' && player.current_hp > val) {
                    player.current_hp = val;
                    const hpInput = document.getElementById(`stat-${index}-current_hp`);
                    if (hpInput) hpInput.value = val;
                }

                // Refresh potion editor when slots change
                if (stat.field === 'max_potion_slot_count' && this.potionEditors && this.potionEditors[index]) {
                    this.potionEditors[index].refresh();
                }

                // Validate
                if (val > stat.max) {
                    input.classList.add('invalid');
                } else {
                    input.classList.remove('invalid');
                }
            });

            field.appendChild(label);
            field.appendChild(input);
            statsGrid.appendChild(field);
        });

        panel.appendChild(statsGrid);

        // Deck editor
        new DeckEditor(index, player, panel, this.saveManager);

        // Relic editor
        new RelicEditor(index, player, panel, this.saveManager);

        // Potion editor
        const potionEditor = new PotionEditor(index, player, panel, this.saveManager);
        this.potionEditors = this.potionEditors || {};
        this.potionEditors[index] = potionEditor;

        this.panelsEl.appendChild(panel);
    }

    switchToPlayer(index) {
        this.activeIndex = index;

        this.tabsEl.querySelectorAll('.player-tab').forEach(tab => {
            tab.classList.toggle('active', parseInt(tab.dataset.index) === index);
        });

        this.panelsEl.querySelectorAll('.player-panel').forEach(panel => {
            panel.classList.toggle('active', parseInt(panel.dataset.index) === index);
        });

        this.updateFaviconForPlayer(index);
    }
}
