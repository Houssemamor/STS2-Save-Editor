# Slay the Spire 2 Save Editor v0.100

A web-based save file editor for **Slay the Spire 2**. Edit your save files directly in your browser with support for single-player and multiplayer saves.

**[Try it online](https://houssemamor.github.io/STS2-Save-Editor/)**

## Features

- Upload and edit .save files from Slay the Spire 2
- Support for schema versions 14-15 (backward/forward compatible)
- Support for both single-player and multiplayer save formats
- Drag-and-drop file upload
- **Edit run-wide settings:**
  - Ascension level (difficulty 0-20)
  - Run modifiers (enable/disable run modifiers)
- **Edit player data:**
  - Player stats (HP, Gold, Energy, Potion slots, Orb slots)
  - Deck (add/remove/upgrade cards)
  - Relics (add/remove relics)
  - Potions (add/remove potions)
  - Discovered cards/relics (unlock new items)
  - Orb slots (for Defect character)
- Browse and add items with filtering by color, rarity, type, cost
- Rich text descriptions with color formatting
- Graceful handling of unknown/missing cards (preserves data)
- Data validation to prevent save corruption
- Download edited saves back to file system with original schema preserved

## How to Use

1. Open the application in your web browser
2. Click **Upload .save** or drag your save file into the upload area
3. Edit run settings (affects entire run):
   - **Ascension Level**: Set difficulty from 0-20
   - **Run Modifiers**: Add or remove active modifiers
4. Edit player data:
   - **Stats**: HP, Gold, Energy, Potion Slots, Orb Slots (Defect only)
   - **Deck**: Add/remove/upgrade cards by color
   - **Relics**: Add/remove relics by pool
   - **Potions**: Add/remove potions
   - **Discovered Items**: Unlock new cards and relics for future runs
5. Click **Download .save** to save your changes (preserves original schema version)

## Finding Your Save Files

Save files are typically stored at:
```
%APPDATA%\SlayTheSpire2\steam\<SteamID>\profile1\saves\
```

Common file names:
- `current_run.save` - Your current run
- `current_run_mp.save` - Multiplayer run

## Browser Requirements

- Modern browser with ES6 module support
- Local file access capabilities

## Installation

1. Clone the repository
2. Open `index.html` in a web browser
3. No server or build process required

## Run Locally (Scripts)

You can also start a local web server from the project root:

- Windows: `run-local-windows.bat`
- Linux: `run-local-linux.sh`
- macOS: `run-local-mac.sh`

Optional port argument:

- Windows: `run-local-windows.bat 8080`
- Linux: `./run-local-linux.sh 8080`
- macOS: `./run-local-mac.sh 8080`

For Linux/macOS, make scripts executable once:

```bash
chmod +x run-local-linux.sh run-local-mac.sh
```

## Project Structure

```
├── index.html              # Main application file
├── css/
│   └── style.css          # Application styles
├── js/
│   ├── app.js             # Main application entry point
│   ├── ascension-editor.js # Ascension level editor
│   ├── constants.js       # Game constants and configs
│   ├── data-store.js      # Save file data management
│   ├── deck-editor.js     # Deck editing functionality
│   ├── discovered-items-editor.js # Discovered cards/relics management
│   ├── item-browser.js    # Item selection UI modal
│   ├── modifiers-editor.js # Run modifiers editor
│   ├── orbs-editor.js     # Orb slots editor (Defect)
│   ├── player-editor.js   # Player info editing
│   ├── potion-editor.js   # Potion management
│   ├── relic-editor.js    # Relic management
│   ├── save-manager.js    # File I/O and save operations
│   └── utils.js           # Utility functions
├── data/
│   ├── cards.json         # Card database
│   ├── characters.json    # Character data
│   ├── potions.json       # Potion database
│   ├── relics.json        # Relic database
│   ├── modifiers.json     # Run modifiers database
│   ├── orbs.json          # Orb types database
│   └── ascensions.json    # Ascension levels database
└── static/
    └── images/            # Game asset images
```

## Schema Version Support

The editor supports **schema versions 14-15** and is backward compatible:

- **Schema v14 & v15**: Fully supported 
- **Older versions**: May not load correctly
- **Newer versions**: Will load but may have unsupported fields
- **Download preserves version**: Original schema version is maintained when saving

## Notable Features

- **Unknown Cards**: If a card/relic/potion is not in the database, it's displayed as "Unknown" but fully preserved when saved
- **Rich Text Support**: Descriptions use color formatting (`[gold]`, `[blue]`, etc.)
- **Defensive Design**: No data loss on missing database entries
- **Multiplayer Support**: Edit both single-player and multiplayer saves
- **Form Validation**: Prevents values outside safe limits (HP, Gold, etc.)

## Warning

Always backup your save files before editing. While the editor includes validation to prevent corruption, use at your own risk.

## Credit

Assets and data files provided by [spire-codex](https://github.com/ptrlrd/spire-codex)

## License

See [LICENSE](LICENSE) for details.
