import {
    PROFILE_SELECT_ID,
    PROFILE_STATUS_ID,
    ACTIVE_WORLD_SELECT_ID,
    WORLD_LIST_ID,
    WORLD_SECTIONS,
    CONNECTION_PROFILE_EVENTS,
    MAX_SECTION_CHARS_GEN,
    state,
} from '../lib/constants.js';

import { getContextSafely, getSettings, getWorlds, getWorldById, getActiveWorldId, setActiveWorldId, getActiveWorld, updateWorld, deleteWorld } from '../lib/data.js';
import { getConnectionManagerState, getSortedProfilesByGroup, showToast, injectWorldContext, removeWorldContext } from '../lib/services.js';
import { generateWorld, editSectionWithAI, activateWorld, onChatChanged } from '../lib/world-manager.js';
import { createSettingsPanel } from './panel.js';

// ==================== Status ====================

export function setStatus(text) {
    const el = document.getElementById(PROFILE_STATUS_ID);
    if (el) el.textContent = text;
}

// ==================== Profile Rendering ====================

export function renderConnectionProfileOptions(context, settings) {
    const select = document.getElementById(PROFILE_SELECT_ID);
    if (!select) return;

    const { available, isDisabled, profiles } = getConnectionManagerState(context);
    select.innerHTML = '';

    const def = document.createElement('option');
    def.value = '';
    def.textContent = 'Select a Connection Profile';
    select.append(def);

    if (!available) {
        select.disabled = true;
        setStatus(isDisabled ? 'Connection Manager is disabled.' : 'Connection Manager is unavailable.');
        return;
    }
    select.disabled = false;

    const savedExists = !settings.connectionProfileId || profiles.some(p => p.id === settings.connectionProfileId);
    if (!savedExists) {
        settings.connectionProfileId = '';
        context.saveSettingsDebounced?.();
    }

    const grouped = getSortedProfilesByGroup(context, profiles);
    for (const [label, groupProfiles] of grouped.entries()) {
        const group = document.createElement('optgroup');
        group.label = label;
        for (const profile of groupProfiles) {
            const opt = document.createElement('option');
            opt.value = profile.id;
            opt.textContent = profile.name;
            group.append(opt);
        }
        select.append(group);
    }

    select.value = settings.connectionProfileId || '';
    setStatus(profiles.length ? 'Used by World Building only.' : 'No connection profiles found.');
}

// ==================== Active World Dropdown ====================

export function renderActiveWorldDropdown(context) {
    const select = document.getElementById(ACTIVE_WORLD_SELECT_ID);
    if (!select) return;

    const worlds = getWorlds(context);
    const activeId = getActiveWorldId(context);

    select.innerHTML = '';

    const noneOpt = document.createElement('option');
    noneOpt.value = '';
    noneOpt.textContent = 'None (no world active)';
    select.append(noneOpt);

    for (const world of worlds) {
        const opt = document.createElement('option');
        opt.value = world.id;
        opt.textContent = world.name;
        if (world.id === activeId) opt.selected = true;
        select.append(opt);
    }

    select.value = activeId || '';
}

// ==================== World List Cards ====================

function renderWorldList(context) {
    const container = document.getElementById(WORLD_LIST_ID);
    const countEl = document.getElementById('world_building_extension_world_count');
    if (!container) return;

    const worlds = getWorlds(context);
    container.innerHTML = '';

    if (countEl) {
        countEl.textContent = worlds.length ? `(${worlds.length})` : '';
    }

    if (worlds.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'wb-ext__empty';
        empty.textContent = 'No worlds created yet. Click "Create New World" to start.';
        container.append(empty);
        return;
    }

    const activeId = getActiveWorldId(context);

    for (const world of worlds) {
        const card = document.createElement('div');
        card.className = 'wb-ext__world-card';
        if (world.id === activeId) card.classList.add('wb-ext__world-card--active');

        const header = document.createElement('div');
        header.className = 'wb-ext__world-card-header';

        const name = document.createElement('span');
        name.className = 'wb-ext__world-card-name';
        name.textContent = world.name;

        const actions = document.createElement('div');
        actions.className = 'wb-ext__world-card-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'menu_button wb-ext__world-card-btn wb-ext__world-card-btn--edit';
        editBtn.textContent = '\u270E';
        editBtn.title = 'Edit world';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openWorldEditor(context, world.id);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'menu_button wb-ext__world-card-btn wb-ext__world-card-btn--delete';
        deleteBtn.textContent = '\u2715';
        deleteBtn.title = 'Delete world';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`Delete "${world.name}"? This cannot be undone.`)) {
                const wasActive = getActiveWorldId(context) === world.id;
                deleteWorld(context, world.id);
                if (wasActive) {
                    setActiveWorldId(context, null);
                    removeWorldContext();
                }
                refreshUI();
                showToast('Deleted', `"${world.name}" removed.`, 'info');
            }
        });

        actions.append(editBtn, deleteBtn);
        header.append(name, actions);

        const preview = document.createElement('div');
        preview.className = 'wb-ext__world-card-preview';
        const desc = world.sections.description || '';
        preview.textContent = desc.length > 100 ? desc.slice(0, 97) + '...' : desc || 'No description';

        const meta = document.createElement('div');
        meta.className = 'wb-ext__world-card-meta';
        const sectionCount = Object.values(world.sections).filter(v => v && v.trim() && v !== 'None').length;
        const date = new Date(world.updatedAt);
        const timeAgo = formatTimeAgo(date);
        meta.textContent = `${sectionCount} sections \u00B7 edited ${timeAgo}`;

        const clickTarget = document.createElement('div');
        clickTarget.className = 'wb-ext__world-card-click';
        clickTarget.textContent = world.id === activeId ? 'Active in this chat' : 'Click to activate';
        clickTarget.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = world.id === activeId ? null : world.id;
            activateWorld(id);
        });

        card.append(header, preview, meta, clickTarget);
        container.append(card);
    }
}

function formatTimeAgo(date) {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

// ==================== World Editor Modal ====================

let editorModal = null;

function closeEditorModal() {
    if (editorModal) {
        editorModal.remove();
        editorModal = null;
    }
}

export function openWorldEditor(context, worldId) {
    closeEditorModal();

    const world = worldId ? getWorldById(context, worldId) : null;
    const isNew = !world;
    const editWorldId = world ? world.id : null;

    const overlay = document.createElement('div');
    overlay.className = 'wb-ext__modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'wb-ext__modal';

    const title = document.createElement('h3');
    title.className = 'wb-ext__modal-title';
    title.textContent = isNew ? 'Create New World' : `Edit: ${world.name}`;

    // World name input
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'World Name';
    nameLabel.className = 'wb-ext__modal-label';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'text_pole wb-ext__modal-name';
    nameInput.value = world ? world.name : '';
    nameInput.placeholder = 'e.g., Everbright Kingdom';

    // Generation prompt (for new worlds)
    const genSection = document.createElement('div');
    genSection.className = 'wb-ext__modal-gen-section';

    const genLabel = document.createElement('label');
    genLabel.textContent = isNew ? 'Describe the world to generate' : 'Regenerate from prompt';
    genLabel.className = 'wb-ext__modal-label';

    const genPrompt = document.createElement('textarea');
    genPrompt.className = 'text_pole wb-ext__modal-gen-prompt';
    genPrompt.rows = 3;
    genPrompt.placeholder = 'Describe the world you want to create. Be specific about the setting, rules, and tone.';

    const genBtn = document.createElement('button');
    genBtn.className = 'menu_button wb-ext__btn wb-ext__btn--generate';
    genBtn.textContent = 'Generate World';
    genBtn.disabled = true;

    genSection.append(genLabel, genPrompt, genBtn);

    // Section textareas
    const sectionsContainer = document.createElement('div');
    sectionsContainer.className = 'wb-ext__modal-sections';

    const sectionLabel = document.createElement('label');
    sectionLabel.textContent = 'World Sections';
    sectionLabel.className = 'wb-ext__modal-label';

    sectionsContainer.append(sectionLabel);

    const sectionFields = {};

    for (const { key, label } of WORLD_SECTIONS) {
        const fieldWrap = document.createElement('div');
        fieldWrap.className = 'wb-ext__modal-section-field';

        const fieldHeader = document.createElement('div');
        fieldHeader.className = 'wb-ext__modal-section-header';

        const fieldLabel = document.createElement('span');
        fieldLabel.className = 'wb-ext__modal-section-label';
        fieldLabel.textContent = label;

        const aiEditBtn = document.createElement('button');
        aiEditBtn.className = 'menu_button wb-ext__modal-section-ai-btn';
        aiEditBtn.textContent = 'AI Edit';
        aiEditBtn.disabled = !world && !genPrompt.value.trim();

        const textarea = document.createElement('textarea');
        textarea.className = 'text_pole wb-ext__modal-section-textarea';
        textarea.rows = 3;
        textarea.value = world ? (world.sections[key] || '') : '';
        textarea.placeholder = `${label} of the world...`;
        textarea.dataset.sectionKey = key;

        fieldHeader.append(fieldLabel, aiEditBtn);
        fieldWrap.append(fieldHeader, textarea);
        sectionsContainer.append(fieldWrap);

        sectionFields[key] = { textarea, aiEditBtn };

        // AI Edit handler
        aiEditBtn.addEventListener('click', async () => {
            if (state.isEditing) return;

            const instruction = prompt(`What should change about "${label}"? Describe the edit:`);
            if (!instruction?.trim()) return;

            state.isEditing = true;
            aiEditBtn.disabled = true;
            aiEditBtn.textContent = 'Editing...';

            try {
                const targetId = editWorldId || (world ? world.id : null);
                if (!targetId) {
                    showToast('Error', 'Save the world first before AI editing.', 'error');
                    return;
                }
                const result = await editSectionWithAI(targetId, key, instruction);
                if (result.success) {
                    textarea.value = result.text;
                    showToast('Updated', `"${label}" edited.`, 'success');
                } else {
                    showToast('Error', result.error, 'error');
                }
            } catch (err) {
                showToast('Error', err.message, 'error');
            } finally {
                state.isEditing = false;
                aiEditBtn.disabled = false;
                aiEditBtn.textContent = 'AI Edit';
            }
        });
    }

    // Enable generate button when prompt has content
    genPrompt.addEventListener('input', () => {
        const hasPrompt = genPrompt.value.trim().length > 0;
        genBtn.disabled = !hasPrompt || state.isGenerating;
        if (!world) {
            for (const { key } of WORLD_SECTIONS) {
                const field = sectionFields[key];
                if (field) field.aiEditBtn.disabled = !hasPrompt;
            }
        }
    });

    // Generate button handler
    genBtn.addEventListener('click', async () => {
        const prompt = genPrompt.value.trim();
        if (!prompt || state.isGenerating) return;

        state.isGenerating = true;
        genBtn.disabled = true;
        genBtn.textContent = 'Generating...';

        try {
            const result = await generateWorld(prompt, nameInput.value.trim());
            if (result.success) {
                closeEditorModal();
                showToast('Created', `"${result.world.name}" generated.`, 'success');
                refreshUI();
            } else {
                showToast('Error', result.error, 'error');
                genBtn.disabled = false;
                genBtn.textContent = 'Generate World';
            }
        } catch (err) {
            showToast('Error', err.message, 'error');
            genBtn.disabled = false;
            genBtn.textContent = 'Generate World';
        } finally {
            state.isGenerating = false;
        }
    });

    // Bottom buttons
    const btnRow = document.createElement('div');
    btnRow.className = 'wb-ext__modal-btn-row';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'menu_button';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', closeEditorModal);

    const saveBtn = document.createElement('button');
    saveBtn.className = 'menu_button wb-ext__btn--save';
    saveBtn.textContent = 'Save Changes';
    saveBtn.style.display = isNew ? 'none' : '';
    saveBtn.addEventListener('click', () => {
        if (!editWorldId) return;
        updateWorld(context, editWorldId, {
            name: nameInput.value.trim() || 'Unnamed World',
            sections: Object.fromEntries(
                WORLD_SECTIONS.map(({ key }) => [key, sectionFields[key].textarea.value])
            ),
        });
        closeEditorModal();
        refreshUI();
        showToast('Saved', 'World updated.', 'success');
    });

    btnRow.append(cancelBtn, saveBtn);

    // Assemble modal
    modal.append(title, nameLabel, nameInput, genSection, sectionsContainer, btnRow);
    overlay.append(modal);
    document.body.append(overlay);

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeEditorModal();
    });

    if (isNew) genPrompt.focus();
    else nameInput.focus();

    editorModal = overlay;
}

// ==================== Refresh UI ====================

export function refreshUI() {
    const context = getContextSafely();
    if (!context) return;

    const settings = getSettings(context);

    const el = (id) => document.getElementById(id);
    const enabledCb = el('world_building_extension_enabled');
    if (enabledCb) enabledCb.checked = settings.enabled;
    const ai = el('world_building_extension_auto_inject');
    if (ai) ai.checked = settings.autoInject;

    renderConnectionProfileOptions(context, settings);
    renderActiveWorldDropdown(context);
    renderWorldList(context);

    const createBtn = el('world_building_extension_create');
    if (createBtn) {
        createBtn.disabled = state.isGenerating;
    }
}

// ==================== Event Binding ====================

function bindEvents(context, settings) {
    const bind = (id, event, handler) => {
        const el = document.getElementById(id);
        if (el && !el.dataset.wbeBound) {
            el.dataset.wbeBound = 'true';
            el.addEventListener(event, handler);
        }
    };

    bind('world_building_extension_enabled', 'change', function () {
        settings.enabled = this.checked;
        context.saveSettingsDebounced?.();
        if (settings.enabled && settings.autoInject) {
            injectWorldContext(context);
        } else {
            removeWorldContext();
        }
    });

    bind(PROFILE_SELECT_ID, 'change', function () {
        settings.connectionProfileId = this.value;
        context.saveSettingsDebounced?.();
    });

    bind('world_building_extension_auto_inject', 'change', function () {
        settings.autoInject = this.checked;
        context.saveSettingsDebounced?.();
        if (settings.autoInject && settings.enabled) {
            injectWorldContext(context);
        } else {
            removeWorldContext();
        }
    });

    bind(ACTIVE_WORLD_SELECT_ID, 'change', function () {
        activateWorld(this.value || null);
    });

    bind('world_building_extension_create', 'click', () => {
        openWorldEditor(context, null);
    });
}

function bindConnectionProfileEvents(context) {
    if (!context?.eventSource || !context?.eventTypes || state.profileEventsBound) return;
    for (const eventName of CONNECTION_PROFILE_EVENTS) {
        const eventType = context.eventTypes[eventName];
        if (!eventType) continue;
        context.eventSource.on(eventType, () => refreshUI());
    }
    state.profileEventsBound = true;
}

export function initUI(context, settings) {
    if (!ensureSettingsPanel()) return false;
    bindEvents(context, settings);
    bindConnectionProfileEvents(context);
    refreshUI();
    return true;
}

export function bindChatEvents(context) {
    if (!context?.eventSource || !context?.eventTypes || state.chatEventsBound) return;

    const cc = context.eventTypes.CHAT_CHANGED;
    if (cc) {
        context.eventSource.on(cc, () => {
            onChatChanged();
            refreshUI();
        });
    }

    const ms = context.eventTypes.MESSAGE_SENT;
    if (ms) {
        context.eventSource.on(ms, () => {
            const ctx = getContextSafely();
            if (!ctx) return;
            const s = getSettings(ctx);
            const w = getActiveWorld(ctx);
            if (w && s.enabled && s.autoInject) {
                injectWorldContext(ctx);
            }
        });
    }

    state.chatEventsBound = true;
}

// ==================== Panel Init ====================

function getSettingsContainer() {
    return document.getElementById('extensions_settings') || document.getElementById('extensions_settings2');
}

export function ensureSettingsPanel() {
    let panel = document.getElementById('world_building_extension_settings');
    if (panel) return panel;
    const container = getSettingsContainer();
    if (!container) return null;
    panel = createSettingsPanel();
    container.append(panel);
    return panel;
}
