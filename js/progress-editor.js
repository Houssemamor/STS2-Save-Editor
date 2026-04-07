import { dataStore } from './data-store.js';
import { formatDescription, showToast, resolveImageUrl, getCharacterIconUrl } from './utils.js';

export class ProgressEditor {
    constructor(saveManager) {
        this.saveManager = saveManager;
        this.container = null;
        this.activeTab = 'character-stats';
    }

    render(parentContainer) {
        const progress = this.saveManager.getProgress();
        if (!progress) {
            console.error('No progress data available');
            return;
        }

        this.container = document.createElement('div');
        this.container.className = 'progress-editor section';
        this.container.innerHTML = `
            <h3>Progress & Statistics</h3>
            <div class="progress-tabs">
                <button class="progress-tab-btn active" data-tab="character-stats">Character Stats</button>
                <button class="progress-tab-btn" data-tab="card-stats">Card Stats</button>
                <button class="progress-tab-btn" data-tab="enemy-stats">Enemy Stats</button>
                <button class="progress-tab-btn" data-tab="discovery">Discovery</button>
                <button class="progress-tab-btn" data-tab="epochs">Epochs</button>
                <button class="progress-tab-btn" data-tab="global-stats">Global Stats</button>
            </div>
            <div id="progress-content" class="progress-content"></div>
        `;

        parentContainer.appendChild(this.container);
        this.attachTabListeners();
        this.renderTab('character-stats');
    }

    attachTabListeners() {
        const buttons = this.container.querySelectorAll('.progress-tab-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                
                buttons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                this.activeTab = tabName;
                this.renderTab(tabName);
            });
        });
    }

    renderTab(tabName) {
        const contentDiv = this.container.querySelector('#progress-content');
        if (!contentDiv) {
            console.error('Progress content div not found');
            return;
        }
        contentDiv.innerHTML = '';

        try {
            switch (tabName) {
                case 'character-stats':
                    this.renderCharacterStats(contentDiv);
                    break;
                case 'card-stats':
                    this.renderCardStats(contentDiv);
                    break;
                case 'enemy-stats':
                    this.renderEnemyStats(contentDiv);
                    break;
                case 'discovery':
                    this.renderDiscovery(contentDiv);
                    break;
                case 'epochs':
                    this.renderEpochs(contentDiv);
                    break;
                case 'global-stats':
                    this.renderGlobalStats(contentDiv);
                    break;
                default:
                    console.warn('Unknown tab:', tabName);
            }
        } catch (err) {
            console.error('Error rendering tab:', tabName, err);
            contentDiv.innerHTML = `<p class="empty-state">Error loading tab: ${err.message}</p>`;
        }
    }

    renderCharacterStats(container) {
        const progress = this.saveManager.getProgress();
        const characterStats = progress.character_stats || [];

        if (characterStats.length === 0) {
            container.innerHTML = '<p class="empty-state">No character stats available</p>';
            return;
        }

        const stats = document.createElement('div');
        stats.className = 'stats-grid';

        // Global playtime
        const globalDiv = document.createElement('div');
        globalDiv.className = 'stat-section';
        globalDiv.innerHTML = `
            <h4>Global Stats</h4>
            <div class="stat-row">
                <label>Total Playtime (sec):</label>
                <input type="number" class="global-playtime" value="${progress.total_playtime || 0}" min="0">
            </div>
            <div class="stat-row">
                <label>Floors Climbed:</label>
                <input type="number" class="global-floors" value="${progress.floors_climbed || 0}" min="0">
            </div>
        `;
        stats.appendChild(globalDiv);

        // Per-character stats
        characterStats.forEach((charStat, idx) => {
            const character = dataStore.getCharacterBySaveId(charStat.id);
            const charName = character ? character.name : charStat.id;
            const charImage = character ? resolveImageUrl(character.image_url) : null;

            const charDiv = document.createElement('div');
            charDiv.className = 'stat-section character-stat';
            const iconHtml = charImage ? `<img src="${charImage}" alt="${charName}" class="stat-icon">` : '';
            charDiv.innerHTML = `
                <h4>${iconHtml} ${charName}</h4>
                <div class="stat-row">
                    <label>Wins:</label>
                    <input type="number" data-field="total_wins" data-index="${idx}" value="${charStat.total_wins || 0}" min="0">
                </div>
                <div class="stat-row">
                    <label>Losses:</label>
                    <input type="number" data-field="total_losses" data-index="${idx}" value="${charStat.total_losses || 0}" min="0">
                </div>
                <div class="stat-row">
                    <label>Win Streak:</label>
                    <input type="number" data-field="best_win_streak" data-index="${idx}" value="${charStat.best_win_streak || 0}" min="0">
                </div>
                <div class="stat-row">
                    <label>Current Streak:</label>
                    <input type="number" data-field="current_streak" data-index="${idx}" value="${charStat.current_streak || 0}" min="0">
                </div>
                <div class="stat-row">
                    <label>Playtime (sec):</label>
                    <input type="number" data-field="playtime" data-index="${idx}" value="${charStat.playtime || 0}" min="0">
                </div>
                <div class="stat-row">
                    <label>Max Ascension:</label>
                    <input type="number" data-field="max_ascension" data-index="${idx}" value="${charStat.max_ascension || 0}" min="0" max="20">
                </div>
                <div class="stat-row">
                    <label>Preferred Ascension:</label>
                    <input type="number" data-field="preferred_ascension" data-index="${idx}" value="${charStat.preferred_ascension || 0}" min="0" max="20">
                </div>
            `;
            stats.appendChild(charDiv);
        });

        container.appendChild(stats);
        this.attachCharacterStatListeners(stats);
    }

    attachCharacterStatListeners(container) {
        const globalPlaytimeInput = container.querySelector('.global-playtime');
        if (globalPlaytimeInput) {
            globalPlaytimeInput.addEventListener('change', (e) => {
                this.saveManager.setProgressField('total_playtime', parseInt(e.target.value) || 0);
                showToast('Global playtime updated', 'success');
            });
        }

        const globalFloorsInput = container.querySelector('.global-floors');
        if (globalFloorsInput) {
            globalFloorsInput.addEventListener('change', (e) => {
                this.saveManager.setProgressField('floors_climbed', parseInt(e.target.value) || 0);
                showToast('Floors climbed updated', 'success');
            });
        }

        container.querySelectorAll('.character-stat input').forEach(input => {
            input.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                const field = e.target.dataset.field;
                const value = parseInt(e.target.value) || 0;
                this.saveManager.setCharacterStat(index, field, value);
                showToast(`${field} updated`, 'success');
            });
        });
    }

    renderCardStats(container) {
        const progress = this.saveManager.getProgress();
        const cardStats = progress.card_stats || [];

        if (cardStats.length === 0) {
            container.innerHTML = '<p class="empty-state">No card stats available</p>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'stats-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Card</th>
                    <th>Times Picked</th>
                    <th>Times Skipped</th>
                    <th>Times Won</th>
                    <th>Times Lost</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;

        const tbody = table.querySelector('tbody');

        cardStats.forEach((stat, idx) => {
            const card = dataStore.getCardBySaveId(stat.id);
            const cardName = card ? card.name : stat.id;
            const cardImage = card ? resolveImageUrl(card.image_url) : null;
            const cardIconHtml = cardImage ? `<img src="${cardImage}" alt="${cardName}" class="card-icon">` : '';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="card-name">${cardIconHtml} ${cardName}</td>
                <td><input type="number" data-field="times_picked" data-index="${idx}" value="${stat.times_picked || 0}" min="0" class="stat-input"></td>
                <td><input type="number" data-field="times_skipped" data-index="${idx}" value="${stat.times_skipped || 0}" min="0" class="stat-input"></td>
                <td><input type="number" data-field="times_won" data-index="${idx}" value="${stat.times_won || 0}" min="0" class="stat-input"></td>
                <td><input type="number" data-field="times_lost" data-index="${idx}" value="${stat.times_lost || 0}" min="0" class="stat-input"></td>
            `;
            tbody.appendChild(row);
        });

        container.appendChild(table);

        container.querySelectorAll('.stat-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                const field = e.target.dataset.field;
                const value = parseInt(e.target.value) || 0;
                this.saveManager.setCardStat(index, field, value);
            });
        });
    }

    renderEnemyStats(container) {
        const progress = this.saveManager.getProgress();
        const enemyStats = progress.enemy_stats || [];

        if (enemyStats.length === 0) {
            container.innerHTML = '<p class="empty-state">No enemy stats available</p>';
            return;
        }

        const stats = document.createElement('div');
        stats.className = 'enemy-stats-list';

        enemyStats.forEach((enemyStat, statIdx) => {
            const section = document.createElement('div');
            section.className = 'enemy-stat-section';
            section.innerHTML = `<h4>${enemyStat.enemy_id}</h4>`;

            const fightTable = document.createElement('table');
            fightTable.className = 'fight-stats-table';
            fightTable.innerHTML = `
                <thead>
                    <tr>
                        <th>Character</th>
                        <th>Wins</th>
                        <th>Losses</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;

            const tbody = fightTable.querySelector('tbody');

            enemyStat.fight_stats.forEach((fightStat, fightIdx) => {
                const character = dataStore.getCharacterBySaveId(fightStat.character);
                const charName = character ? character.name : fightStat.character;
                const charImage = character ? resolveImageUrl(character.image_url) : null;
                const charIconHtml = charImage ? `<img src="${charImage}" alt="${charName}" class="char-stat-icon">` : '';

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="character-cell">${charIconHtml} ${charName}</td>
                    <td><input type="number" data-enemy-idx="${statIdx}" data-fight-idx="${fightIdx}" data-field="wins" value="${fightStat.wins || 0}" min="0" class="fight-input"></td>
                    <td><input type="number" data-enemy-idx="${statIdx}" data-fight-idx="${fightIdx}" data-field="losses" value="${fightStat.losses || 0}" min="0" class="fight-input"></td>
                `;
                tbody.appendChild(row);
            });

            section.appendChild(fightTable);
            stats.appendChild(section);
        });

        container.appendChild(stats);

        container.querySelectorAll('.fight-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const enemyIdx = parseInt(e.target.dataset.enemyIdx);
                const fightIdx = parseInt(e.target.dataset.fightIdx);
                const field = e.target.dataset.field;
                const value = parseInt(e.target.value) || 0;
                this.saveManager.setEnemyFightStat(enemyIdx, fightIdx, field, value);
            });
        });
    }

    renderDiscovery(container) {
        const progress = this.saveManager.getProgress();
        const categories = [
            { name: 'Cards', key: 'discovered_cards', getId: 'card' },
            { name: 'Relics', key: 'discovered_relics', getId: 'relic' },
            { name: 'Potions', key: 'discovered_potions', getId: 'potion' },
            { name: 'Events', key: 'discovered_events', getId: 'event' },
            { name: 'Acts', key: 'discovered_acts', getId: 'act' }
        ];

        const discoveryDiv = document.createElement('div');
        discoveryDiv.className = 'discovery-grid';

        categories.forEach(cat => {
            const discovered = progress[cat.key] || [];
            const total = this.getDiscoveryTotal(cat.getId);
            const percentage = total > 0 ? Math.round((discovered.length / total) * 100) : 0;

            const section = document.createElement('div');
            section.className = 'discovery-section';
            section.innerHTML = `
                <h4>${cat.name}</h4>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%"></div>
                    <span class="progress-text">${discovered.length} / ${total} (${percentage}%)</span>
                </div>
                <div class="discovered-list">
                    ${discovered.map(id => `<div class="discovered-item-line">${this.getItemName(id, cat.getId)}</div>`).join('') || '<div class="discovered-item-line">None</div>'}
                </div>
            `;
            discoveryDiv.appendChild(section);
        });

        container.appendChild(discoveryDiv);
    }

    renderEpochs(container) {
        const progress = this.saveManager.getProgress();
        const epochs = progress.epochs || [];

        if (epochs.length === 0) {
            container.innerHTML = '<p class="empty-state">No epoch data available</p>';
            return;
        }

        const epochStates = {
            'not_obtained': 'Not Obtained',
            'revealed': 'Revealed',
            'obtained': 'Obtained'
        };

        const epochsContainer = document.createElement('div');
        epochsContainer.className = 'epochs-list';

        epochs.forEach((epoch, idx) => {
            const epochData = dataStore.getEpoch(epoch.id);
            const epochTitle = epochData ? epochData.title : epoch.id;
            const epochEra = epochData ? epochData.era_name : 'Unknown Era';
            const epochDesc = epochData && epochData.description ? formatDescription(epochData.description) : '';

            const card = document.createElement('div');
            card.className = 'epoch-card';
            card.innerHTML = `
                <div class="epoch-header">
                    <div class="epoch-title">
                        <h4>${epochTitle}</h4>
                        <span class="epoch-era">${epochEra}</span>
                    </div>
                    <div class="epoch-controls">
                        <select data-index="${idx}" data-field="state" class="epoch-state-select">
                            ${Object.entries(epochStates).map(([key, label]) => 
                                `<option value="${key}" ${epoch.state === key ? 'selected' : ''}>${label}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>
                <div class="epoch-date">
                    ${epoch.obtain_date > 0 ? `Obtained: ${new Date(epoch.obtain_date * 1000).toLocaleString()}` : 'Not yet obtained'}
                </div>
                ${epochDesc ? `<div class="epoch-description">${epochDesc}</div>` : ''}
            `;
            epochsContainer.appendChild(card);
        });

        container.appendChild(epochsContainer);

        container.querySelectorAll('.epoch-state-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                const field = e.target.dataset.field;
                const value = e.target.value;
                this.saveManager.setEpochField(index, field, value);
                showToast('Epoch state updated', 'success');
            });
        });
    }

    renderGlobalStats(container) {
        const progress = this.saveManager.getProgress();

        const globalDiv = document.createElement('div');
        globalDiv.className = 'global-stats-form';
        globalDiv.innerHTML = `
            <div class="form-section">
                <h4>Meta Progress</h4>
                
                <div class="stat-row">
                    <label for="current-score">Current Score:</label>
                    <input type="number" id="current-score" value="${progress.current_score || 0}" min="0">
                </div>

                <div class="stat-row">
                    <label for="total-unlocks">Total Unlocks:</label>
                    <input type="number" id="total-unlocks" value="${progress.total_unlocks || 0}" min="0">
                </div>

                <div class="stat-row">
                    <label for="wongo-points">Wongo Points:</label>
                    <input type="number" id="wongo-points" value="${progress.wongo_points || 0}" min="0">
                </div>

                <div class="stat-row">
                    <label for="test-subject-kills">Test Subject Kills:</label>
                    <input type="number" id="test-subject-kills" value="${progress.test_subject_kills || 0}" min="0">
                </div>

                <div class="stat-row">
                    <label for="architect-damage">Architect Damage:</label>
                    <input type="number" id="architect-damage" value="${progress.architect_damage || 0}" min="0">
                </div>

                <div class="stat-row checkbox">
                    <label for="enable-ftues">
                        <input type="checkbox" id="enable-ftues" ${progress.enable_ftues ? 'checked' : ''}>
                        Enable FTUEs
                    </label>
                </div>
            </div>
        `;

        container.appendChild(globalDiv);
        this.attachGlobalStatsListeners(globalDiv);
    }

    attachGlobalStatsListeners(container) {
        const fields = [
            { selector: '#current-score', field: 'current_score' },
            { selector: '#total-unlocks', field: 'total_unlocks' },
            { selector: '#wongo-points', field: 'wongo_points' },
            { selector: '#test-subject-kills', field: 'test_subject_kills' },
            { selector: '#architect-damage', field: 'architect_damage' }
        ];

        fields.forEach(({ selector, field }) => {
            const input = container.querySelector(selector);
            if (input) {
                input.addEventListener('change', (e) => {
                    const value = parseInt(e.target.value) || 0;
                    this.saveManager.setProgressField(field, value);
                    showToast(`${field} updated`, 'success');
                });
            }
        });

        const enableFtuesCheckbox = container.querySelector('#enable-ftues');
        if (enableFtuesCheckbox) {
            enableFtuesCheckbox.addEventListener('change', (e) => {
                this.saveManager.setProgressField('enable_ftues', e.target.checked);
                showToast('FTUE setting updated', 'success');
            });
        }
    }

    getDiscoveryTotal(type) {
        switch (type) {
            case 'card':
                return dataStore.getAllCards().length;
            case 'relic':
                return dataStore.getAllRelics().length;
            case 'potion':
                return dataStore.getAllPotions().length;
            case 'event':
                return 0; // Would need event data
            case 'act':
                return 0; // Would need act data
            default:
                return 0;
        }
    }

    getItemName(id, type) {
        switch (type) {
            case 'card': {
                const card = dataStore.getCardBySaveId(id);
                if (!card) return id;
                const img = resolveImageUrl(card.image_url);
                const imgHtml = img ? `<img src="${img}" alt="${card.name}" class="discovery-icon">` : '';
                return `${imgHtml} ${card.name}`;
            }
            case 'relic': {
                const relic = dataStore.getRelicBySaveId(id);
                if (!relic) return id;
                const img = resolveImageUrl(relic.image_url);
                const imgHtml = img ? `<img src="${img}" alt="${relic.name}" class="discovery-icon">` : '';
                return `${imgHtml} ${relic.name}`;
            }
            case 'potion': {
                const potion = dataStore.getPotionBySaveId(id);
                if (!potion) return id;
                const img = resolveImageUrl(potion.image_url);
                const imgHtml = img ? `<img src="${img}" alt="${potion.name}" class="discovery-icon">` : '';
                return `${imgHtml} ${potion.name}`;
            }
            default:
                return id;
        }
    }
}
