
import { userSessions, isPremiumUser } from '../state.js';
import { ROLES } from '../constants/roles.js';
import { CONFIG } from '../config.js';
import { Markup } from 'telegraf';
import { getLanguageKeyboard } from '../utils/markups.js';

export async function handleRoleSelection(ctx) {
    try { await ctx.answerCbQuery().catch(() => {}); } catch(e) {}
    const roleId = ctx.match[1];
    const userId = ctx.chat.id;
    const session = userSessions.get(userId);
    if (!session) return;

    if (!isPremiumUser(userId) && (session.messageCount || 0) >= CONFIG.FREE_MESSAGE_LIMIT) {
        return ctx.reply("❌ Limit khatam baby. 🫦");
    }

    const isPremiumRole = ROLES.PREMIUM.some(r => r.id === roleId);
    if (isPremiumRole && !isPremiumUser(userId)) {
        return ctx.reply("❌ Ye Role Premium hai baby! Join karo na? 🫦");
    }

    session.role = roleId;

    if (roleId === 'Custom') {
        await ctx.editMessageText("💍 <b>Custom Persona Mode</b>", { parse_mode: 'HTML' }).catch(() => {});
        session.awaitingCustomRole = true;
        session.customRoleStep = 'NAME';
        return ctx.reply(`Main wahi banungi jo tum bologe baby...\n\nPehle batao main aaj kya banoon? (Example: 'Pados wali bhabhi')`, { parse_mode: 'Markdown' });
    }

    const allRoles = [...ROLES.FREE, ...ROLES.PREMIUM];
    const roleObj = allRoles.find(r => r.id === roleId);
    let rawLabel = roleObj?.label || roleId;

    /**
     * LOGIC: 
     * 1. Pehle '(' se split karo taaki '(18)' wala part nikal jaye.
     * 2. Phir emojis remove karne ke liye replace use karo.
     */
    const cleanRoleName = rawLabel.split('(')[0].replace(/[^\w\s]/gi, '').trim();

    // STEP 2: SHOW LANGUAGE - Age and emoji removed from prompt
    return ctx.editMessageText(
        `Select your <b>${cleanRoleName}</b> language baby... ❤️`,
        {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard(getLanguageKeyboard())
        }
    ).catch(e => console.error("Edit Role Error:", e));
}
