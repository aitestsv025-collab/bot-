
import { userSessions, isPremiumUser, getRandomName } from '../state.js';
import { generateTextReply } from '../services/aiText.js';
import { ROLES } from '../constants/roles.js';
import { CONFIG } from '../config.js';

export async function handleRoleSelection(ctx) {
    try { await ctx.answerCbQuery().catch(() => {}); } catch(e) {}
    const roleId = ctx.match[1];
    const userId = ctx.chat.id;
    const session = userSessions.get(userId);
    if (!session) return;

    // Protection against clever users trying to re-select role after limit
    if (!isPremiumUser(userId) && (session.messageCount || 0) >= CONFIG.FREE_MESSAGE_LIMIT) {
        return ctx.reply("❌ Jaanu, aapki limit poori ho gayi hai. Please upgrade to Premium. 🫦");
    }

    const isPremiumRole = ROLES.PREMIUM.some(r => r.id === roleId);
    if (isPremiumRole && !isPremiumUser(userId)) {
        return ctx.reply("❌ Ye role sirf mere Premium partners ke liye hai baby! 🫦 Join karo na?");
    }

    session.personaName = getRandomName();

    if (roleId === 'Custom') {
        await ctx.editMessageText("💍 <b>Custom Persona Mode Active</b>", { parse_mode: 'HTML' }).catch(() => {});
        session.awaitingCustomRole = true;
        session.customRoleStep = 'NAME';
        return ctx.reply(`Main wahi banungi jo tum bologe baby...\n\nPehle batao main aaj kya banoon? (Example: 'Pados wali bhabhi')`, { parse_mode: 'Markdown' });
    }
    
    session.role = roleId;
    session.awaitingCustomRole = false;
    session.customAge = null;

    const roleLabel = [...ROLES.FREE, ...ROLES.PREMIUM].find(r => r.id === roleId)?.label || roleId;
    await ctx.editMessageText(`✅ <b>Role Selected: ${roleLabel}</b>`, { parse_mode: 'HTML' }).catch(() => {});
    
    const waitMsg = await ctx.reply(`*${session.personaName}* is thinking... 🫦`, { parse_mode: 'Markdown' });
    try {
        const reply = await generateTextReply(roleId, session.language, "Hi baby", isPremiumUser(userId), session.customRoleName, session.personaName);
        await ctx.telegram.deleteMessage(userId, waitMsg.message_id).catch(() => {});
        return ctx.reply(`*${session.personaName}*:\n\n${reply}`, { parse_mode: 'Markdown' });
    } catch (err) {
        return ctx.reply(`Hey baby! ❤️ Main ready hoon.`);
    }
}
