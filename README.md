# STS2 Save Editor

A web-based save file editor for Slay the Spire 2. Edit your save files directly in your browser with support for single-player and multiplayer saves.

**[Try it online](https://houssemamor.github.io/STS2-Save-Editor/)**

## Features

- Upload and edit .save files from Slay the Spire 2
- Support for both single-player and multiplayer save formats
- Drag-and-drop file upload
- Edit player information, deck, relics, potions, and items
- Browse and add cards, relics, and potions with filtering
- Download edited saves back to your file system
- Data validation to prevent save corruption

## How to Use

1. Open the application in your web browser
2. Click **Upload .save** or drag your save file into the upload area
3. Edit your player data:
   - Player information and stats
   - Deck (add/remove cards)
   - Relics
   - Potions
   - Items
4. Click **Download .save** to save your changes

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

## Project Structure

```
├── index.html              # Main application file
├── css/
│   └── style.css          # Application styles
├── js/
│   ├── app.js             # Main application entry point
│   ├── constants.js       # Game constants and configs
│   ├── data-store.js      # Save file data management
│   ├── deck-editor.js     # Deck editing functionality
│   ├── item-browser.js    # Item selection UI
│   ├── player-editor.js   # Player info editing
│   ├── potion-editor.js   # Potion management
│   ├── relic-editor.js    # Relic management
│   ├── save-manager.js    # File I/O operations
│   └── utils.js           # Utility functions
├── data/
│   ├── cards.json         # Card database
│   ├── characters.json    # Character data
│   ├── potions.json       # Potion database
│   └── relics.json        # Relic database
└── static/
    └── images/            # Game asset images
```

## Warning

Always backup your save files before editing. While the editor includes validation to prevent corruption, use at your own risk.

## Credit

Assets and data files provided by [spire-codex](https://github.com/ptrlrd/spire-codex)

## License

See LICENSE file for details.
