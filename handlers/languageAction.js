
import { userSessions, isPremiumUser, getRandomName } from '../state.js';
import { generateTextReply } from '../services/aiText.js';
import { CONFIG } from '../config.js';

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
    
    // Start the AI chat
    try {
        const reply = await generateTextReply(session.role, session.language, "Hi baby", isPremiumUser(userId), "", session.personaName);
        return ctx.reply(`*${session.personaName}*:\n\n${reply}`, { parse_mode: 'Markdown' });
    } catch (err) {
        return ctx.reply(`Hey baby! ❤️ Main ready hoon.`);
    }
}
