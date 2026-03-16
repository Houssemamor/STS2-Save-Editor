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
