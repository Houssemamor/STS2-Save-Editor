export const SAFE_LIMITS = {
    relics: 150,
    deck: 300,
    potions: 10,
    gold: 90000,
    max_hp: 9000,
    max_energy: 10,
    potion_slots: 10
};

export const ID_PREFIXES = {
    card: 'CARD.',
    relic: 'RELIC.',
    potion: 'POTION.',
    character: 'CHARACTER.',
    enchantment: 'ENCHANTMENT.'
};

export const CHARACTER_COLORS = {
    DEFECT: { dataColor: 'defect', css: '#4488cc', label: 'Defect' },
    IRONCLAD: { dataColor: 'ironclad', css: '#cc4444', label: 'Ironclad' },
    NECROBINDER: { dataColor: 'necrobinder', css: '#8855bb', label: 'Necrobinder' },
    REGENT: { dataColor: 'regent', css: '#cc8833', label: 'Regent' },
    SILENT: { dataColor: 'silent', css: '#44aa66', label: 'Silent' }
};

export const RARITY_COLORS = {
    Common: '#7c7c7c',
    Basic: '#7c7c7c',
    Uncommon: '#48b05e',
    Rare: '#ffc44d',
    Ancient: '#e066ff',
    Starter: '#7c7c7c',
    Shop: '#4488cc',
    Event: '#cc8833',
    Special: '#cc4444',
    Curse: '#cc4444',
    Status: '#cc4444',
    Token: '#8888a0'
};

export const COLOR_DISPLAY_NAMES = {
    colorless: 'Colorless',
    curse: 'Curse',
    defect: 'Defect',
    ironclad: 'Ironclad',
    necrobinder: 'Necrobinder',
    regent: 'Regent',
    silent: 'Silent',
    status: 'Status'
};

export function stripPrefix(saveId, type) {
    const prefix = ID_PREFIXES[type];
    if (prefix && saveId.startsWith(prefix)) {
        return saveId.slice(prefix.length);
    }
    return saveId;
}

export function addPrefix(dataId, type) {
    return ID_PREFIXES[type] + dataId;
}

export function getCharacterKey(characterSaveId) {
    return stripPrefix(characterSaveId, 'character');
}
