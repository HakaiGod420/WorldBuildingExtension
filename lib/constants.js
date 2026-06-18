export const MODULE_NAME = 'worldBuildingExtension';
export const WORLD_METADATA_KEY = 'worldBuildingExtension';
export const SETTINGS_PANEL_ID = 'world_building_extension_settings';
export const PROFILE_SELECT_ID = 'world_building_extension_connection_profile';
export const PROFILE_STATUS_ID = 'world_building_extension_profile_status';
export const ACTIVE_WORLD_SELECT_ID = 'world_building_extension_active_world';
export const WORLD_LIST_ID = 'world_building_extension_world_list';
export const EXTENSION_PROMPT_KEY_BEFORE = MODULE_NAME + '_before';
export const EXTENSION_PROMPT_KEY_AFTER = MODULE_NAME + '_after';
export const PROMPT_POSITION_BEFORE = 1;
export const PROMPT_POSITION_AFTER = 2;
export const PROMPT_DEPTH_BEFORE = 0;
export const PROMPT_DEPTH_AFTER = 2;
export const PROMPT_ROLE_SYSTEM = 0;
export const MAX_CONTEXT_CHARS = 800;
export const MAX_SECTION_CHARS_GEN = 300;

export const WORLD_SECTIONS = [
    { key: 'description', label: 'Description' },
    { key: 'rules', label: 'Rules' },
    { key: 'locations', label: 'Locations' },
    { key: 'factions', label: 'Factions' },
    { key: 'history', label: 'History' },
    { key: 'magicSystem', label: 'Magic System' },
    { key: 'technology', label: 'Technology' },
    { key: 'effects', label: 'Effects' },
    { key: 'atmosphere', label: 'Atmosphere' },
];

export const CONNECTION_PROFILE_EVENTS = [
    'CONNECTION_PROFILE_CREATED',
    'CONNECTION_PROFILE_UPDATED',
    'CONNECTION_PROFILE_DELETED',
];

export const defaultWorldSections = Object.freeze({
    description: '',
    rules: '',
    locations: '',
    factions: '',
    history: '',
    magicSystem: '',
    technology: '',
    effects: '',
    atmosphere: '',
});

export const defaultSettings = Object.freeze({
    enabled: true,
    connectionProfileId: '',
    autoInject: true,
    worlds: [],
});

export const state = {
    isGenerating: false,
    isEditing: false,
    chatEventsBound: false,
    profileEventsBound: false,
    uiInitialized: false,
};
