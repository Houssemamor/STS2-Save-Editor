import { SAFE_LIMITS } from './constants.js';

class SaveManager {
    constructor() {
        this.originalSave = null;
        this.workingSave = null;
        this.filename = null;
    }

    loadFromFile(file) {
        return new Promise((resolve, reject) => {
            this.filename = file.name;
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const json = JSON.parse(e.target.result);
                    this.originalSave = JSON.parse(JSON.stringify(json));
                    this.workingSave = json;
                    resolve(json);
                } catch (err) {
                    reject(new Error('Invalid save file: ' + err.message));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    getPlayerCount() {
        return this.workingSave && this.workingSave.players ? this.workingSave.players.length : 0;
    }

    getPlayer(index) {
        return this.workingSave ? this.workingSave.players[index] : null;
    }

    isMultiplayer() {
        return this.getPlayerCount() > 1;
    }

    getSaveInfo() {
        if (!this.workingSave) return null;
        const s = this.workingSave;
        const isProgressSave = !s.players;
        
        return {
            schema_version: s.schema_version,
            seed: s.rng?.seed || 'Unknown',
            ascension: s.ascension ?? 0,
            current_act_index: s.current_act_index ?? 0,
            current_act_id: s.acts?.[s.current_act_index]?.id || 'Unknown',
            run_time: s.run_time ?? 0,
            player_count: isProgressSave ? 0 : (s.players?.length || 0),
            is_progress_save: isProgressSave
        };
    }

    getCurrentFloor() {
        if (!this.workingSave) return 1;
        const coords = this.workingSave.visited_map_coords;
        if (coords && coords.length > 0) {
            return Math.max(...coords.map(c => c.row)) + 1;
        }
        return 1;
    }

    validate() {
        const warnings = [];
        if (!this.workingSave) return warnings;
        
        // Skip validation for progress files
        if (!this.workingSave.players) return warnings;

        for (let i = 0; i < this.workingSave.players.length; i++) {
            const p = this.workingSave.players[i];
            const label = `Player ${i + 1}`;

            if (p.gold > SAFE_LIMITS.gold)
                warnings.push(`${label}: Gold (${p.gold}) exceeds safe limit of ${SAFE_LIMITS.gold}`);
            if (p.max_hp > SAFE_LIMITS.max_hp)
                warnings.push(`${label}: Max HP (${p.max_hp}) exceeds safe limit of ${SAFE_LIMITS.max_hp}`);
            if (p.current_hp > p.max_hp)
                warnings.push(`${label}: Current HP (${p.current_hp}) exceeds Max HP (${p.max_hp})`);
            if (p.max_energy > SAFE_LIMITS.max_energy)
                warnings.push(`${label}: Energy (${p.max_energy}) exceeds safe limit of ${SAFE_LIMITS.max_energy}`);
            if (p.max_potion_slot_count > SAFE_LIMITS.potion_slots)
                warnings.push(`${label}: Potion slots (${p.max_potion_slot_count}) exceeds safe limit of ${SAFE_LIMITS.potion_slots}`);
            if ((p.deck || []).length > SAFE_LIMITS.deck)
                warnings.push(`${label}: Deck size (${p.deck.length}) exceeds safe limit of ${SAFE_LIMITS.deck}`);
            if ((p.relics || []).length > SAFE_LIMITS.relics)
                warnings.push(`${label}: Relic count (${p.relics.length}) exceeds safe limit of ${SAFE_LIMITS.relics}`);
            if ((p.potions || []).length > SAFE_LIMITS.potions)
                warnings.push(`${label}: Potion count (${p.potions.length}) exceeds safe limit of ${SAFE_LIMITS.potions}`);
        }

        return warnings;
    }

    downloadSave() {
        if (!this.workingSave) return;
        const json = JSON.stringify(this.workingSave, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.filename || 'current_run.save';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    getAscension() {
        return this.workingSave ? this.workingSave.ascension ?? 0 : 0;
    }

    setAscension(level) {
        if (this.workingSave) {
            this.workingSave.ascension = Math.max(0, Math.min(20, level));
        }
    }

    getModifiers() {
        return this.workingSave ? this.workingSave.modifiers || [] : [];
    }

    setModifiers(modifierIds) {
        if (this.workingSave) {
            this.workingSave.modifiers = modifierIds;
        }
    }

    getDiscoveredCards(playerIndex) {
        const player = this.getPlayer(playerIndex);
        return player ? player.discovered_cards || [] : [];
    }

    setDiscoveredCards(playerIndex, cardIds) {
        const player = this.getPlayer(playerIndex);
        if (player) {
            player.discovered_cards = cardIds;
        }
    }

    getDiscoveredRelics(playerIndex) {
        const player = this.getPlayer(playerIndex);
        return player ? player.discovered_relics || [] : [];
    }

    setDiscoveredRelics(playerIndex, relicIds) {
        const player = this.getPlayer(playerIndex);
        if (player) {
            player.discovered_relics = relicIds;
        }
    }

    getOrbSlotCount(playerIndex) {
        const player = this.getPlayer(playerIndex);
        return player ? player.base_orb_slot_count || 0 : 0;
    }

    setOrbSlotCount(playerIndex, count) {
        const player = this.getPlayer(playerIndex);
        if (player) {
            player.base_orb_slot_count = Math.max(0, count);
        }
    }

    getProgress() {
        if (!this.workingSave) return null;
        
        // The progress.save file has progress data at the top level,
        // but we need to check both workingSave root and look for a progress property
        // In this case, workingSave itself IS the progress data
        return this.workingSave;
    }

    setProgressField(field, value) {
        if (this.workingSave) {
            this.workingSave[field] = value;
        }
    }

    setCharacterStat(characterIndex, field, value) {
        const progress = this.getProgress();
        if (progress && progress.character_stats && progress.character_stats[characterIndex]) {
            progress.character_stats[characterIndex][field] = value;
        }
    }

    setCardStat(cardIndex, field, value) {
        const progress = this.getProgress();
        if (progress && progress.card_stats && progress.card_stats[cardIndex]) {
            progress.card_stats[cardIndex][field] = value;
        }
    }

    setEnemyFightStat(enemyIndex, fightIndex, field, value) {
        const progress = this.getProgress();
        if (progress && progress.enemy_stats && progress.enemy_stats[enemyIndex] &&
            progress.enemy_stats[enemyIndex].fight_stats && progress.enemy_stats[enemyIndex].fight_stats[fightIndex]) {
            progress.enemy_stats[enemyIndex].fight_stats[fightIndex][field] = value;
        }
    }

    setEpochField(epochIndex, field, value) {
        const progress = this.getProgress();
        if (progress && progress.epochs && progress.epochs[epochIndex]) {
            progress.epochs[epochIndex][field] = value;
        }
    }
}

export const saveManager = new SaveManager();
