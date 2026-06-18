import { WORLD_SECTIONS, MAX_CONTEXT_CHARS, MAX_SECTION_CHARS_GEN } from './constants.js';

export function getCharacterContext(context) {
    const charId = context.characterId;
    if (charId === undefined || charId === null) return null;
    const char = context.characters?.[charId];
    if (!char?.data) return null;
    const d = char.data;
    const p = [];
    if (d.name) p.push(`Character: ${d.name}`);
    if (d.description) p.push(`Character Description: ${d.description}`);
    if (d.scenario) p.push(`Scenario: ${d.scenario}`);
    return p.join('\n');
}

export function getChatContext(context, maxMessages) {
    const chat = context.chat;
    if (!Array.isArray(chat) || chat.length === 0) return '';
    const limit = maxMessages || 10;
    return chat.slice(-limit).map(msg => {
        const sender = msg.is_user ? context.name1 : msg.name || context.name2;
        return `${sender}: ${msg.mes || ''}`;
    }).join('\n');
}

export function buildWorldGenerationMessages(context, prompt, worldName) {
    const characterContext = getCharacterContext(context);
    const chatContext = getChatContext(context, 5);

    const sectionKeys = WORLD_SECTIONS.map(s => `"${s.key}"`).join(', ');
    const sectionDescs = WORLD_SECTIONS.map(s => `${s.key}: ${s.label} of the world`).join('\n- ');

    const systemContent = `You are a worldbuilding assistant for roleplay. You create concise, usable world settings.

Respond ONLY with valid JSON:
{"name": "World Name", ${WORLD_SECTIONS.map(s => `"${s.key}": "..."`).join(', ')}}

Rules:
- Be direct and concise. Use clear, functional language — no fluff.
- Each section should be 2-4 sentences. Max ${MAX_SECTION_CHARS_GEN} characters per section.
- The world must be internally consistent: rules affect locations, factions reflect history, atmosphere matches description.
- Focus on what matters for roleplay: conflicts, tensions, constraints, opportunities.
- Write in present tense. Describe the world as it IS.
- If a section does not apply, write "None" instead of leaving it empty.
Sections:
- ${sectionDescs}`;

    let userContent = `Create a world setting based on this prompt:\n"${prompt}"\n`;
    if (worldName) userContent += `\nWorld name should be: "${worldName}"\n`;
    if (characterContext) userContent += `\n--- Character Context ---\n${characterContext}\n`;
    if (chatContext) userContent += `\n--- Recent Chat ---\n${chatContext}\n`;
    userContent += `\nGenerate the world. Respond with JSON only.`;

    return [
        { role: 'system', content: systemContent },
        { role: 'user', content: userContent },
    ];
}

export function buildSectionEditMessages(context, world, sectionKey, editInstruction) {
    const sectionInfo = WORLD_SECTIONS.find(s => s.key === sectionKey);
    const sectionLabel = sectionInfo ? sectionInfo.label : sectionKey;
    const currentContent = world.sections[sectionKey] || '(empty)';

    const characterContext = getCharacterContext(context);
    const chatContext = getChatContext(context, 5);

    const systemContent = `You are a worldbuilding editor. You update exactly one section of a world setting based on an edit instruction.

Respond ONLY with valid JSON:
{"text": "The revised section content"}

Rules:
- Keep the style consistent with the rest of the world.
- Be direct and concise. 2-4 sentences, max ${MAX_SECTION_CHARS_GEN} chars.
- Only rewrite the requested section — do not add other sections.
- If the instruction asks to remove or is unclear, return an empty string.`;

    let userContent = `World: ${world.name}\n`;
    userContent += `Section: ${sectionLabel}\n`;
    userContent += `Current content:\n"${currentContent}"\n\n`;
    userContent += `Edit instruction: ${editInstruction}\n`;
    if (characterContext) userContent += `\n--- Character Context ---\n${characterContext}\n`;
    if (chatContext) userContent += `\n--- Recent Chat ---\n${chatContext}\n`;
    userContent += `\nProvide the revised "${sectionLabel}" section. Respond with JSON only.`;

    return [
        { role: 'system', content: systemContent },
        { role: 'user', content: userContent },
    ];
}

export function buildWorldBeforeText(world) {
    const desc = world.sections.description || '';
    const summary = desc.length > 120 ? desc.slice(0, 117) + '...' : desc;
    return `[World: ${world.name}]` + (summary ? ` ${summary}` : '');
}

export function buildWorldAfterText(world) {
    const lines = [`[World Context \u2014 ${world.name}]`];

    for (const { key, label } of WORLD_SECTIONS) {
        const content = (world.sections[key] || '').trim();
        if (!content || content === 'None') continue;
        lines.push(`${label}: ${content}`);
    }

    let full = lines.join('\n');

    if (full.length > MAX_CONTEXT_CHARS) {
        full = full.slice(0, MAX_CONTEXT_CHARS - 3) + '...';
    }

    return full;
}
