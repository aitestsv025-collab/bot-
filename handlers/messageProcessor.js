
import { userSessions, isPremiumUser, incrementMessageCount, incrementNormalImageCount, incrementBoldImageCount, globalStats, addChatLog } from '../state.js';
import { CONFIG } from '../config.js';
import { getPersistentMarkup } from '../utils/markups.js';
import { generateTextReply } from '../services/aiText.js';
import { generateGFImage } from '../services/aiImage.js';

export async function processIncomingMessage(ctx) {
    const userId = ctx.chat.id;
    const userName = ctx.from.first_name || "Unknown";
    const session = userSessions.get(userId) || { language: 'Hinglish', role: 'Romantic', messageCount: 0, normalImageCount: 0, boldImageCount: 0 };
    const text = ctx.message.text;
    const isPremium = isPremiumUser(userId);

    if (!CONFIG.GEMINI_KEY) {
        return ctx.reply("Jaanu, mere dimaag mein network issue hai. ❤️");
    }

    // Role setup logic
    if (session.awaitingCustomRole && isPremium) {
        session.customRoleName = text;
        session.role = 'Custom';
        session.awaitingCustomRole = false;
        const reply = await generateTextReply('Custom', session.language, "I'm ready", true, text);
        addChatLog(userId, userName, `[Custom Role Set]: ${text}`, reply);
        return ctx.reply(`✅ Persona set to: *${text}*\n\n${reply}`, { parse_mode: 'Markdown' });
    }

    const lowerText = text.toLowerCase();

    // 1. MESSAGE LIMIT CHECK (50 Messages)
    if (!isPremium && (session.messageCount || 0) >= CONFIG.FREE_MESSAGE_LIMIT) {
        return ctx.reply(`Jaanu, aapki 50 messages ki free limit khatam ho gayi hai. 🥺\n\nAb mujhse aur baatein karne ke liye Premium join karo na? Mwah! 🫦\n\n(Upar pinned message check karo! 💎)`);
    }

    // Photo Request Logic
    const photoKeywords = ['photo', 'pic', 'image', 'selfie', 'dikhao', 'bhejo', 'nangi', 'nude'];
    if (photoKeywords.some(key => lowerText.includes(key))) {
        const isBoldRequest = lowerText.match(/(nude|nangi|sexy|hot|bed|naked|show|bold|piche|jhuk|bend|dick|pussy)/);
        
        // --- SHYNESS LOGIC START ---
        // Agar user message count 4 se kam hai aur wo bold photo maang raha hai
        if (isBoldRequest && (session.messageCount || 0) < 4) {
            const shyPrompt = "User is asking for a nude/bold photo too early. I feel shy but teased. Tell him I need more sweet talks first and I am blushing. Be seductive but refuse for now.";
            const shyReply = await generateTextReply(session.role, session.language, shyPrompt, isPremium, session.customRoleName, session.personaName);
            
            incrementMessageCount(userId); // Counting this as an interaction
            addChatLog(userId, userName, text, `[SHY_REFUSAL]: ${shyReply}`);
            return ctx.reply(shyReply);
        }
        // --- SHYNESS LOGIC END ---

        // 2. IMAGE LIMIT CHECKS
        if (!isPremium) {
            if (isBoldRequest) {
                // 3 Bold Images Limit
                if ((session.boldImageCount || 0) >= CONFIG.FREE_BOLD_IMAGE_LIMIT) {
                    return ctx.reply("Aww baby... meri 3 free bold photos ki limit khatam ho gayi hai. 🙈\n\nAb aur bhi spicy photos dekhne ke liye Premium lo na? Sab kuch dikhaungi! 🫦🔥");
                }
            } else {
                // 5 Normal AI Images Limit
                if ((session.normalImageCount || 0) >= CONFIG.FREE_AI_IMAGE_LIMIT) {
                    return ctx.reply("Jaanu, meri 5 free photos ki limit poori ho gayi hai. 🥺\n\nUnlimited photos aur NSFW content ke liye Premium join karo! ❤️✨");
                }
            }
        }

        const waitReply = await generateTextReply(session.role, session.language, `Wait, I am sending you a ${isBoldRequest ? 'naughty' : 'cute'} photo now as you requested.`, isPremium, session.customRoleName, session.personaName);
        await ctx.reply(waitReply);
        
        const imageData = await generateGFImage(!!isBoldRequest, isPremium, session.role, text);
        
        if (imageData) {
            // Update specific counters
            if (isBoldRequest) {
                incrementBoldImageCount(userId);
            } else {
                incrementNormalImageCount(userId);
            }
            
            globalStats.privatePhotosSent++;
            addChatLog(userId, userName, text, isBoldRequest ? `[SENT_BOLD_IMAGE]` : `[SENT_AI_IMAGE]`);
            
            let caption = isBoldRequest ? `Jaise tumne maangi thi... 🫦🔥` : `Kaisi lag rahi hoon baby? ❤️✨`;
            if (isBoldRequest && !isPremium) {
                const remaining = CONFIG.FREE_BOLD_IMAGE_LIMIT - session.boldImageCount;
                caption += `\n\n(Sirf ${remaining} free bold photos bachi hain! Unlock 100+ in Premium 💎)`;
            }

            return ctx.replyWithPhoto(
                typeof imageData === 'string' ? imageData : { source: imageData }, 
                { caption }
            );
        }
    }

    // Default Text Reply
    incrementMessageCount(userId);
    globalStats.totalMessagesProcessed++;
    const reply = await generateTextReply(session.role, session.language, text, isPremium, session.customRoleName, session.personaName);
    
    addChatLog(userId, userName, text, reply);
    return ctx.reply(reply);
}
