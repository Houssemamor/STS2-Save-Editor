export function formatDescription(text) {
    if (!text) return '';
    return text
        .replace(/\[gold\](.*?)\[\/gold\]/g, '<span class="sts-gold">$1</span>')
        .replace(/\[blue\](.*?)\[\/blue\]/g, '<span class="sts-blue">$1</span>')
        .replace(/\[green\](.*?)\[\/green\]/g, '<span class="sts-green">$1</span>')
        .replace(/\[red\](.*?)\[\/red\]/g, '<span class="sts-red">$1</span>')
        .replace(/\[pink\](.*?)\[\/pink\]/g, '<span class="sts-pink">$1</span>')
        .replace(/\[i\](.*?)\[\/i\]/g, '<em>$1</em>')
        .replace(/\[energy:(\d+)\]/g, '<span class="sts-energy">$1E</span>')
        .replace(/\[star:(\d+)\]/g, '<span class="sts-star">$1*</span>')
        .replace(/\[.*?\]/g, '')
        .replace(/\n/g, '<br>');
}

export function resolveImageUrl(url) {
    if (!url) return null;
    return url.startsWith('/') ? url.substring(1) : url;
}

export function getCharacterIconUrl(characterKey) {
    return `static/images/characters/character_icon_${characterKey.toLowerCase()}.png`;
}

export function getCharacterPortraitUrl(characterKey) {
    return `static/images/characters/char_select_${characterKey.toLowerCase()}.png`;
}

export function debounce(fn, ms = 250) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
}

const toastContainer = () => document.getElementById('toast-container');

export function showToast(message, type = 'info') {
    const container = toastContainer();
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('toast-visible'));

    setTimeout(() => {
        toast.classList.remove('toast-visible');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 3000);
}

export function rarityClass(rarity) {
    return 'rarity-' + (rarity || 'common').toLowerCase().replace(/\s+/g, '-');
}

export function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

export function getCurrentFloor(save) {
    const coords = save.visited_map_coords;
    if (coords && coords.length > 0) {
        return Math.max(...coords.map(c => c.row)) + 1;
    }
    return 1;
}

export function getCardDescription(cardData, upgraded) {
    if (!cardData) return '';

    // Start with rendered description
    let desc = cardData.description || '';

    if (upgraded && cardData.upgrade && cardData.vars) {
        // Build upgraded vars
        const upgradedVars = { ...cardData.vars };
        for (const [key, delta] of Object.entries(cardData.upgrade)) {
            if (key === 'cost') continue;
            // Find matching var (upgrade keys are lowercase, vars may differ in case)
            const varKey = Object.keys(upgradedVars).find(k => k.toLowerCase() === key.toLowerCase());
            if (varKey !== undefined) {
                const deltaStr = String(delta);
                if (deltaStr.startsWith('+')) {
                    upgradedVars[varKey] += parseInt(deltaStr.slice(1), 10);
                } else if (deltaStr.startsWith('-')) {
                    upgradedVars[varKey] += parseInt(deltaStr, 10);
                } else {
                    upgradedVars[varKey] = parseInt(deltaStr, 10);
                }
            }
        }

        // Rebuild description from description_raw by substituting vars
        if (cardData.description_raw) {
            desc = cardData.description_raw
                .replace(/\{(\w+):diff\(\)\}/g, (_, name) => {
                    const val = upgradedVars[name];
                    return val !== undefined ? val : '?';
                })
                .replace(/\{(\w+):plural:(\w+)\|(\w+)\}/g, (_, name, singular, plural) => {
                    const val = upgradedVars[name];
                    return val === 1 ? singular : plural;
                })
                .replace(/\{(\w+):energyIcons\(\)\}/g, (_, name) => {
                    const val = upgradedVars[name];
                    return val !== undefined ? `[energy:${val}]` : '?';
                })
                .replace(/\{(\w+):starIcons\(\)\}/g, (_, name) => {
                    const val = upgradedVars[name];
                    return val !== undefined ? `[star:${val}]` : '?';
                })
                .replace(/\{(\w+)\}/g, (_, name) => {
                    const val = upgradedVars[name];
                    return val !== undefined ? val : '?';
                });
        } else {
            // No raw template — replace numeric values in the rendered description
            // This is a rough fallback
            for (const [key, delta] of Object.entries(cardData.upgrade)) {
                if (key === 'cost') continue;
                const varKey = Object.keys(cardData.vars).find(k => k.toLowerCase() === key.toLowerCase());
                if (varKey !== undefined) {
                    const oldVal = cardData.vars[varKey];
                    const newVal = upgradedVars[varKey];
                    desc = desc.replace(new RegExp(`\\b${oldVal}\\b`), String(newVal));
                }
            }
        }

        // Show cost change
        if (cardData.upgrade.cost !== undefined) {
            desc += `<br><span class="sts-green">Cost: ${cardData.upgrade.cost}</span>`;
        }
    }

    return formatDescription(desc);
}

// Shared tooltip for item entries (deck/relic/potion lists)
const entryTooltip = () => document.getElementById('browser-tooltip');

export function bindEntryTooltip(el, htmlContent) {
    el.addEventListener('mouseenter', () => {
        const tip = entryTooltip();
        if (!tip || !htmlContent) return;
        tip.innerHTML = htmlContent;
        tip.classList.add('visible');
        const rect = el.getBoundingClientRect();
        let top = rect.top - tip.offsetHeight - 6;
        if (top < 0) top = rect.bottom + 6;
        let left = rect.left + rect.width / 2 - 140;
        left = Math.max(4, Math.min(left, window.innerWidth - 284));
        tip.style.top = top + 'px';
        tip.style.left = left + 'px';
    });
    el.addEventListener('mouseleave', () => {
        const tip = entryTooltip();
        if (tip) tip.classList.remove('visible');
    });
}
