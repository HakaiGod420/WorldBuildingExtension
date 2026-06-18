import { WORLD_SECTIONS } from './constants.js';

export function parseWorldFromResponse(responseText) {
    if (!responseText || typeof responseText !== 'string') return null;

    let cleaned = responseText.trim();

    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleaned = jsonMatch[0];

    let parsed = null;
    try {
        parsed = JSON.parse(cleaned);
    } catch {
        return null;
    }

    if (!parsed || typeof parsed !== 'object') return null;

    const name = typeof parsed.name === 'string' ? parsed.name.trim() : 'Generated World';

    const sections = {};
    let hasContent = false;
    for (const { key } of WORLD_SECTIONS) {
        const val = parsed[key];
        if (typeof val === 'string' && val.trim()) {
            sections[key] = val.trim();
            hasContent = true;
        } else {
            sections[key] = '';
        }
    }

    return { name, sections, hasContent };
}

export function parseSectionEditFromResponse(responseText) {
    if (!responseText || typeof responseText !== 'string') return null;

    let cleaned = responseText.trim();

    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleaned = jsonMatch[0];

    try {
        const parsed = JSON.parse(cleaned);
        if (parsed && typeof parsed.text === 'string') {
            return parsed.text.trim();
        }
    } catch {
        // not JSON, return raw text without surrounding quotes
    }

    const stripped = cleaned.replace(/^["']|["']$/g, '').trim();
    return stripped || null;
}
