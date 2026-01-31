
import { userSessions, isPremiumUser } from '../state.js';
import { getRoleKeyboard } from '../utils/markups.js';
import { Markup } from 'telegraf';
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

    // EDIT the current message to show Roles instead of sending a new one
    return ctx.editMessageText(
        `✅ Language: <b>${lang}</b>\n\nAb batao main aaj tumhare liye kya banoon? 🫦`,
        {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard(getRoleKeyboard(ctx.chat.id))
        }
    ).catch(e => console.error("Edit Lang Error:", e));
}
