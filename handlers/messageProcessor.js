
import { userSessions, isPremiumUser, incrementMessageCount, incrementImageCount, globalStats, addChatLog } from '../state.js';
import { CONFIG } from '../config.js';
import { getPersistentMarkup } from '../utils/markups.js';
import { generateTextReply } from '../services/aiText.js';
import { generateGFImage } from '../services/aiImage.js';

export async function processIncomingMessage(ctx) {
    const userId = ctx.chat.id;
    const userName = ctx.from.first_name || "Unknown";
    const session = userSessions.get(userId) || { language: 'Hinglish', role: 'Romantic', messageCount: 0 };
    const text = ctx.message.text;
    const isPremium = isPremiumUser(userId);

    if (!CONFIG.GEMINI_KEY) {
        return ctx.reply("Jaanu, mere dimaag (Gemini Key) mein kuch gadbad hai. Admin se bolo key check kare! 🥺❤️");
    }

    // Custom Role Input Logic
    if (session.awaitingCustomRole && isPremium) {
        session.customRoleName = text;
        session.role = 'Custom';
        session.awaitingCustomRole = false;
        const reply = await generateTextReply('Custom', session.language, "I'm ready", true, text);
        addChatLog(userId, userName, `[Custom Role Set]: ${text}`, reply);
        return ctx.reply(`✅ Persona set to: *${text}*\n\n${reply}`, { parse_mode: 'Markdown', ...getPersistentMarkup(userId) });
    }

    const lowerText = text.toLowerCase();

    // Limit Check for Free Users
    if (!isPremium && session.messageCount >= CONFIG.FREE_MESSAGE_LIMIT) {
        return ctx.reply(`Jaanu, free messages khatam ho gaye hain. 🥺 Premium join karo na? Mwah! 🫦`, getPersistentMarkup(userId));
    }

    // Photo Request
    const photoKeywords = ['photo', 'pic', 'image', 'selfie', 'dikhao', 'bhejo'];
    if (photoKeywords.some(key => lowerText.includes(key))) {
        const isBoldRequest = lowerText.match(/(nude|nangi|sexy|hot|bed|naked|show|bold)/);
        
        await ctx.reply(isBoldRequest ? "Ruko baby, kuch spicy bhejti hoon... 🫦🔥" : "Ruko baby, photo click kar rahi hoon... 📸✨");
        
        // Pass the current role to the image generator
        const imageData = await generateGFImage(!!isBoldRequest, isPremium, session.role);
        
        if (imageData) {
            incrementImageCount(userId);
            globalStats.privatePhotosSent++;
            
            const logMsg = isBoldRequest ? `[SENT_BOLD_IMAGE]` : `[SENT_AI_IMAGE]`;
            addChatLog(userId, userName, text, logMsg);
            
            let caption = isBoldRequest ? `Sirf tumhare liye... 🫦🔥` : `Kaisi lag rahi hoon baby? ❤️✨`;
            
            if (isBoldRequest && !isPremium) {
                caption += `\n\n(Psst: Premium mein aisi 100+ photos hain! Join karo na? 🫦)`;
            }

            return ctx.replyWithPhoto(
                typeof imageData === 'string' ? imageData : { source: imageData }, 
                { caption, ...getPersistentMarkup(userId) }
            );
        }
    }

    // Regular AI Chat
    incrementMessageCount(userId);
    globalStats.totalMessagesProcessed++;
    const reply = await generateTextReply(session.role, session.language, text, isPremium, session.customRoleName, session.personaName);
    
    addChatLog(userId, userName, text, reply);
    return ctx.reply(reply, getPersistentMarkup(userId));
}
