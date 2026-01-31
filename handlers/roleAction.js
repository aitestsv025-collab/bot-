
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
        return ctx.reply("❌ Limit khatam baby.");
    }

    const isPremiumRole = ROLES.PREMIUM.some(r => r.id === roleId);
    if (isPremiumRole && !isPremiumUser(userId)) {
        return ctx.reply("❌ Ye Role Premium hai baby! Join karo na?");
    }

    session.role = roleId;

    if (roleId === 'Custom') {
        await ctx.editMessageText("💍 <b>Custom Persona Mode Active</b>", { parse_mode: 'HTML' }).catch(() => {});
        session.awaitingCustomRole = true;
        session.customRoleStep = 'NAME';
        return ctx.reply(`Main wahi banungi jo tum bologe baby...\n\nPehle batao main aaj kya banoon? (Example: 'Pados wali bhabhi')`, { parse_mode: 'Markdown' });
    }

    const allRoles = [...ROLES.FREE, ...ROLES.PREMIUM];
    const roleLabel = allRoles.find(r => r.id === roleId)?.label.split(' (')[0] || roleId;

    // After Role selection, ask for Language using Role-specific text
    return ctx.editMessageText(
        `✅ Role Set: <b>${roleLabel}</b>\n\nSelect your <b>${roleLabel}</b> language baby... ❤️`,
        {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard(getLanguageKeyboard())
        }
    ).catch(e => console.error("Edit Role Error:", e));
}
