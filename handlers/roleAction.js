
import { userSessions, isPremiumUser, getRandomName } from '../state.js';
import { getPersistentMarkup } from '../utils/markups.js';
import { generateTextReply } from '../services/aiText.js';
import { ROLES } from '../constants/roles.js';

export async function handleRoleSelection(ctx) {
    const roleId = ctx.match[1];
    const userId = ctx.chat.id;
    const session = userSessions.get(userId);
    
    // Check if role is premium
    const isPremiumRole = ROLES.PREMIUM.some(r => r.id === roleId);
    if (isPremiumRole && !isPremiumUser(userId)) {
        return ctx.reply("❌ Ye role sirf mere Premium partners ke liye hai baby! 🫦 Join karo na?", getPersistentMarkup(userId));
    }

    if (session) {
        // Every role switch gets a fresh unique name
        session.personaName = getRandomName();

        if (roleId === 'Custom') {
            session.awaitingCustomRole = true;
            await ctx.answerCbQuery(`Custom mode active! ✨`);
            return ctx.reply(`💍 *CUSTOM PERSONA MODE* 💍\n\nMain aaj aapka wahi banungi jo aap chahoge baby...\n\nBatao aaj main kya banoon? (Example: 'Meri naughty neighbor', 'Meri submissive secretary')\n\nAbhi mera naam ${session.personaName} hai... 🫦`, { parse_mode: 'Markdown' });
        }
        
        session.role = roleId;
        session.awaitingCustomRole = false;
        await ctx.answerCbQuery(`Role: ${roleId} Active! ✨`);
        
        const reply = await generateTextReply(roleId, session.language, "Hi baby", isPremiumUser(userId), session.customRoleName, session.personaName);
        return ctx.reply(`*${session.personaName}* (${roleId}):\n\n${reply}`, { parse_mode: 'Markdown', ...getPersistentMarkup(userId) });
    }
}
