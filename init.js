import { state } from './lib/constants.js';
import { getContextSafely, getSettings } from './lib/data.js';
import { injectWorldContext } from './lib/services.js';
import { initUI, bindChatEvents, ensureSettingsPanel } from './ui/app.js';

function tryInitUI() {
    try {
        const context = getContextSafely();
        if (!context) return false;
        const settings = getSettings(context);
        if (!initUI(context, settings)) return false;
        bindChatEvents(context);
        if (settings.enabled && settings.autoInject) {
            injectWorldContext(context);
        }
        console.info('[WorldBuildingExtension] UI initialized.');
        return true;
    } catch (err) {
        console.error('[WorldBuildingExtension] Init error:', err);
        return false;
    }
}

let initAttempts = 0;
function scheduleUIInit() {
    if (state.uiInitialized) return;
    if (tryInitUI()) { state.uiInitialized = true; return; }
    if (initAttempts >= 20) return;
    initAttempts++;
    setTimeout(scheduleUIInit, 500);
}

export function onActivate() {
    console.info('[WorldBuildingExtension] onActivate called.');
    const context = getContextSafely();
    if (context) {
        bindChatEvents(context);
        const settings = getSettings(context);
        if (settings.enabled && settings.autoInject) {
            injectWorldContext(context);
        }
    }
    if (context?.eventSource && context?.eventTypes) {
        const appReady = context.eventTypes.APP_READY;
        if (appReady) {
            context.eventSource.once(appReady, () => {
                if (!state.uiInitialized) scheduleUIInit();
            });
        }
    }
    scheduleUIInit();
}
