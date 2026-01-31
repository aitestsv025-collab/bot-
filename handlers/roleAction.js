
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

    if (!isPremiumUser(userId) && (session.messageCount || 0) >= CONFIG.FREE_MESSAGE_LIMIT) {
        return ctx.reply("❌ Limit khatam baby.");
    }

    const isPremiumRole = ROLES.PREMIUM.some(r => r.id === roleId);
    if (isPremiumRole && !isPremiumUser(userId)) {
        return ctx.reply("❌ Ye Role Premium hai baby! Join karo na?");
    }

    session.personaName = getRandomName();
    session.role = roleId;

    const roleLabel = [...ROLES.FREE, ...ROLES.PREMIUM].find(r => r.id === roleId)?.label || roleId;

    // 1. Edit current message to say it's ready (removes buttons)
    await ctx.editMessageText(`✅ <b>Ready!</b>\nMain <b>${session.personaName}</b> (${roleLabel}) ban gayi hoon. ❤️`, { parse_mode: 'HTML' }).catch(() => {});
    
    // 2. Start the AI chat with a new message
    try {
        const reply = await generateTextReply(roleId, session.language, "Hi baby", isPremiumUser(userId), "", session.personaName);
        return ctx.reply(`*${session.personaName}*:\n\n${reply}`, { parse_mode: 'Markdown' });
    } catch (err) {
        return ctx.reply(`Hey baby! ❤️ Main ready hoon.`);
    }
}
