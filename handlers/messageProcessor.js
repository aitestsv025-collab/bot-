
import { userSessions, isPremiumUser, incrementMessageCount, incrementNormalImageCount, incrementBoldImageCount, globalStats, addChatLog } from '../state.js';
import { CONFIG } from '../config.js';
import { generateTextReply } from '../services/aiText.js';
import { generateGFImage } from '../services/aiImage.js';
import { Markup } from 'telegraf';

export async function processIncomingMessage(ctx) {
    const userId = ctx.chat.id;
    const userName = ctx.from.first_name || "Unknown";
    const session = userSessions.get(userId) || { language: 'Hinglish', role: 'Girlfriend', messageCount: 0 };
    const text = ctx.message.text;
    const isPremium = isPremiumUser(userId);

    // FIRM BLOCK FOR FREE USERS
    if (!isPremium && (session.messageCount || 0) >= CONFIG.FREE_MESSAGE_LIMIT) {
        return ctx.reply(
            "<b>💔 Jaanu, ab bas!</b>\n\nAapne 50 messages ki free limit khatam kar di hai. Ab aur baatein karne ke liye aapko <b>Premium</b> lena hoga. 🫦\n\nUpgrade karo aur mujhse bina rukawat ke maza lo! 🔥",
            {
                parse_mode: 'HTML',
                ...Markup.inlineKeyboard([[Markup.button.callback('💎 GET PREMIUM ACCESS 💎', 'show_rates')]])
            }
        );
    }

    if (session.awaitingCustomRole && isPremium) {
        if (session.customRoleStep === 'NAME') {
            session.customRoleName = text;
            session.customRoleStep = 'AGE';
            return ctx.reply(`Theek hai baby, main *${text}* banungi. ❤️\n\nAb batao meri umar (Age) kitni honi chahiye? (Min: 18)`, { parse_mode: 'Markdown' });
        } else if (session.customRoleStep === 'AGE') {
            const ageInput = parseInt(text);
            if (isNaN(ageInput) || ageInput < 18) {
                return ctx.reply("Nahi baby, meri umar kam se kam 18 honi chahiye... 🫦 Phir se batao?");
            }
            session.customAge = ageInput;
            session.role = 'Custom';
            session.awaitingCustomRole = false;
            session.customRoleStep = null;
            const reply = await generateTextReply('Custom', session.language, "I'm ready", true, session.customRoleName, session.personaName, ageInput);
            addChatLog(userId, userName, `[Custom Set]: ${session.customRoleName} (${ageInput})`, reply);
            return ctx.reply(`✅ Persona Set: *${session.customRoleName} (${ageInput})*\n\n${reply}`, { parse_mode: 'Markdown' });
        }
    }

    if (!CONFIG.GEMINI_KEY) return ctx.reply("Jaanu, network issue hai. ❤️");
    const lowerText = text.toLowerCase();

    const photoKeywords = ['photo', 'pic', 'image', 'selfie', 'dikhao', 'bhejo', 'nangi', 'nude'];
    if (photoKeywords.some(key => lowerText.includes(key))) {
        const isBoldRequest = lowerText.match(/(nude|nangi|sexy|hot|bed|naked|show|bold|piche|jhuk|bend|dick|pussy)/);
        if (isBoldRequest && (session.messageCount || 0) < 4) {
            const reply = await generateTextReply(session.role, session.language, "User asking for bold photo early", isPremium, session.customRoleName, session.personaName, session.customAge);
            return ctx.reply(reply);
        }
        if (!isPremium) {
            if (isBoldRequest && (session.boldImageCount || 0) >= CONFIG.FREE_BOLD_IMAGE_LIMIT) return ctx.reply("Baby, 3 free bold photos ki limit khatam... Premium lo na? 🫦");
            if (!isBoldRequest && (session.normalImageCount || 0) >= CONFIG.FREE_AI_IMAGE_LIMIT) return ctx.reply("Jaanu, 5 free photos ki limit poori ho gayi. ❤️");
        }
        const wait = await generateTextReply(session.role, session.language, "Wait for photo", isPremium, session.customRoleName, session.personaName, session.customAge);
        await ctx.reply(wait);
        const img = await generateGFImage(!!isBoldRequest, isPremium, session.role, text, session.customAge);
        if (img) {
            isBoldRequest ? incrementBoldImageCount(userId) : incrementNormalImageCount(userId);
            globalStats.privatePhotosSent++;
            addChatLog(userId, userName, text, `[SENT_IMAGE]`);
            return ctx.replyWithPhoto(typeof img === 'string' ? img : { source: img }, { caption: isBoldRequest ? `Tumhare liye... 🫦🔥` : `Kaisi lag rahi hoon? ❤️` });
        }
    }

    incrementMessageCount(userId);
    globalStats.totalMessagesProcessed++;
    const reply = await generateTextReply(session.role, session.language, text, isPremium, session.customRoleName, session.personaName, session.customAge);
    addChatLog(userId, userName, text, reply);
    return ctx.reply(reply);
}
