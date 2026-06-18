import { state } from './constants.js';
import { getContextSafely, getSettings, addWorld, updateWorld, setActiveWorldId, getActiveWorld, getWorlds } from './data.js';
import { buildWorldGenerationMessages, buildSectionEditMessages } from './prompts.js';
import { parseWorldFromResponse, parseSectionEditFromResponse } from './parsers.js';
import { getProfileApi, injectWorldContext, removeWorldContext, showToast } from './services.js';
import { refreshUI } from '../ui/app.js';

async function sendAIRequest(context, profileId, messages, maxTokens) {
    const apiMap = context.CONNECT_API_MAP?.[getProfileApi(context, profileId)];
    const isCC = apiMap?.selected === 'openai';

    if (typeof context.ConnectionManagerRequestService?.sendRequest === 'function') {
        const result = await context.ConnectionManagerRequestService.sendRequest(
            profileId,
            isCC ? messages : messages.map(m => `${m.role}: ${m.content}`).join('\n\n'),
            maxTokens || 2048,
            { stream: false, extractData: true, includePreset: true },
        );
        return result?.content || result?.text || (typeof result === 'string' ? result : '');
    }

    const qp = messages.map(m => m.content).join('\n\n');
    const resp = await context.generateQuietPrompt({ quietPrompt: qp, skipWIAN: true, responseLength: maxTokens || 2048 });
    return resp || '';
}

export async function generateWorld(prompt, worldName) {
    const context = getContextSafely();
    if (!context) return { success: false, error: 'Context unavailable' };

    const settings = getSettings(context);
    if (!settings.connectionProfileId) return { success: false, error: 'No connection profile selected' };
    if (!prompt?.trim()) return { success: false, error: 'Please describe the world' };

    try {
        const messages = buildWorldGenerationMessages(context, prompt.trim(), worldName ? worldName.trim() : '');
        const responseText = await sendAIRequest(context, settings.connectionProfileId, messages, 2048);
        const parsed = parseWorldFromResponse(responseText);

        if (!parsed || !parsed.hasContent) {
            return { success: false, error: 'Failed to parse world from AI response. Try a more specific prompt.' };
        }

        const world = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 10),
            name: parsed.name || 'Generated World',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            sections: parsed.sections,
        };

        addWorld(context, world);
        return { success: true, world };
    } catch (error) {
        console.error('[WorldBuildingExtension] Error generating world:', error);
        return { success: false, error: error.message || 'Unknown error' };
    }
}

export async function editSectionWithAI(worldId, sectionKey, editInstruction) {
    const context = getContextSafely();
    if (!context) return { success: false, error: 'Context unavailable' };

    const settings = getSettings(context);
    if (!settings.connectionProfileId) return { success: false, error: 'No connection profile selected' };

    const world = getActiveWorld(context) || getWorlds(context).find(w => w.id === worldId);
    if (!world) return { success: false, error: 'World not found' };
    if (!editInstruction?.trim()) return { success: false, error: 'Describe what to change' };

    try {
        const messages = buildSectionEditMessages(context, world, sectionKey, editInstruction.trim());
        const responseText = await sendAIRequest(context, settings.connectionProfileId, messages, 1024);
        const newText = parseSectionEditFromResponse(responseText);

        if (newText === null) {
            return { success: false, error: 'Failed to parse AI edit response. Try again.' };
        }

        updateWorld(context, worldId, { sections: { [sectionKey]: newText } });
        return { success: true, text: newText };
    } catch (error) {
        console.error('[WorldBuildingExtension] Error editing section:', error);
        return { success: false, error: error.message || 'Unknown error' };
    }
}

export function activateWorld(worldId) {
    const context = getContextSafely();
    if (!context) return;

    setActiveWorldId(context, worldId);

    if (worldId) {
        injectWorldContext(context);
        const world = getActiveWorld(context);
        showToast('World Active', world?.name || 'World', 'success');
    } else {
        removeWorldContext();
        showToast('World Removed', 'No world active for this chat.', 'info');
    }

    refreshUI();
}

export function onChatChanged() {
    removeWorldContext();
    const context = getContextSafely();
    if (!context) return;
    const settings = getSettings(context);
    const world = getActiveWorld(context);
    if (world && settings.enabled && settings.autoInject) {
        injectWorldContext(context);
    }
}
