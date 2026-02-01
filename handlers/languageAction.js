
import { userSessions, isPremiumUser, getRandomName } from '../state.js';
import { generateTextReply } from '../services/aiText.js';
import { CONFIG } from '../config.js';
import { SCENARIOS } from '../constants/scenarios.js';

export async function handleLanguageSelection(ctx) {
    try { await ctx.answerCbQuery().catch(() => {}); } catch(e) {}

    const userId = ctx.chat.id;
    const session = userSessions.get(userId);
    if (!session) return;

    if (!isPremiumUser(userId) && (session.messageCount || 0) >= CONFIG.FREE_MESSAGE_LIMIT) {
        return ctx.reply("❌ Baby, limit khatam ho chuki hai. 🫦");
    }

    const lang = ctx.match[1];
    session.language = lang;
    session.personaName = getRandomName();

    // STEP 3: CLEAN COMPLETION
    await ctx.editMessageText(`✅ <b>Taiyar Hoon!</b>\nMain <b>${session.personaName}</b> ban gayi hoon. 🫦`, { parse_mode: 'HTML' }).catch(() => {});
    
    // Get the story scenario based on role
    const scenarioPrompt = SCENARIOS[session.role] || SCENARIOS['Girlfriend'];
    const firstPrompt = `[SCENARIO: ${scenarioPrompt}] - Start the conversation based on this scenario.`;

    // Start the AI chat with the story scenario
    try {
        const reply = await generateTextReply(session.role, session.language, firstPrompt, isPremiumUser(userId), session.customRoleName || "", session.personaName);
        return ctx.reply(`*${session.personaName}*:\n\n${reply}`, { parse_mode: 'Markdown' });
    } catch (err) {
        return ctx.reply(`Hey baby! ❤️ Main ready hoon. (Scenario: ${scenarioPrompt})`);
    }
}
