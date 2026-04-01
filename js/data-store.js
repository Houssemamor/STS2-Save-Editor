import { ID_PREFIXES } from './constants.js';

class DataStore {
    constructor() {
        this.cards = new Map();
        this.relics = new Map();
        this.potions = new Map();
        this.characters = new Map();
        this.modifiers = new Map();
        this.orbs = new Map();
        this.ascensions = new Map();
        this.ready = false;
    }

    async init() {
        const [cardsData, relicsData, potionsData, charsData, modifiersData, orbsData, ascensionsData] = await Promise.all([
            fetch('data/cards.json').then(r => r.json()),
            fetch('data/relics.json').then(r => r.json()),
            fetch('data/potions.json').then(r => r.json()),
            fetch('data/characters.json').then(r => r.json()),
            fetch('data/modifiers.json').then(r => r.json()),
            fetch('data/orbs.json').then(r => r.json()),
            fetch('data/ascensions.json').then(r => r.json())
        ]);

        cardsData.forEach(c => this.cards.set(c.id, c));
        relicsData.forEach(r => this.relics.set(r.id, r));
        potionsData.forEach(p => this.potions.set(p.id, p));
        charsData.forEach(ch => this.characters.set(ch.id, ch));
        modifiersData.forEach(m => this.modifiers.set(m.id, m));
        orbsData.forEach(o => this.orbs.set(o.id, o));
        ascensionsData.forEach(a => this.ascensions.set(a.id, a));

        this.ready = true;
    }

    getCard(dataId) {
        return this.cards.get(dataId) || null;
    }

    getRelic(dataId) {
        return this.relics.get(dataId) || null;
    }

    getPotion(dataId) {
        return this.potions.get(dataId) || null;
    }

    getCharacter(dataId) {
        return this.characters.get(dataId) || null;
    }

    getCardBySaveId(saveId) {
        return this.getCard(this.stripPrefix(saveId, 'card'));
    }

    getRelicBySaveId(saveId) {
        return this.getRelic(this.stripPrefix(saveId, 'relic'));
    }

    getPotionBySaveId(saveId) {
        return this.getPotion(this.stripPrefix(saveId, 'potion'));
    }

    getCharacterBySaveId(saveId) {
        return this.getCharacter(this.stripPrefix(saveId, 'character'));
    }

    stripPrefix(saveId, type) {
        const prefix = ID_PREFIXES[type];
        if (prefix && saveId.startsWith(prefix)) {
            return saveId.slice(prefix.length);
        }
        return saveId;
    }

    getAllCards() {
        return [...this.cards.values()];
    }

    getAllRelics() {
        return [...this.relics.values()];
    }

    getAllPotions() {
        return [...this.potions.values()];
    }

    getAllCharacters() {
        return [...this.characters.values()];
    }

    getCardsByColor(color) {
        return this.getAllCards().filter(c => c.color === color);
    }

    getRelicsByPool(pool) {
        return this.getAllRelics().filter(r => r.pool === pool);
    }

    getPotionsByPool(pool) {
        return this.getAllPotions().filter(p => p.pool === pool);
    }

    getCharacterDataColor(characterSaveId) {
        const char = this.getCharacterBySaveId(characterSaveId);
        if (!char) return null;
        return char.color;
    }

    getModifier(modifierId) {
        return this.modifiers.get(modifierId) || null;
    }

    getOrb(orbId) {
        return this.orbs.get(orbId) || null;
    }

    getAscension(ascensionId) {
        return this.ascensions.get(ascensionId) || null;
    }

    getAllModifiers() {
        return [...this.modifiers.values()];
    }

    getAllOrbs() {
        return [...this.orbs.values()];
    }

    getAllAscensions() {
        return [...this.ascensions.values()];
    }
}

export const dataStore = new DataStore();
