import { dataStore } from './data-store.js';
import { saveManager } from './save-manager.js';
import { PlayerEditor } from './player-editor.js';
import { showToast } from './utils.js';

const SAVE_PATH_TEMPLATE = '%APPDATA%\\SlayTheSpire2\\steam\\<SteamID>\\profile1\\saves\\';
const DB_NAME = 'sts2-save-editor';
const DB_STORE = 'handles';

const uploadBtn = document.getElementById('btn-upload');
const downloadBtn = document.getElementById('btn-download');
const fileInput = document.getElementById('file-input');
const fileStatus = document.getElementById('file-status');
const uploadArea = document.getElementById('upload-area');
const editorMain = document.getElementById('editor-main');
const saveInfoEl = document.getElementById('save-info');
const schemaWarning = document.getElementById('schema-warning');
const dropZone = document.getElementById('drop-zone');
const copyPathBtn = document.getElementById('btn-copy-path');

let playerEditor = null;
let lastDirHandle = null;

// ── IndexedDB helpers for persisting the directory handle ──

function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function saveDirHandle(handle) {
    try {
        const db = await openDB();
        const tx = db.transaction(DB_STORE, 'readwrite');
        tx.objectStore(DB_STORE).put(handle, 'lastDir');
        await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej; });
    } catch { /* ignore storage errors */ }
}

async function loadDirHandle() {
    try {
        const db = await openDB();
        const tx = db.transaction(DB_STORE, 'readonly');
        const req = tx.objectStore(DB_STORE).get('lastDir');
        return new Promise((res) => { req.onsuccess = () => res(req.result || null); req.onerror = () => res(null); });
    } catch { return null; }
}

// ── File System Access API picker ──

const hasFileSystemAccess = 'showOpenFilePicker' in window;

async function openWithFileSystemAccess() {
    const options = {
        types: [{
            description: 'STS2 Save Files',
            accept: { 'application/json': ['.save', '.json'] }
        }],
        multiple: false
    };

    // If we have a persisted directory handle, try to start there
    if (lastDirHandle) {
        options.startIn = lastDirHandle;
    }

    const [fileHandle] = await window.showOpenFilePicker(options);
    const file = await fileHandle.getFile();

    // Persist the parent directory so next open starts there
    try {
        // Walk up: we can't get the parent from showOpenFilePicker directly,
        // but showDirectoryPicker can be used alongside. Instead, we persist
        // the file handle itself and the next pick will remember the location
        // (browsers remember the last directory per-origin for showOpenFilePicker).
        // For an explicit "Open from save folder" flow, offer a directory picker.
    } catch { /* ignore */ }

    return file;
}

async function openSaveDirectory() {
    // Let the user pick the saves directory, then list .save files in it
    const dirOptions = {};
    if (lastDirHandle) {
        dirOptions.startIn = lastDirHandle;
    }

    const dirHandle = await window.showDirectoryPicker(dirOptions);
    lastDirHandle = dirHandle;
    await saveDirHandle(dirHandle);

    // Find .save files in the directory
    const saveFiles = [];
    for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file' && (entry.name.endsWith('.save') || entry.name.endsWith('.json'))) {
            saveFiles.push(entry);
        }
    }

    if (saveFiles.length === 0) {
        showToast('No .save files found in that folder', 'warning');
        return null;
    }

    // If only one, use it directly
    if (saveFiles.length === 1) {
        return await saveFiles[0].getFile();
    }

    // Multiple: let user pick — prefer current_run.save, current_run_mp.save at the top
    saveFiles.sort((a, b) => {
        const priority = ['current_run.save', 'current_run_mp.save'];
        const ai = priority.indexOf(a.name);
        const bi = priority.indexOf(b.name);
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1;
        if (bi !== -1) return 1;
        return a.name.localeCompare(b.name);
    });

    // Show a simple selection prompt
    const names = saveFiles.map((f, i) => `${i + 1}. ${f.name}`).join('\n');
    const choice = prompt(`Multiple save files found:\n\n${names}\n\nEnter number (1-${saveFiles.length}):`);
    const idx = parseInt(choice, 10) - 1;
    if (isNaN(idx) || idx < 0 || idx >= saveFiles.length) {
        return null;
    }

    return await saveFiles[idx].getFile();
}

// ── Init ──

async function init() {
    try {
        await dataStore.init();
    } catch (err) {
        showToast('Failed to load game data: ' + err.message, 'error');
        return;
    }

    // Restore persisted directory handle
    if (hasFileSystemAccess) {
        lastDirHandle = await loadDirHandle();
    }

    // Upload button — always use standard file input (no AppData restrictions)
    uploadBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
        fileInput.value = '';
    });

    // Drop zone click — open standard file picker
    dropZone.addEventListener('click', () => fileInput.click());

    // Download button
    downloadBtn.addEventListener('click', () => handleDownload());

    // Copy path button
    copyPathBtn.addEventListener('click', () => {
        const path = SAVE_PATH_TEMPLATE;
        navigator.clipboard.writeText(path).then(() => {
            showToast('Path copied to clipboard', 'success');
        }).catch(() => {
            // Fallback: select the code element
            const code = document.getElementById('save-path-text');
            const range = document.createRange();
            range.selectNodeContents(code);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            showToast('Path selected — press Ctrl+C to copy', 'info');
        });
    });

    // Drag and drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    // Prevent default drag behavior on body
    document.body.addEventListener('dragover', (e) => e.preventDefault());
    document.body.addEventListener('drop', (e) => e.preventDefault());
}

async function handleFile(file) {
    try {
        await saveManager.loadFromFile(file);
    } catch (err) {
        showToast(err.message, 'error');
        return;
    }

    const info = saveManager.getSaveInfo();

    // Schema version check
    if (info.schema_version !== 14) {
        schemaWarning.textContent = `Warning: Save file uses schema version ${info.schema_version} (expected 14). Editing may not work correctly.`;
        schemaWarning.classList.remove('hidden');
    } else {
        schemaWarning.classList.add('hidden');
    }

    // Save info bar
    const runMins = Math.floor(info.run_time / 60);
    const runSecs = info.run_time % 60;
    const actName = info.current_act_id.replace('ACT.', '').replace(/_/g, ' ');

    saveInfoEl.innerHTML = `
        <div class="info-item"><span class="info-label">Seed:</span> <span class="info-value">${info.seed}</span></div>
        <div class="info-item"><span class="info-label">Ascension:</span> <span class="info-value">${info.ascension}</span></div>
        <div class="info-item"><span class="info-label">Act:</span> <span class="info-value">${actName}</span></div>
        <div class="info-item"><span class="info-label">Run Time:</span> <span class="info-value">${runMins}m ${runSecs}s</span></div>
        <div class="info-item"><span class="info-label">Players:</span> <span class="info-value">${info.player_count}${saveManager.isMultiplayer() ? ' (Multiplayer)' : ' (Solo)'}</span></div>
    `;

    // Update UI
    fileStatus.textContent = saveManager.filename;
    uploadArea.classList.add('hidden');
    editorMain.classList.remove('hidden');
    downloadBtn.disabled = false;

    // Render player editor
    playerEditor = new PlayerEditor(saveManager);
    playerEditor.render();

    showToast(`Loaded ${saveManager.filename} (${info.player_count} player${info.player_count > 1 ? 's' : ''})`, 'success');
}

function handleDownload() {
    const warnings = saveManager.validate();

    if (warnings.length > 0) {
        const msg = 'Warnings:\n' + warnings.join('\n') + '\n\nDownload anyway?';
        if (!confirm(msg)) return;
    }

    saveManager.downloadSave();
    showToast('Save file downloaded', 'success');
}

init();
