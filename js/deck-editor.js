import { dataStore } from './data-store.js';
import { SAFE_LIMITS, addPrefix, stripPrefix } from './constants.js';
import { resolveImageUrl, showToast, getCardDescription, bindEntryTooltip } from './utils.js';
import { itemBrowser } from './item-browser.js';

export class DeckEditor {
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
        if (!this.player.deck) this.player.deck = [];

        const section = document.createElement('section');
        section.className = 'editor-section';

        const header = document.createElement('div');
        header.className = 'section-header';

        const count = this.player.deck.length;
        const limit = SAFE_LIMITS.deck;
        const countClass = count >= limit ? 'count at-limit' : 'count';

        const allUpgradeable = this.player.deck.filter(card => {
            const dataId = stripPrefix(card.id, 'card');
            const cd = dataStore.getCard(dataId);
            return cd && cd.upgrade && Object.keys(cd.upgrade).length > 0;
        });
        const allUpgraded = allUpgradeable.length > 0 && allUpgradeable.every(c => (c.current_upgrade_level || 0) > 0);
        const anyUpgraded = allUpgradeable.some(c => (c.current_upgrade_level || 0) > 0);

        header.innerHTML = `
            <h3>Deck <span class="${countClass}">(${count}/${limit})</span></h3>
            <div class="section-actions">
                <button class="btn btn-upgrade-all"${allUpgradeable.length === 0 || allUpgraded ? ' disabled' : ''}>Upgrade All</button>
                <button class="btn btn-downgrade-all"${!anyUpgraded ? ' disabled' : ''}>Downgrade All</button>
                <button class="btn btn-add">+ Add Card</button>
            </div>
        `;

        header.querySelector('.btn-add').addEventListener('click', () => this.openBrowser());
        header.querySelector('.btn-upgrade-all').addEventListener('click', () => this.upgradeAll());
        header.querySelector('.btn-downgrade-all').addEventListener('click', () => this.downgradeAll());

        const list = document.createElement('div');
        list.className = 'item-list deck-list';

        if (this.player.deck.length === 0) {
            list.innerHTML = '<div class="empty-state">No cards in deck</div>';
        } else {
            this.player.deck.forEach((card, i) => {
                list.appendChild(this.createCardEntry(card, i));
            });
        }

        section.appendChild(header);
        section.appendChild(list);
        this.container.appendChild(section);

        this.sectionEl = section;
        this.listEl = list;
        this.headerEl = header;
    }

    createCardEntry(card, index) {
        const dataId = stripPrefix(card.id, 'card');
        const cardData = dataStore.getCard(dataId);

        const entry = document.createElement('div');
        entry.className = 'item-entry';

        const imgUrl = cardData ? resolveImageUrl(cardData.image_url) : null;
        const name = cardData ? cardData.name : card.id;
        const isUpgraded = (card.current_upgrade_level || 0) > 0;
        const hasProps = card.props && Object.keys(card.props).length > 0;
        const hasUpgradeData = cardData && cardData.upgrade && Object.keys(cardData.upgrade).length > 0;

        let metaHtml = '';
        if (cardData) {
            const badges = [];
            if (cardData.type) badges.push(`<span class="badge badge-type">${cardData.type}</span>`);
            if (cardData.rarity) badges.push(`<span class="badge badge-rarity-${cardData.rarity.toLowerCase()}">${cardData.rarity}</span>`);
            if (isUpgraded) badges.push(`<span class="badge badge-upgraded">+${card.current_upgrade_level}</span>`);
            if (hasProps) badges.push(`<span class="badge badge-props">props</span>`);
            metaHtml = badges.join(' ');
        } else {
            metaHtml = '<span class="item-unknown">Unknown card</span>';
        }

        entry.innerHTML = `
            ${imgUrl ? `<img class="item-img" src="${imgUrl}" alt="${name}" loading="lazy">` : '<div class="item-img"></div>'}
            <div class="item-info">
                <div class="item-name">${name}${isUpgraded ? '+' : ''}</div>
                <div class="item-meta">${metaHtml}</div>
            </div>
        `;

        // Tooltip with description (upgraded if applicable)
        const desc = getCardDescription(cardData, isUpgraded);
        if (desc) bindEntryTooltip(entry, desc);

        // Upgrade button
        if (hasUpgradeData) {
            const upgradeBtn = document.createElement('button');
            upgradeBtn.className = `btn-upgrade${isUpgraded ? ' upgraded' : ''}`;
            upgradeBtn.textContent = isUpgraded ? 'Downgrade' : 'Upgrade';
            upgradeBtn.addEventListener('click', () => {
                if (isUpgraded) {
                    delete card.current_upgrade_level;
                } else {
                    card.current_upgrade_level = 1;
                }
                this.refresh();
            });
            entry.appendChild(upgradeBtn);
        }

        // Remove button
        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn btn-danger';
        removeBtn.textContent = '\u00D7';
        removeBtn.title = 'Remove card';
        removeBtn.addEventListener('click', () => {
            this.player.deck.splice(index, 1);
            this.refresh();
            showToast(`Removed ${name}`, 'info');
        });
        entry.appendChild(removeBtn);

        return entry;
    }

    upgradeAll() {
        let count = 0;
        this.player.deck.forEach(card => {
            if ((card.current_upgrade_level || 0) > 0) return;
            const dataId = stripPrefix(card.id, 'card');
            const cd = dataStore.getCard(dataId);
            if (cd && cd.upgrade && Object.keys(cd.upgrade).length > 0) {
                card.current_upgrade_level = 1;
                count++;
            }
        });
        if (count > 0) {
            this.refresh();
            showToast(`Upgraded ${count} card${count !== 1 ? 's' : ''}`, 'success');
        }
    }

    downgradeAll() {
        let count = 0;
        this.player.deck.forEach(card => {
            if ((card.current_upgrade_level || 0) > 0) {
                delete card.current_upgrade_level;
                count++;
            }
        });
        if (count > 0) {
            this.refresh();
            showToast(`Downgraded ${count} card${count !== 1 ? 's' : ''}`, 'info');
        }
    }

    openBrowser() {
        if (this.player.deck.length >= SAFE_LIMITS.deck) {
            showToast(`Deck is at the safe limit (${SAFE_LIMITS.deck})`, 'warning');
            return;
        }

        itemBrowser.open('card', {
            characterColor: this.characterColor,
            onSelect: (cardData) => {
                const floor = this.saveManager.getCurrentFloor();
                const newCard = {
                    floor_added_to_deck: floor,
                    id: addPrefix(cardData.id, 'card')
                };
                this.player.deck.push(newCard);
                this.refresh();
                showToast(`Added ${cardData.name}`, 'success');
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
