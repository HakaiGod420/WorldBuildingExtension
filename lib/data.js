import { MODULE_NAME, WORLD_METADATA_KEY, defaultSettings, defaultWorldSections } from './constants.js';

export function getContextSafely() {
    if (!globalThis.SillyTavern || typeof globalThis.SillyTavern.getContext !== 'function') {
        return null;
    }
    return globalThis.SillyTavern.getContext();
}

export function getSettings(context) {
    if (!context?.extensionSettings) {
        return structuredClone(defaultSettings);
    }
    if (!context.extensionSettings[MODULE_NAME]) {
        context.extensionSettings[MODULE_NAME] = structuredClone(defaultSettings);
    }
    const settings = context.extensionSettings[MODULE_NAME];
    let changed = false;
    for (const key of Object.keys(defaultSettings)) {
        if (!Object.hasOwn(settings, key)) {
            settings[key] = defaultSettings[key];
            changed = true;
        }
    }
    if (changed) context.saveSettingsDebounced?.();
    return settings;
}

export function generateId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return 'w_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
}

export function createWorld(name, sections) {
    const now = new Date().toISOString();
    return {
        id: generateId(),
        name: name || 'Unnamed World',
        createdAt: now,
        updatedAt: now,
        sections: Object.keys(defaultWorldSections).reduce((acc, key) => {
            acc[key] = (sections && sections[key]) ? sections[key] : '';
            return acc;
        }, {}),
    };
}

export function getWorlds(context) {
    const settings = getSettings(context);
    if (!Array.isArray(settings.worlds)) {
        settings.worlds = [];
    }
    return settings.worlds;
}

export function getWorldById(context, worldId) {
    if (!worldId) return null;
    const worlds = getWorlds(context);
    return worlds.find(w => w.id === worldId) || null;
}

export function addWorld(context, world) {
    const worlds = getWorlds(context);
    worlds.push(world);
    context.saveSettingsDebounced?.();
}

export function updateWorld(context, worldId, updates) {
    const worlds = getWorlds(context);
    const world = worlds.find(w => w.id === worldId);
    if (!world) return;
    if (updates.name !== undefined) world.name = updates.name;
    if (updates.sections) {
        for (const key of Object.keys(defaultWorldSections)) {
            if (updates.sections[key] !== undefined) {
                world.sections[key] = updates.sections[key];
            }
        }
    }
    world.updatedAt = new Date().toISOString();
    context.saveSettingsDebounced?.();
}

export function deleteWorld(context, worldId) {
    const settings = getSettings(context);
    settings.worlds = (settings.worlds || []).filter(w => w.id !== worldId);
    context.saveSettingsDebounced?.();
}

export function getActiveWorldId(context) {
    if (!context?.chatMetadata) return null;
    if (!context.chatMetadata[WORLD_METADATA_KEY]) {
        context.chatMetadata[WORLD_METADATA_KEY] = { activeWorldId: null };
    }
    return context.chatMetadata[WORLD_METADATA_KEY].activeWorldId || null;
}

export function setActiveWorldId(context, worldId) {
    if (!context?.chatMetadata) return;
    if (!context.chatMetadata[WORLD_METADATA_KEY]) {
        context.chatMetadata[WORLD_METADATA_KEY] = { activeWorldId: null };
    }
    context.chatMetadata[WORLD_METADATA_KEY].activeWorldId = worldId || null;
    if (typeof context.saveMetadataDebounced === 'function') {
        context.saveMetadataDebounced();
    }
}

export function getActiveWorld(context) {
    const worldId = getActiveWorldId(context);
    if (!worldId) return null;
    return getWorldById(context, worldId);
}

export function clearActiveWorld(context) {
    if (context?.chatMetadata?.[WORLD_METADATA_KEY]) {
        context.chatMetadata[WORLD_METADATA_KEY].activeWorldId = null;
        if (typeof context.saveMetadataDebounced === 'function') {
            context.saveMetadataDebounced();
        }
    }
}
