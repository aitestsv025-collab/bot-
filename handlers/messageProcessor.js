
import { userSessions, isPremiumUser, incrementMessageCount, incrementImageCount, globalStats } from '../state.js';
import { CONFIG } from '../config.js';
import { getPersistentMarkup } from '../utils/markups.js';
import { generateTextReply } from '../services/aiText.js';
import { generateGFImage } from '../services/aiImage.js';

export async function processIncomingMessage(ctx) {
    const userId = ctx.chat.id;
    const session = userSessions.get(userId) || { language: 'Hinglish', role: 'Romantic', messageCount: 0 };
    const text = ctx.message.text;

    if (!CONFIG.GEMINI_KEY) {
        return ctx.reply("Jaanu, mere dimaag (Gemini Key) mein kuch gadbad hai. Admin se bolo key check kare! 🥺❤️");
    }

    // Custom Role Input Logic
    if (session.awaitingCustomRole && isPremiumUser(userId)) {
        session.customRoleName = text;
        session.role = 'Custom';
        session.awaitingCustomRole = false;
        const reply = await generateTextReply('Custom', session.language, "I'm ready", true, text);
        return ctx.reply(`✅ Persona set to: *${text}*\n\n${reply}`, { parse_mode: 'Markdown', ...getPersistentMarkup(userId) });
    }

    const lowerText = text.toLowerCase();

    // Limit Check
    if (!isPremiumUser(userId) && session.messageCount >= CONFIG.FREE_MESSAGE_LIMIT) {
        return ctx.reply(`Jaanu, limit khatam ho gayi hai. 🥺 Premium join karo na? Mwah! 🫦`, getPersistentMarkup(userId));
    }

    // Photo Request
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
                caption: `Sirf tumhare liye... 🫦✨`,
                ...getPersistentMarkup(userId)
            });
        }
    }

    // Regular AI Chat
    incrementMessageCount(userId);
    globalStats.totalMessagesProcessed++;
    const reply = await generateTextReply(session.role, session.language, text, isPremiumUser(userId), session.customRoleName);
    return ctx.reply(reply, getPersistentMarkup(userId));
}
