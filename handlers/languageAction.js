
import { userSessions, isPremiumUser, getRandomName } from '../state.js';
import { generateTextReply } from '../services/aiText.js';
import { CONFIG } from '../config.js';

export async function handleLanguageSelection(ctx) {
    try { await ctx.answerCbQuery().catch(() => {}); } catch(e) {}

    const userId = ctx.chat.id;
    const session = userSessions.get(userId);
    if (!session) return;

    if (!isPremiumUser(userId) && (session.messageCount || 0) >= CONFIG.FREE_MESSAGE_LIMIT) {
        return ctx.reply("❌ Baby, limit khatam ho chuki hai.");
    }

    const lang = ctx.match[1];
    session.language = lang;
    session.personaName = getRandomName();

    // 1. Edit current message to say it's ready (removes buttons)
    await ctx.editMessageText(`✅ <b>Taiyar Hoon!</b>\nMain <b>${session.personaName}</b> ban gayi hoon. 🫦\n\nAb maza shuru karte hain...`, { parse_mode: 'HTML' }).catch(() => {});
    
    // 2. Start the AI chat with a new message
    try {
        const reply = await generateTextReply(session.role, session.language, "Hi baby", isPremiumUser(userId), "", session.personaName);
        return ctx.reply(`*${session.personaName}*:\n\n${reply}`, { parse_mode: 'Markdown' });
    } catch (err) {
        return ctx.reply(`Hey baby! ❤️ Main ready hoon.`);
    }
}
