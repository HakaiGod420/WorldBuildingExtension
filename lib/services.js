import {
    EXTENSION_PROMPT_KEY_BEFORE,
    EXTENSION_PROMPT_KEY_AFTER,
    PROMPT_POSITION_BEFORE,
    PROMPT_POSITION_AFTER,
    PROMPT_DEPTH_BEFORE,
    PROMPT_DEPTH_AFTER,
    PROMPT_ROLE_SYSTEM,
} from './constants.js';

import { getContextSafely, getSettings, getActiveWorld } from './data.js';
import { buildWorldBeforeText, buildWorldAfterText } from './prompts.js';

export function getProfileApi(context, profileId) {
    const profiles = context.extensionSettings?.connectionManager?.profiles || [];
    return profiles.find(p => p.id === profileId)?.api;
}

export function getConnectionManagerState(context) {
    const em = context?.extensionSettings;
    const cm = em?.connectionManager;
    const isDisabled = Array.isArray(em?.disabledExtensions) && em.disabledExtensions.includes('connection-manager');
    return {
        available: Boolean(cm) && !isDisabled,
        isDisabled,
        profiles: Array.isArray(cm?.profiles) ? cm.profiles : [],
    };
}

export function getProfileGroupLabel(context, profile) {
    const m = context?.CONNECT_API_MAP?.[profile?.api];
    if (m?.selected === 'openai') return 'Chat Completion';
    if (m?.selected === 'textgenerationwebui') return 'Text Completion';
    return 'Other Profiles';
}

export function getSortedProfilesByGroup(context, profiles) {
    const groups = new Map();
    for (const profile of profiles) {
        if (!profile?.id || !profile?.name) continue;
        const label = getProfileGroupLabel(context, profile);
        const arr = groups.get(label) ?? [];
        arr.push(profile);
        groups.set(label, arr);
    }
    for (const arr of groups.values()) arr.sort((a, b) => a.name.localeCompare(b.name));
    return groups;
}

export function showToast(title, body, type) {
    if (typeof toastr !== 'undefined') {
        const method = type === 'success' ? 'success' : type === 'error' ? 'error' : 'info';
        toastr[method](body, title, { timeOut: 4000 });
    } else {
        console.log(`[WorldBuildingExtension] [${type}] ${title}: ${body}`);
    }
}

export function injectWorldContext(context) {
    if (!context || typeof context.setExtensionPrompt !== 'function') return;

    const settings = getSettings(context);
    if (!settings?.enabled || !settings?.autoInject) {
        removeWorldContext();
        return;
    }

    const world = getActiveWorld(context);
    if (!world) {
        removeWorldContext();
        return;
    }

    const beforeText = buildWorldBeforeText(world);
    const afterText = buildWorldAfterText(world);

    try {
        context.setExtensionPrompt(EXTENSION_PROMPT_KEY_BEFORE, beforeText, PROMPT_POSITION_BEFORE, PROMPT_DEPTH_BEFORE, true, PROMPT_ROLE_SYSTEM);
        context.setExtensionPrompt(EXTENSION_PROMPT_KEY_AFTER, afterText, PROMPT_POSITION_AFTER, PROMPT_DEPTH_AFTER, true, PROMPT_ROLE_SYSTEM);
    } catch (err) {
        console.error('[WorldBuildingExtension] Failed to inject world context:', err);
    }
}

export function removeWorldContext() {
    const ctx = globalThis.SillyTavern?.getContext?.() || null;
    if (!ctx || typeof ctx.setExtensionPrompt !== 'function') return;
    try { ctx.setExtensionPrompt(EXTENSION_PROMPT_KEY_BEFORE, '', 0, 0, false, 0); } catch { /* */ }
    try { ctx.setExtensionPrompt(EXTENSION_PROMPT_KEY_AFTER, '', 0, 0, false, 0); } catch { /* */ }
}
