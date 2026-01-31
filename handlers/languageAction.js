
import { userSessions, isPremiumUser } from '../state.js';
import { getRoleKeyboard } from '../utils/markups.js';
import { Markup } from 'telegraf';
import { CONFIG } from '../config.js';

export async function handleLanguageSelection(ctx) {
    try { await ctx.answerCbQuery().catch(() => {}); } catch(e) {}

    const userId = ctx.chat.id;
    const session = userSessions.get(userId);
    if (!session) return;

    // Protection against clever users trying to re-select language after limit
    if (!isPremiumUser(userId) && (session.messageCount || 0) >= CONFIG.FREE_MESSAGE_LIMIT) {
        return ctx.reply("❌ Baby, aapki limit khatam ho chuki hai. Premium join karo na? 🫦");
    }

    const lang = ctx.match[1];
    session.language = lang;
    
    const confirmationText = {
        'Hindi': 'ठीक है जानू, अब मैं हिंदी में बात करूँगी। ❤️',
        'Tamil': 'சரி அன்பే, இனி நான் தமிழில் பேசுவேன். ❤️',
        'Telugu': 'సరే ప్రియుడా, ఇకపై నేను తెలుగులో మాట్లాడతాను. ❤️',
        'English': 'Alright darling, I will speak in English now. ❤️',
        'Hinglish': 'Uff... *muskurate hue* bahut achi choice hai baby.'
    };

    const text = confirmationText[lang] || confirmationText['Hinglish'];

    await ctx.editMessageText(`✅ <b>Language Set: ${lang}</b>\n${text}`, { parse_mode: 'HTML' }).catch(e => console.error(e));

    return ctx.reply(
        "Ab batao main aaj tumhare liye kya banoon? 🫦",
        Markup.inlineKeyboard(getRoleKeyboard(ctx.chat.id))
    );
}
