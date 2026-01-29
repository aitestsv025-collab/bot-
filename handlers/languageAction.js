
import { userSessions } from '../state.js';
import { getPersistentMarkup, getRoleKeyboard } from '../utils/markups.js';

export async function handleLanguageSelection(ctx) {
    const lang = ctx.match[1];
    const session = userSessions.get(ctx.chat.id);
    if (session) session.language = lang;
    
    await ctx.answerCbQuery(`${lang} Selected! ❤️`);
    return ctx.editMessageText(
        `Uff... *muskurate hue* bahut achi choice hai baby.\n\nAb batao main aaj tumhare liye kya banoon? 🫦`,
        getPersistentMarkup(ctx.chat.id, getRoleKeyboard(ctx.chat.id))
    );
}
