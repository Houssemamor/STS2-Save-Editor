import { dataStore } from './data-store.js';
import { SAFE_LIMITS, addPrefix, stripPrefix } from './constants.js';
import { resolveImageUrl, showToast, formatDescription, bindEntryTooltip } from './utils.js';
import { itemBrowser } from './item-browser.js';

export class RelicEditor {
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
        if (!this.player.relics) this.player.relics = [];

        const section = document.createElement('section');
        section.className = 'editor-section';

        const header = document.createElement('div');
        header.className = 'section-header';

        const count = this.player.relics.length;
        const limit = SAFE_LIMITS.relics;
        const countClass = count >= limit ? 'count at-limit' : 'count';

        header.innerHTML = `
            <h3>Relics <span class="${countClass}">(${count}/${limit})</span></h3>
            <button class="btn btn-add">+ Add Relic</button>
        `;

        header.querySelector('.btn-add').addEventListener('click', () => this.openBrowser());

        const list = document.createElement('div');
        list.className = 'item-list relic-list';

        if (this.player.relics.length === 0) {
            list.innerHTML = '<div class="empty-state">No relics</div>';
        } else {
            this.player.relics.forEach((relic, i) => {
                list.appendChild(this.createRelicEntry(relic, i));
            });
        }

        section.appendChild(header);
        section.appendChild(list);
        this.container.appendChild(section);

        this.sectionEl = section;
    }

    createRelicEntry(relic, index) {
        const dataId = stripPrefix(relic.id, 'relic');
        const relicData = dataStore.getRelic(dataId);

        const entry = document.createElement('div');
        entry.className = 'item-entry';

        const imgUrl = relicData ? resolveImageUrl(relicData.image_url) : null;
        const name = relicData ? relicData.name : relic.id;
        const hasProps = relic.props && Object.keys(relic.props).length > 0;

        let metaHtml = '';
        if (relicData) {
            const badges = [];
            if (relicData.rarity) badges.push(`<span class="badge badge-rarity-${relicData.rarity.toLowerCase()}">${relicData.rarity}</span>`);
            if (relicData.pool) badges.push(`<span class="badge badge-type">${relicData.pool}</span>`);
            if (hasProps) badges.push(`<span class="badge badge-props">props</span>`);
            metaHtml = badges.join(' ');
        } else {
            metaHtml = '<span class="item-unknown">Unknown relic</span>';
        }

        entry.innerHTML = `
            ${imgUrl ? `<img class="item-img" src="${imgUrl}" alt="${name}" loading="lazy">` : '<div class="item-img"></div>'}
            <div class="item-info">
                <div class="item-name">${name}</div>
                <div class="item-meta">${metaHtml}</div>
            </div>
        `;

        // Tooltip with description
        if (relicData && relicData.description) {
            bindEntryTooltip(entry, formatDescription(relicData.description));
        }

        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn btn-danger';
        removeBtn.textContent = '\u00D7';
        removeBtn.title = 'Remove relic';
        removeBtn.addEventListener('click', () => {
            this.player.relics.splice(index, 1);
            this.refresh();
            showToast(`Removed ${name}`, 'info');
        });
        entry.appendChild(removeBtn);

        return entry;
    }

    openBrowser() {
        if (this.player.relics.length >= SAFE_LIMITS.relics) {
            showToast(`Relics at safe limit (${SAFE_LIMITS.relics})`, 'warning');
            return;
        }

        // Map character color to pool name for relics
        const poolFilter = this.characterColor;

        itemBrowser.open('relic', {
            characterColor: poolFilter,
            onSelect: (relicData) => {
                const floor = this.saveManager.getCurrentFloor();
                const newRelic = {
                    floor_added_to_deck: floor,
                    id: addPrefix(relicData.id, 'relic')
                };
                this.player.relics.push(newRelic);
                this.refresh();
                showToast(`Added ${relicData.name}`, 'success');
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
