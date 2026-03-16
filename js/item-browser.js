import { dataStore } from './data-store.js';
import { resolveImageUrl, formatDescription, debounce } from './utils.js';
import { COLOR_DISPLAY_NAMES } from './constants.js';

const PAGE_SIZE = 48;

class ItemBrowser {
    constructor() {
        this.modal = document.getElementById('item-browser-modal');
        this.grid = document.getElementById('browser-grid');
        this.titleEl = document.getElementById('browser-title');
        this.searchInput = document.getElementById('browser-search');
        this.colorSelect = document.getElementById('browser-filter-color');
        this.raritySelect = document.getElementById('browser-filter-rarity');
        this.typeSelect = document.getElementById('browser-filter-type');
        this.costSelect = document.getElementById('browser-filter-cost');
        this.closeBtn = document.getElementById('browser-close');
        this.tooltip = document.getElementById('browser-tooltip');

        this.mode = null;
        this.allItems = [];
        this.filtered = [];
        this.displayed = 0;
        this.onSelect = null;
        this.characterColor = null;
        this.keepOpenOnSelect = false;

        this.closeBtn.addEventListener('click', () => this.close());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });

        const filterHandler = debounce(() => this.applyFilters(), 200);
        this.searchInput.addEventListener('input', filterHandler);
        this.colorSelect.addEventListener('change', () => this.applyFilters());
        this.raritySelect.addEventListener('change', () => this.applyFilters());
        this.typeSelect.addEventListener('change', () => this.applyFilters());
        this.costSelect.addEventListener('change', () => this.applyFilters());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('visible')) {
                this.close();
            }
        });
    }

    open(mode, { characterColor, onSelect, keepOpenOnSelect = false }) {
        this.mode = mode;
        this.onSelect = onSelect;
        this.characterColor = characterColor;
        this.keepOpenOnSelect = keepOpenOnSelect;

        this.searchInput.value = '';

        if (mode === 'card') {
            this.titleEl.textContent = 'Add Card';
            this.allItems = dataStore.getAllCards();
            this.typeSelect.classList.remove('hidden');
            this.costSelect.classList.remove('hidden');
        } else if (mode === 'relic') {
            this.titleEl.textContent = 'Add Relic';
            this.allItems = dataStore.getAllRelics();
            this.typeSelect.classList.add('hidden');
            this.costSelect.classList.add('hidden');
        } else if (mode === 'potion') {
            this.titleEl.textContent = 'Add Potion';
            this.allItems = dataStore.getAllPotions();
            this.typeSelect.classList.add('hidden');
            this.costSelect.classList.add('hidden');
        }

        this.populateFilters();
        this.applyFilters();

        this.modal.classList.add('visible');
        this.searchInput.focus();
    }

    close() {
        this.modal.classList.remove('visible');
        this.tooltip.classList.remove('visible');
        this.onSelect = null;
        this.keepOpenOnSelect = false;
    }

    populateFilters() {
        // Color / Pool filter
        this.colorSelect.innerHTML = '<option value="">All</option>';

        if (this.mode === 'card') {
            const colors = [...new Set(this.allItems.map(i => i.color).filter(Boolean))].sort();
            this.colorSelect.querySelector('option').textContent = 'All Colors';
            colors.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c;
                opt.textContent = COLOR_DISPLAY_NAMES[c] || c;
                this.colorSelect.appendChild(opt);
            });
            // Default to character color if available
            if (this.characterColor) {
                this.colorSelect.value = this.characterColor;
            }
        } else {
            const pools = [...new Set(this.allItems.map(i => i.pool).filter(Boolean))].sort();
            this.colorSelect.querySelector('option').textContent = 'All Pools';
            pools.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p;
                opt.textContent = COLOR_DISPLAY_NAMES[p] || p;
                this.colorSelect.appendChild(opt);
            });
        }

        // Rarity filter
        this.raritySelect.innerHTML = '<option value="">All Rarities</option>';
        const rarities = [...new Set(this.allItems.map(i => i.rarity).filter(Boolean))].sort();
        rarities.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r;
            opt.textContent = r;
            this.raritySelect.appendChild(opt);
        });

        // Type filter (cards only)
        if (this.mode === 'card') {
            this.typeSelect.innerHTML = '<option value="">All Types</option>';
            const types = [...new Set(this.allItems.map(i => i.type).filter(Boolean))].sort();
            types.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t;
                opt.textContent = t;
                this.typeSelect.appendChild(opt);
            });

            // Cost filter
            this.costSelect.innerHTML = '<option value="">All Costs</option>';
            const costs = [...new Set(this.allItems.map(i => i.cost).filter(c => c !== null && c !== undefined))].sort((a, b) => a - b);
            costs.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c;
                opt.textContent = c + ' Energy';
                this.costSelect.appendChild(opt);
            });
            // Add X-cost option
            if (this.allItems.some(i => i.is_x_cost)) {
                const opt = document.createElement('option');
                opt.value = 'X';
                opt.textContent = 'X Cost';
                this.costSelect.appendChild(opt);
            }
        }
    }

    applyFilters() {
        const search = this.searchInput.value.toLowerCase().trim();
        const colorOrPool = this.colorSelect.value;
        const rarity = this.raritySelect.value;
        const type = this.typeSelect.value;
        const cost = this.costSelect.value;

        this.filtered = this.allItems.filter(item => {
            if (search && !item.name.toLowerCase().includes(search) &&
                !item.id.toLowerCase().includes(search)) {
                return false;
            }

            if (this.mode === 'card') {
                if (colorOrPool && item.color !== colorOrPool) return false;
                if (type && item.type !== type) return false;
                if (cost) {
                    if (cost === 'X') {
                        if (!item.is_x_cost) return false;
                    } else {
                        if (item.cost !== parseInt(cost, 10)) return false;
                    }
                }
            } else {
                if (colorOrPool && item.pool !== colorOrPool) return false;
            }

            if (rarity && item.rarity !== rarity) return false;

            return true;
        });

        // Sort: by name
        this.filtered.sort((a, b) => a.name.localeCompare(b.name));

        this.displayed = 0;
        this.grid.innerHTML = '';
        this.loadMore();
    }

    loadMore() {
        const end = Math.min(this.displayed + PAGE_SIZE, this.filtered.length);

        for (let i = this.displayed; i < end; i++) {
            const item = this.filtered[i];
            this.grid.appendChild(this.createItemCard(item));
        }

        this.displayed = end;

        // Remove existing load-more button
        const existingBtn = this.grid.querySelector('#browser-load-more');
        if (existingBtn) existingBtn.remove();

        // Add load more if needed
        if (this.displayed < this.filtered.length) {
            const loadMoreDiv = document.createElement('div');
            loadMoreDiv.id = 'browser-load-more';
            const btn = document.createElement('button');
            btn.className = 'btn';
            btn.textContent = `Load More (${this.filtered.length - this.displayed} remaining)`;
            btn.addEventListener('click', () => this.loadMore());
            loadMoreDiv.appendChild(btn);
            this.grid.appendChild(loadMoreDiv);
        }
    }

    createItemCard(item) {
        const el = document.createElement('div');
        el.className = 'browser-item';
        el.dataset.rarity = item.rarity || '';

        const imgUrl = resolveImageUrl(item.image_url);
        const desc = formatDescription(item.description || '');

        let metaText = '';
        if (this.mode === 'card') {
            metaText = [item.type, item.rarity, COLOR_DISPLAY_NAMES[item.color] || item.color]
                .filter(Boolean).join(' / ');
            if (item.cost !== null && item.cost !== undefined) {
                metaText = `${item.cost}E / ${metaText}`;
            }
        } else if (this.mode === 'relic') {
            metaText = [item.rarity, COLOR_DISPLAY_NAMES[item.pool] || item.pool]
                .filter(Boolean).join(' / ');
        } else {
            metaText = [item.rarity, COLOR_DISPLAY_NAMES[item.pool] || item.pool]
                .filter(Boolean).join(' / ');
        }

        el.innerHTML = `
            ${imgUrl ? `<img class="browser-item-img" src="${imgUrl}" alt="${item.name}" loading="lazy">` : ''}
            <div class="browser-item-name">${item.name}</div>
            <div class="browser-item-meta">${metaText}</div>
        `;

        el.addEventListener('click', () => {
            if (this.onSelect) {
                this.onSelect(item);
            }
            if (!this.keepOpenOnSelect) {
                this.close();
            }
        });

        el.addEventListener('mouseenter', () => {
            this.tooltip.innerHTML = desc || 'No description';
            const rect = el.getBoundingClientRect();
            // Try above the item
            this.tooltip.classList.add('visible');
            let top = rect.top - this.tooltip.offsetHeight - 6;
            // If clipped at top, show below
            if (top < 0) top = rect.bottom + 6;
            let left = rect.left + rect.width / 2 - 140;
            left = Math.max(4, Math.min(left, window.innerWidth - 284));
            this.tooltip.style.top = top + 'px';
            this.tooltip.style.left = left + 'px';
        });

        el.addEventListener('mouseleave', () => {
            this.tooltip.classList.remove('visible');
        });

        return el;
    }
}

export const itemBrowser = new ItemBrowser();
