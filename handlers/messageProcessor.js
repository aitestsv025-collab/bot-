
import { userSessions, isPremiumUser, incrementMessageCount, incrementImageCount, globalStats } from '../state.js';
import { CONFIG } from '../config.js';
import { getPersistentMarkup } from '../utils/markups.js';
import { generateTextReply } from '../services/aiText.js';
import { generateGFImage } from '../services/aiImage.js';

export async function processIncomingMessage(ctx) {
    const userId = ctx.chat.id;
    const session = userSessions.get(userId) || { language: 'Hinglish', role: 'Romantic', messageCount: 0 };
    const text = ctx.message.text;

    // 0. Custom Role Input Logic
    if (session.awaitingCustomRole && isPremiumUser(userId)) {
        session.customRoleName = text;
        session.role = 'Custom';
        session.awaitingCustomRole = false;
        const reply = await generateTextReply('Custom', session.language, "I'm ready", true, text);
        return ctx.reply(`✅ Persona set to: *${text}*\n\n${reply}`, { parse_mode: 'Markdown', ...getPersistentMarkup(userId) });
    }

    const lowerText = text.toLowerCase();

    // 1. 50 Message Limit Check
    if (!isPremiumUser(userId) && session.messageCount >= CONFIG.FREE_MESSAGE_LIMIT) {
        return ctx.reply(`Jaanu, aapki ${CONFIG.FREE_MESSAGE_LIMIT} messages ki limit khatam ho gayi hai. 🥺\n\nAb aur baatein karne ke liye premium join karo na? Mwah! 🫦`, getPersistentMarkup(userId));
    }

    // 2. NSFW Keyword Check
    const naughtyKeywords = ['nude', 'nangi', 'sex', 'chodo', 'pussy', 'boobs', 'bra', 'muth', 'lund', 'dick', 'sexy photo'];
    const isNaughty = naughtyKeywords.some(key => lowerText.includes(key));
    if (isNaughty && !isPremiumUser(userId)) {
        return ctx.reply("Uff... itni bold baatein? 🙈 Main ye sab sirf premium lovers ke saath karti hoon. ❤️", getPersistentMarkup(userId));
    }

    // 3. Photo Request Check
    const photoKeywords = ['photo', 'pic', 'image', 'selfie', 'dikhao'];
    if (photoKeywords.some(key => lowerText.includes(key))) {
        const isBold = lowerText.match(/(nude|nangi|sexy|hot|bed|naked)/);
        if (isBold && !isPremiumUser(userId)) return ctx.reply("Bold photos premium mein milti hain Jaanu! 🫦", getPersistentMarkup(userId));

        await ctx.reply("Ruko baby, photo click kar rahi hoon... 🫦📸");
        const img = await generateGFImage(!!isBold);
        if (img) {
            incrementImageCount(userId);
            globalStats.privatePhotosSent++;
            return ctx.replyWithPhoto({ source: img }, { 
                caption: `Sirf tumhare liye... 🫦✨\n${isPremiumUser(userId) ? "👑 Unlimited" : `(Message ${session.messageCount}/${CONFIG.FREE_MESSAGE_LIMIT})`}`,
                ...getPersistentMarkup(userId)
            });
        }
    }

    // 4. Regular AI Chat
    incrementMessageCount(userId);
    globalStats.totalMessagesProcessed++;
    const reply = await generateTextReply(session.role, session.language, text, isPremiumUser(userId), session.customRoleName);
    return ctx.reply(reply, getPersistentMarkup(userId));
}
