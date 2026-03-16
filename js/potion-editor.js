import { dataStore } from './data-store.js';
import { SAFE_LIMITS, addPrefix, stripPrefix } from './constants.js';
import { resolveImageUrl, showToast } from './utils.js';
import { itemBrowser } from './item-browser.js';

export class PotionEditor {
    constructor(playerIndex, player, container, saveManager) {
        this.playerIndex = playerIndex;
        this.player = player;
        this.container = container;
        this.saveManager = saveManager;
        this.characterColor = this.getCharacterColor();
        this.render();
    }

    getCharacterColor() {
        const char = dataStore.getCharacterBySaveId(this.player.character_id);
        return char ? char.color : null;
    }

    render() {
        if (!this.player.potions) this.player.potions = [];

        const section = document.createElement('section');
        section.className = 'editor-section';

        const header = document.createElement('div');
        header.className = 'section-header';

        const count = this.player.potions.length;
        const maxSlots = this.player.max_potion_slot_count || 3;
        const limit = Math.min(SAFE_LIMITS.potions, maxSlots);
        const countClass = count >= limit ? 'count at-limit' : 'count';

        header.innerHTML = `
            <h3>Potions <span class="${countClass}">(${count}/${limit})</span></h3>
            <button class="btn btn-add">+ Add Potion</button>
        `;

        header.querySelector('.btn-add').addEventListener('click', () => this.openBrowser());

        const list = document.createElement('div');
        list.className = 'item-list potion-list';

        if (this.player.potions.length === 0) {
            list.innerHTML = '<div class="empty-state">No potions</div>';
        } else {
            this.player.potions.forEach((potion, i) => {
                list.appendChild(this.createPotionEntry(potion, i));
            });
        }

        section.appendChild(header);
        section.appendChild(list);
        this.container.appendChild(section);

        this.sectionEl = section;
    }

    createPotionEntry(potion, index) {
        const dataId = stripPrefix(potion.id, 'potion');
        const potionData = dataStore.getPotion(dataId);

        const entry = document.createElement('div');
        entry.className = 'item-entry';

        const imgUrl = potionData ? resolveImageUrl(potionData.image_url) : null;
        const name = potionData ? potionData.name : potion.id;

        let metaHtml = '';
        if (potionData) {
            const badges = [];
            badges.push(`<span class="badge badge-type">Slot ${potion.slot_index}</span>`);
            if (potionData.rarity) badges.push(`<span class="badge badge-rarity-${potionData.rarity.toLowerCase()}">${potionData.rarity}</span>`);
            metaHtml = badges.join(' ');
        } else {
            metaHtml = `<span class="badge badge-type">Slot ${potion.slot_index}</span> <span class="item-unknown">Unknown potion</span>`;
        }

        entry.innerHTML = `
            ${imgUrl ? `<img class="item-img" src="${imgUrl}" alt="${name}" loading="lazy">` : '<div class="item-img"></div>'}
            <div class="item-info">
                <div class="item-name">${name}</div>
                <div class="item-meta">${metaHtml}</div>
            </div>
        `;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn btn-danger';
        removeBtn.textContent = '\u00D7';
        removeBtn.title = 'Remove potion';
        removeBtn.addEventListener('click', () => {
            this.player.potions.splice(index, 1);
            this.refresh();
            showToast(`Removed ${name}`, 'info');
        });
        entry.appendChild(removeBtn);

        return entry;
    }

    getNextSlotIndex() {
        const usedSlots = new Set((this.player.potions || []).map(p => p.slot_index));
        const maxSlots = this.player.max_potion_slot_count || 3;
        for (let i = 0; i < maxSlots; i++) {
            if (!usedSlots.has(i)) return i;
        }
        return this.player.potions.length;
    }

    openBrowser() {
        const maxSlots = this.player.max_potion_slot_count || 3;
        const limit = Math.min(SAFE_LIMITS.potions, maxSlots);

        if (this.player.potions.length >= limit) {
            showToast(`Potions at limit (${limit})`, 'warning');
            return;
        }

        const poolFilter = this.characterColor;

        itemBrowser.open('potion', {
            characterColor: poolFilter,
            onSelect: (potionData) => {
                const newPotion = {
                    id: addPrefix(potionData.id, 'potion'),
                    slot_index: this.getNextSlotIndex()
                };
                this.player.potions.push(newPotion);
                this.refresh();
                showToast(`Added ${potionData.name}`, 'success');
            }
        });
    }

    refresh() {
        const parent = this.sectionEl.parentNode;
        const next = this.sectionEl.nextSibling;
        this.sectionEl.remove();
        this.container = parent;
        this.render();
        if (next) {
            parent.insertBefore(this.sectionEl, next);
        } else {
            parent.appendChild(this.sectionEl);
        }
    }
}
