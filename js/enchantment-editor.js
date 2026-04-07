import { enchantmentManager } from './enchantment-manager.js';
import { formatDescription, showToast, bindEntryTooltip } from './utils.js';
import { ID_PREFIXES, stripPrefix } from './constants.js';

/**
 * EnchantmentEditor provides a modal UI for editing card enchantments.
 * Responsibility: Modal rendering, enchantment browser, amount control, save callback.
 * Pattern: Strategy (stackable vs non-stackable) + Adapter (card group → normalized context).
 */
class EnchantmentEditorClass {
    constructor() {
        this.modal = document.getElementById('enchantment-editor-modal');
        this.modalContent = document.getElementById('enchantment-editor-content');
        this.closeBtn = document.getElementById('enchantment-editor-close');
        this.currentEnchantmentDisplay = document.getElementById('enchantment-editor-current');
        this.amountControl = document.getElementById('enchantment-editor-amount');
        this.amountSlider = document.getElementById('enchantment-editor-amount-slider');
        this.amountValue = document.getElementById('enchantment-editor-amount-value');
        this.searchInput = document.getElementById('enchantment-editor-search');
        this.grid = document.getElementById('enchantment-editor-grid');

        this.cardGroup = null;
        this.cardData = null;
        this.currentEnchantment = null;
        this.onSave = null;

        this.setupEventListeners();
    }

    /**
     * Setup modal and control event listeners.
     */
    setupEventListeners() {
        this.closeBtn.addEventListener('click', () => this.close());

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('visible')) {
                this.close();
            }
        });

        // Amount slider - save changes as user drags
        this.amountSlider.addEventListener('input', (e) => {
            this.handleAmountChange(e);
        });

        // Search input (debounce)
        let searchTimer;
        this.searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => this.renderEnchantmentGrid(), 150);
        });
    }

    /**
     * Open enchantment editor modal for a card group.
     * @param {Object} cardGroup - Card group with cards array
     * @param {Object} cardData - Card data from dataStore
     * @param {Function} onSave - Callback when enchantment is saved
     */
    open(cardGroup, cardData, onSave) {
        this.cardGroup = cardGroup;
        this.cardData = cardData;
        this.onSave = onSave;

        // Get current enchantment from first card in group
        const sample = cardGroup.cards[0];
        this.currentEnchantment = sample.enchantment || null;

        // Render modal sections
        this.renderHeader();
        this.renderCurrentEnchantment();
        this.renderEnchantmentGrid();

        this.modal.classList.add('visible');
        this.searchInput.focus();
    }

    /**
     * Close modal without saving.
     */
    close() {
        this.modal.classList.remove('visible');
        this.cardGroup = null;
        this.cardData = null;
        this.currentEnchantment = null;
        this.onSave = null;
        this.searchInput.value = '';
    }

    /**
     * Render modal header with card name.
     */
    renderHeader() {
        const cardName = this.cardData ? this.cardData.name : 'Unknown Card';
        const header = this.modal.querySelector('.modal-header span');
        if (header) {
            header.textContent = `Edit Enchantments: ${cardName}`;
        }
    }

    /**
     * Render current enchantment display section.
     */
    renderCurrentEnchantment() {
        if (!this.currentEnchantment || !this.currentEnchantment.id) {
            this.currentEnchantmentDisplay.innerHTML = `
                <div class="enchantment-empty">
                    <span>No enchantment</span>
                </div>
            `;
            this.amountControl.classList.add('hidden');
            return;
        }

        const enchantment = enchantmentManager.getEnchantmentById(this.currentEnchantment.id);
        if (!enchantment) {
            this.currentEnchantmentDisplay.innerHTML = `
                <div class="enchantment-empty">
                    <span>Unknown enchantment: ${this.currentEnchantment.id}</span>
                </div>
            `;
            this.amountControl.classList.add('hidden');
            return;
        }

        const imgUrl = enchantmentManager.getEnchantmentImageUrl(enchantment.id);
        const fallbackUrl = enchantmentManager.getFallbackImageUrl();
        const isStackable = enchantmentManager.isStackable(enchantment.id);
        const amount = this.currentEnchantment.amount || 1;

        // Render current enchantment with icon and remove button
        this.currentEnchantmentDisplay.innerHTML = `
            <div class="enchantment-current-item">
                <img src="${imgUrl}" alt="${enchantment.name}" class="enchantment-icon" loading="lazy" onerror="this.src='${fallbackUrl}'">
                <div class="enchantment-current-info">
                    <div class="enchantment-current-name">${enchantment.name}</div>
                    <div class="enchantment-current-desc">${formatDescription(enchantment.description || '')}</div>
                </div>
                <button class="btn btn-remove-enchantment" title="Remove enchantment">Remove</button>
            </div>
        `;

        // Handle remove button
        this.currentEnchantmentDisplay.querySelector('.btn-remove-enchantment').addEventListener('click', () => {
            this.removeEnchantment();
        });

        // Show amount control for all enchantments (user can set amounts 1-20)
        // The slider allows adjustment even if is_stackable is false
        this.amountSlider.value = amount;
        this.amountValue.textContent = amount;
        this.amountControl.classList.remove('hidden');
    }

    /**
     * Render enchantment browser grid.
     */
    renderEnchantmentGrid() {
        const query = this.searchInput.value.trim();
        const allEnchantments = enchantmentManager.search(query);

        if (!allEnchantments || allEnchantments.length === 0) {
            this.grid.innerHTML = '<div class="enchantment-empty">No enchantments available</div>';
            return;
        }

        // Filter out current enchantment if it exists
        // Strip prefix from current enchantment ID for comparison with data IDs
        const currentDataId = this.currentEnchantment 
            ? stripPrefix(this.currentEnchantment.id, 'enchantment')
            : null;
        const enchantmentsToShow = currentDataId
            ? allEnchantments.filter(e => e.id !== currentDataId)
            : allEnchantments;

        if (enchantmentsToShow.length === 0) {
            this.grid.innerHTML = '<div class="enchantment-empty">All enchantments already applied or no matches</div>';
            return;
        }

        this.grid.innerHTML = '';

        enchantmentsToShow.forEach(enchantment => {
            const item = this.createEnchantmentGridItem(enchantment);
            if (item) {
                this.grid.appendChild(item);
            }
        });
    }

    /**
     * Create a single enchantment grid item.
     */
    createEnchantmentGridItem(enchantment) {
        if (!enchantment || !enchantment.id) {
            console.warn('Invalid enchantment data:', enchantment);
            return null;
        }

        const item = document.createElement('div');
        item.className = 'enchantment-grid-item';

        const imgUrl = enchantmentManager.getEnchantmentImageUrl(enchantment.id);
        const fallbackUrl = enchantmentManager.getFallbackImageUrl();
        const isStackable = enchantmentManager.isStackable(enchantment.id);
        const name = enchantment.name || enchantment.id;

        item.innerHTML = `
            <div class="enchantment-item-image">
                <img src="${imgUrl}" alt="${name}" loading="lazy" onerror="this.src='${fallbackUrl}'">
            </div>
            <div class="enchantment-item-name">${name}</div>
            ${isStackable ? '<div class="enchantment-item-badge">Stackable</div>' : ''}
        `;

        // Tooltip with full description
        bindEntryTooltip(item, `<strong>${name}</strong><br>${formatDescription(enchantment.description || '')}`);

        // Click handler: select this enchantment
        item.addEventListener('click', () => {
            this.selectEnchantment(enchantment);
        });

        return item;
    }

    /**
     * Handle amount slider change - updates value display and modifies enchantment amount.
     */
    handleAmountChange(e) {
        const newAmount = parseInt(e.target.value, 10);
        this.amountValue.textContent = newAmount;

        // Update enchantment amount on all cards
        if (this.currentEnchantment && this.currentEnchantment.id) {
            this.currentEnchantment.amount = newAmount;
            this.cardGroup.cards.forEach(card => {
                if (card.enchantment && card.enchantment.id === this.currentEnchantment.id) {
                    card.enchantment.amount = newAmount;
                }
            });

            // Trigger callback for live updates
            if (this.onSave) {
                this.onSave(this.cardGroup, this.currentEnchantment);
            }
        }
    }

    /**
     * Select an enchantment and apply it to the card group.
     * For stackable enchantments, sets default amount to 1 and shows slider for adjustment.
     */
    /**
     * Select an enchantment and apply it to the card group.
     * For stackable enchantments, sets default amount to 1 and shows slider for adjustment.
     */
    selectEnchantment(enchantment) {
        if (!enchantment || !enchantment.id) {
            showToast('Invalid enchantment selected', 'warning');
            return;
        }

        const isStackable = enchantmentManager.isStackable(enchantment.id);
        const defaultAmount = 1;

        // Apply enchantment to all cards in group
        // Add prefix for save file format (SLITHER -> ENCHANTMENT.SLITHER)
        const prefixedId = `${ID_PREFIXES.enchantment}${enchantment.id}`;
        const newEnchantment = {
            id: prefixedId,
            ...(isStackable && { amount: defaultAmount })
        };

        this.cardGroup.cards.forEach(card => {
            card.enchantment = newEnchantment;
        });

        // Update state and UI
        this.currentEnchantment = newEnchantment;
        this.renderCurrentEnchantment();
        this.renderEnchantmentGrid();

        // Trigger callback
        if (this.onSave) {
            this.onSave(this.cardGroup, newEnchantment);
        }

        const amountText = isStackable ? ` (×${defaultAmount})` : '';
        showToast(`Applied ${enchantment.name}${amountText}`, 'success');
    }

    /**
     * Remove current enchantment from card group.
     */
    removeEnchantment() {
        if (!this.currentEnchantment || !this.currentEnchantment.id) {
            showToast('No enchantment to remove', 'info');
            return;
        }

        const enchantmentName = enchantmentManager.getEnchantmentLabel(this.currentEnchantment);

        this.cardGroup.cards.forEach(card => {
            delete card.enchantment;
        });

        this.currentEnchantment = null;
        this.renderCurrentEnchantment();
        this.renderEnchantmentGrid();

        // Trigger callback
        if (this.onSave) {
            this.onSave(this.cardGroup, null);
        }

        showToast(`Removed ${enchantmentName}`, 'info');
    }
}

// Singleton instance
export const enchantmentEditor = new EnchantmentEditorClass();
