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

        const deckGroups = this.getDeckGroups();

        if (deckGroups.length === 0) {
            list.innerHTML = '<div class="empty-state">No cards in deck</div>';
        } else {
            deckGroups.forEach(group => {
                list.appendChild(this.createCardEntry(group));
            });
        }

        section.appendChild(header);
        section.appendChild(list);
        this.container.appendChild(section);

        this.sectionEl = section;
        this.listEl = list;
        this.headerEl = header;
    }

    getDeckGroups() {
        const groups = new Map();

        this.player.deck.forEach((card, index) => {
            const key = this.getCardGroupKey(card);
            if (!groups.has(key)) {
                groups.set(key, {
                    key,
                    cards: [],
                    indices: []
                });
            }

            const group = groups.get(key);
            group.cards.push(card);
            group.indices.push(index);
        });

        return Array.from(groups.values());
    }

    getCardGroupKey(card) {
        const normalizedProps = this.normalizeObject(card.props || null);
        const upgradeLevel = card.current_upgrade_level || 0;
        return `${card.id}|${upgradeLevel}|${JSON.stringify(normalizedProps)}`;
    }

    normalizeObject(value) {
        if (Array.isArray(value)) {
            return value.map(item => this.normalizeObject(item));
        }

        if (value && typeof value === 'object') {
            const normalized = {};
            Object.keys(value)
                .sort()
                .forEach(key => {
                    normalized[key] = this.normalizeObject(value[key]);
                });
            return normalized;
        }

        return value;
    }

    addCardFromGroup(group) {
        if (this.player.deck.length >= SAFE_LIMITS.deck) {
            showToast(`Deck is at the safe limit (${SAFE_LIMITS.deck})`, 'warning');
            return;
        }

        // Clone the card shape so card flags (upgrade/props) are preserved for the new copy.
        const source = group.cards[0];
        const clonedCard = JSON.parse(JSON.stringify(source));
        this.player.deck.push(clonedCard);
        this.refresh();

        const dataId = stripPrefix(source.id, 'card');
        const cardData = dataStore.getCard(dataId);
        const name = cardData ? cardData.name : source.id;
        showToast(`Added ${name}`, 'success');
    }

    removeCardFromGroup(group) {
        if (group.indices.length === 0) return;

        const removeIndex = group.indices[group.indices.length - 1];
        const card = this.player.deck[removeIndex];
        const dataId = stripPrefix(card.id, 'card');
        const cardData = dataStore.getCard(dataId);
        const name = cardData ? cardData.name : card.id;

        this.player.deck.splice(removeIndex, 1);
        this.refresh();
        showToast(`Removed ${name}`, 'info');
    }

    toggleUpgradeGroup(group, shouldUpgrade) {
        let changed = 0;

        group.indices.forEach(index => {
            const card = this.player.deck[index];
            if (!card) return;

            if (shouldUpgrade) {
                if ((card.current_upgrade_level || 0) === 0) {
                    card.current_upgrade_level = 1;
                    changed++;
                }
            } else if ((card.current_upgrade_level || 0) > 0) {
                delete card.current_upgrade_level;
                changed++;
            }
        });

        if (changed > 0) this.refresh();
    }

    createCardEntry(group) {
        const sample = group.cards[0];
        const quantity = group.cards.length;
        const dataId = stripPrefix(sample.id, 'card');
        const cardData = dataStore.getCard(dataId);

        const entry = document.createElement('div');
        entry.className = 'item-entry';

        const imgUrl = cardData ? resolveImageUrl(cardData.image_url) : null;
        const name = cardData ? cardData.name : sample.id;
        const isUpgraded = (sample.current_upgrade_level || 0) > 0;
        const hasProps = sample.props && Object.keys(sample.props).length > 0;
        const hasUpgradeData = cardData && cardData.upgrade && Object.keys(cardData.upgrade).length > 0;

        let metaHtml = '';
        if (cardData) {
            const badges = [];
            if (cardData.type) badges.push(`<span class="badge badge-type">${cardData.type}</span>`);
            if (cardData.rarity) badges.push(`<span class="badge badge-rarity-${cardData.rarity.toLowerCase()}">${cardData.rarity}</span>`);
            if (isUpgraded) badges.push(`<span class="badge badge-upgraded">+${sample.current_upgrade_level}</span>`);
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
            <div class="deck-stack-controls">
                <button class="btn-stack-qty" data-action="subtract" title="Remove one copy">-</button>
                <span class="deck-stack-count" title="Number of copies">x${quantity}</span>
                <button class="btn-stack-qty" data-action="add" title="Add one copy"${this.player.deck.length >= SAFE_LIMITS.deck ? ' disabled' : ''}>+</button>
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
                this.toggleUpgradeGroup(group, !isUpgraded);
            });
            entry.appendChild(upgradeBtn);
        }

        const subtractBtn = entry.querySelector('[data-action="subtract"]');
        const addBtn = entry.querySelector('[data-action="add"]');

        subtractBtn.addEventListener('click', () => this.removeCardFromGroup(group));
        addBtn.addEventListener('click', () => this.addCardFromGroup(group));

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
            keepOpenOnSelect: true,
            onSelect: (cardData) => {
                if (this.player.deck.length >= SAFE_LIMITS.deck) {
                    showToast(`Deck is at the safe limit (${SAFE_LIMITS.deck})`, 'warning');
                    itemBrowser.close();
                    return;
                }

                const floor = this.saveManager.getCurrentFloor();
                const newCard = {
                    floor_added_to_deck: floor,
                    id: addPrefix(cardData.id, 'card')
                };
                this.player.deck.push(newCard);
                this.refresh();
                showToast(`Added ${cardData.name}`, 'success');

                if (this.player.deck.length >= SAFE_LIMITS.deck) {
                    showToast(`Deck reached safe limit (${SAFE_LIMITS.deck})`, 'info');
                    itemBrowser.close();
                }
            }
        });
    }

    refresh() {
        const pageScrollY = window.scrollY;
        const listScrollTop = this.listEl ? this.listEl.scrollTop : 0;

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

        window.scrollTo(0, pageScrollY);
        if (this.listEl) {
            this.listEl.scrollTop = listScrollTop;
        }
    }
}
