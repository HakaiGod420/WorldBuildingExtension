# World Building Extension

A SillyTavern extension for creating, managing, and injecting rich world settings into roleplay chats. Generate complete worlds via AI, edit them manually or with AI assistance, and reuse them across any chat.

## Features

- **AI World Generation** — Describe your vision and let AI generate a fully structured world with 9 sections: description, rules, locations, factions, history, magic system, technology, effects, and atmosphere
- **AI-Assisted Editing** — Per-section "AI Edit" button: describe what to change and AI rewrites just that section
- **Manual Editing** — Directly edit any section in the world editor modal
- **Cross-Chat Reuse** — Worlds are saved globally and can be assigned to any chat
- **Per-Chat World Assignment** — Each chat can have exactly one active world (or none). Select from saved worlds or create new ones
- **Smart Context Injection** — World context is injected into the AI prompt at two points: a brief header before chat history and concise world details after
- **Connection Profile Support** — Uses SillyTavern's Connection Manager for API calls; falls back to `generateQuietPrompt`

## Installation

### Via SillyTavern Extension Manager

1. Open SillyTavern
2. Go to **Extensions** > **Install from URL**
3. Paste the repository URL
4. Click **Install**

### Manual Installation

1. Clone this repository into:
   ```
   public/scripts/extensions/third-party/WorldBuildingExtension/
   ```
2. Restart SillyTavern

## Usage

### Creating a World

1. Open the **World Building** panel in extensions settings
2. Select a **Connection Profile** for AI calls
3. Click **+ Create New World**
4. Enter a **World Name** and a **prompt** describing the world
5. Click **Generate World** — AI fills all 9 sections
6. Edit any section manually or use **AI Edit** for targeted changes

### Assigning a World to a Chat

1. In the **Active World** dropdown, select a saved world
2. The world context is automatically injected into the AI prompt
3. Switch to **None** to remove world context from the current chat

### Editing a World

1. Click the **edit icon** (✎) on any world card
2. Modify the name, sections, or regenerate from a new prompt
3. Click **Save Changes**

### AI-Assisted Section Editing

1. Open the world editor
2. Next to any section, click **AI Edit**
3. Type what should change (e.g., "make the magic system more dangerous")
4. AI rewrites just that section

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| **Enabled** | On | Master toggle for the extension |
| **Connection Profile** | — | API profile for AI generation and editing |
| **Auto-Inject World Context** | On | Automatically inject world context into chat prompts |

## World Sections

| Section | Description |
|---------|-------------|
| **Description** | Overall world summary |
| **Rules** | Laws, constraints, and governing principles |
| **Locations** | Key places and geography |
| **Factions** | Groups, organizations, and powers |
| **History** | Backstory and significant events |
| **Magic System** | How magic works (or "None") |
| **Technology** | Tech level and notable innovations |
| **Effects** | Environmental phenomena and special conditions |
| **Atmosphere** | Mood, tone, and aesthetic |

## How It Works

### Context Injection

Two injection points in SillyTavern's prompt assembly:

1. **Before Chat History** — Brief header:
   ```
   [World: Everbright Kingdom] A high-fantasy realm where magic flows through ley lines
   ```

2. **After Chat History** — Concise world context with all populated sections, kept under 800 characters total.

### Data Storage

- **Settings** (global): `context.extensionSettings.worldBuildingExtension` — worlds array, profile ID, preferences
- **Per-chat**: `context.chatMetadata.worldBuildingExtension` — active world ID reference

## Project Structure

```
WorldBuildingExtension/
├── index.js              # Entry point — re-exports onActivate
├── manifest.json          # SillyTavern extension manifest
├── style.css              # All styling (BEM, dark theme)
├── init.js                # Extension initialization + onActivate
├── lib/
│   ├── constants.js       # All constants, defaults, shared state
│   ├── data.js            # Context access + worlds CRUD + per-chat assignment
│   ├── prompts.js         # AI prompt builders + context injection text
│   ├── parsers.js         # AI response parsers
│   ├── services.js        # Toast, connection profiles, context inject/remove
│   └── world-manager.js   # Core async logic: generate, AI-edit, activate
└── ui/
    ├── panel.js           # DOM factory — createSettingsPanel
    └── app.js             # Rendering, events, world editor modal, refreshUI
```

## Requirements

- SillyTavern 1.12+
- Connection Manager extension (or built-in `generateQuietPrompt` fallback)

## Troubleshooting

### Extension doesn't appear
- Check browser console for `[WorldBuildingExtension]` messages
- Ensure all files are present in the extension folder
- Hard-refresh SillyTavern (Ctrl+Shift+R)

### "No connection profile selected"
- Install and configure the Connection Manager extension
- Create a connection profile and select it in World Building settings

### World context not appearing in chat
- Verify **Enabled** and **Auto-Inject World Context** are both on
- Ensure a world is selected in the **Active World** dropdown
- Switch chats to trigger re-injection

## License

MIT
