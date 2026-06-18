import { SETTINGS_PANEL_ID, PROFILE_SELECT_ID, PROFILE_STATUS_ID, ACTIVE_WORLD_SELECT_ID, WORLD_LIST_ID, WORLD_SECTIONS } from '../lib/constants.js';

export function makeRow(labelText, htmlFor, children, options) {
    const row = document.createElement('div');
    row.className = 'wb-ext__row' + (options?.setting ? ' wb-ext__row--setting' : '');
    const label = document.createElement('label');
    label.htmlFor = htmlFor;
    label.textContent = labelText;
    row.append(label);
    for (const child of children) row.append(child);
    return row;
}

export function createSettingsPanel() {
    const wrapper = document.createElement('div');
    wrapper.id = SETTINGS_PANEL_ID;
    wrapper.className = 'wb-ext';

    const drawer = document.createElement('div');
    drawer.className = 'inline-drawer';

    const toggle = document.createElement('div');
    toggle.className = 'inline-drawer-toggle inline-drawer-header';
    const title = document.createElement('b');
    title.textContent = 'World Building';
    const icon = document.createElement('div');
    icon.className = 'inline-drawer-icon fa-solid fa-circle-chevron-down down';
    toggle.append(title, icon);

    const content = document.createElement('div');
    content.className = 'inline-drawer-content';

    // Enable checkbox
    const enableCb = document.createElement('input');
    enableCb.id = 'world_building_extension_enabled';
    enableCb.type = 'checkbox';
    enableCb.className = 'wb-ext__checkbox';
    content.append(makeRow('Enabled', enableCb.id, [enableCb], { setting: true }));

    // Connection Profile
    const profileSelect = document.createElement('select');
    profileSelect.id = PROFILE_SELECT_ID;
    profileSelect.className = 'text_pole wb-ext__select';
    const profileStatus = document.createElement('small');
    profileStatus.id = PROFILE_STATUS_ID;
    profileStatus.className = 'wb-ext__status';
    const profileWrapper = document.createElement('div');
    profileWrapper.append(makeRow('Connection Profile', PROFILE_SELECT_ID, [profileSelect], { setting: true }), profileStatus);
    content.append(profileWrapper);

    // Auto-inject checkbox
    const autoInjectCb = document.createElement('input');
    autoInjectCb.id = 'world_building_extension_auto_inject';
    autoInjectCb.type = 'checkbox';
    autoInjectCb.className = 'wb-ext__checkbox';
    content.append(makeRow('Auto-Inject World Context', autoInjectCb.id, [autoInjectCb], { setting: true }));

    // Divider
    const divider = document.createElement('hr');
    divider.className = 'wb-ext__divider';
    content.append(divider);

    // Active World Dropdown
    const activeSelect = document.createElement('select');
    activeSelect.id = ACTIVE_WORLD_SELECT_ID;
    activeSelect.className = 'text_pole wb-ext__select';
    const activeHint = document.createElement('small');
    activeHint.className = 'wb-ext__hint';
    activeHint.textContent = 'One world per chat. Select None to remove.';
    const activeWrapper = document.createElement('div');
    activeWrapper.append(makeRow('Active World', ACTIVE_WORLD_SELECT_ID, [activeSelect], { setting: true }), activeHint);
    content.append(activeWrapper);

    // Divider
    const divider2 = document.createElement('hr');
    divider2.className = 'wb-ext__divider';
    content.append(divider2);

    // World list header
    const listHeader = document.createElement('div');
    listHeader.className = 'wb-ext__list-header';
    const listTitle = document.createElement('b');
    listTitle.textContent = 'Saved Worlds';
    const listCount = document.createElement('span');
    listCount.id = 'world_building_extension_world_count';
    listCount.className = 'wb-ext__list-count';
    listHeader.append(listTitle, listCount);

    // World list
    const worldList = document.createElement('div');
    worldList.id = WORLD_LIST_ID;
    worldList.className = 'wb-ext__world-list';

    // Create New World button
    const createBtn = document.createElement('button');
    createBtn.id = 'world_building_extension_create';
    createBtn.className = 'menu_button wb-ext__btn wb-ext__btn--create';
    createBtn.textContent = '+ Create New World';

    content.append(listHeader, worldList, createBtn);
    drawer.append(toggle, content);
    wrapper.append(drawer);
    return wrapper;
}
