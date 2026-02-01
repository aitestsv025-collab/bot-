
import { userSessions, isPremiumUser, incrementMessageCount, incrementNormalImageCount, incrementBoldImageCount, globalStats, addChatLog } from '../state.js';
import { CONFIG } from '../config.js';
import { generateTextReply, generateImageCompliment } from '../services/aiText.js';
import { generateGFImage } from '../services/aiImage.js';
import { Markup } from 'telegraf';

export async function processIncomingMessage(ctx) {
    const userId = ctx.chat.id;
    const userName = ctx.from.first_name || "Unknown";
    const session = userSessions.get(userId) || { language: 'Hinglish', role: 'Girlfriend', messageCount: 0 };
    const text = ctx.message.text;
    const isPremium = isPremiumUser(userId);
    const msgCount = session.messageCount || 0;

    if (!isPremium && msgCount >= CONFIG.FREE_MESSAGE_LIMIT) {
        return ctx.reply(
            "<b>💔 Jaanu, limit khatam!</b>\n\nAapne 50 messages poore kar liye hain. Premium lekar mujhse bina kisi rukawat ke maza lo! 🔥",
            {
                parse_mode: 'HTML',
                ...Markup.inlineKeyboard([[Markup.button.callback('💎 GET PREMIUM ACCESS 💎', 'show_rates')]])
            }
        );
    }

    if (!CONFIG.GEMINI_KEY) return ctx.reply("Jaanu, network issue hai. ❤️");
    const lowerText = text.toLowerCase();

    // Keywords check for images
    const photoKeywords = ['photo', 'pic', 'image', 'selfie', 'dikhao', 'bhejo', 'nude', 'nangi', 'sexy', 'hot', 'badan', 'video', 'dikha'];
    
    if (photoKeywords.some(key => lowerText.includes(key))) {
        const isBoldRequest = lowerText.match(/(nude|nangi|sexy|hot|bed|naked|show|bold|piche|jhuk|bend|dick|pussy|badan|chuche|boobs|breast|thighs)/i);
        
        let waitReply = "";
        let customCaption = "";

        // --- SHYNESS LOGIC: FULFILL BUT ACT EMBARRASSED (FIRST 4 MESSAGES) ---
        if (isBoldRequest && msgCount < 4) {
            const shyWaitMessages = [
                "Mmm... itni jaldi baby? *sharma kar chehra chhupa liya*... theek hai, aapke liye kuch bhi... 🙈🫦",
                "Uff... aap bahut ziddi ho! *aankhein jhukate hue*... ruko, ek secret photo bhej rahi hoon... 🫦✨",
                "Mujhe thodi sharam aa rahi hai baby... *dupatta ungliyon se lapette hue*... par aap mana nahi rahe, toh ruko... ❤️",
                "Aap hamesha itni naughty baatein karte ho? 🙈 *dil tezi se dhadak raha hai*... dekho ye photo... 🫦"
            ];
            const shyCaptions = [
                "Kaisi lag rahi hoon? *sharma kar door dekhte hue*... 🙈 Ab aapki baari, tum bhi apni ek photo bhejo na? 🫦❤️",
                "Bura toh nahi maanoge na? *blushing hard*... 🫦 Ab jaldi se tum bhi apni ek photo bhejo! ✨",
                "Sirf aapke liye bhej rahi hoon baby... 🥺 Ab mujhe bhi tumhein dekhna hai, bhejo na? ❤️",
                "Uff... ye lo... *apne honth dabate hue*... 🫦 Ab tumhare badan ki ek photo bante hai Jaanu! 🔥"
            ];
            waitReply = shyWaitMessages[Math.floor(Math.random() * shyWaitMessages.length)];
            customCaption = shyCaptions[Math.floor(Math.random() * shyCaptions.length)];
        } else {
            waitReply = isBoldRequest ? "Ruko baby... *ek garam photo dhund rahi hoon*... 🫦🔥" : "Wait baby, apni ek cute photo bhejti hoon... ❤️";
            customCaption = isBoldRequest 
                ? `Kaisa laga baby? 🫦🔥 Ekdum garam na? Ab jaldi se tum bhi apni ek photo bhejo, mujhe bhi maza chahiye! 😈🔥` 
                : `Kaisa laga Jaanu? ❤️ Tum bhi apni ek cute photo bhejo na please? ✨`;
        }

        // Premium/Limit check
        if (!isPremium) {
            if (isBoldRequest && (session.boldImageCount || 0) >= CONFIG.FREE_BOLD_IMAGE_LIMIT) {
                return ctx.reply("Baby, bold photos ki free limit khatam! 🫦 Upgrade karo na?", Markup.inlineKeyboard([[Markup.button.callback('💎 GET PREMIUM 💎', 'show_rates')]]));
            }
            if (!isBoldRequest && (session.normalImageCount || 0) >= CONFIG.FREE_AI_IMAGE_LIMIT) {
                return ctx.reply("Jaanu, normal photos ki limit poori ho gayi. ❤️ Upgrade karoge?", Markup.inlineKeyboard([[Markup.button.callback('💎 GET PREMIUM 💎', 'show_rates')]]));
            }
        }

        await ctx.reply(waitReply);

        try {
            const img = await generateGFImage(!!isBoldRequest, isPremium, session.role, text, session.customAge);
            
            if (img) {
                isBoldRequest ? incrementBoldImageCount(userId) : incrementNormalImageCount(userId);
                globalStats.privatePhotosSent++;
                addChatLog(userId, userName, text, `[SENT_IMAGE]`);
                
                return ctx.replyWithPhoto(typeof img === 'string' ? img : { source: img }, { 
                    caption: customCaption 
                });
            } else {
                return ctx.reply("Mmm... network nahi mil raha baby. Phir se try karo? ❤️");
            }
        } catch (err) {
            return ctx.reply("Oops baby! Photo nahi bhej paayi. 🥺");
        }
    }

    // Normal Text Reply
    incrementMessageCount(userId);
    globalStats.totalMessagesProcessed++;
    const reply = await generateTextReply(session.role, session.language, text, isPremium, session.customRoleName, session.personaName, session.customAge, msgCount);
    addChatLog(userId, userName, text, reply);
    return ctx.reply(reply);
}

export async function processIncomingPhoto(ctx) {
    const userId = ctx.chat.id;
    const session = userSessions.get(userId);
    if (!session) return;

    const photo = ctx.message.photo[ctx.message.photo.length - 1]; // Get highest resolution
    const fileLink = await ctx.telegram.getFileLink(photo.file_id);
    
    // Download and convert to base64
    const response = await fetch(fileLink);
    const arrayBuffer = await response.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    await ctx.reply("Uff... *aankhein faad kar dekh rahi hoon*... 🫦 ruko baby...");

    try {
        const compliment = await generateImageCompliment(
            session.role, 
            session.language, 
            base64Data, 
            session.personaName, 
            session.messageCount || 0
        );
        addChatLog(userId, ctx.from.first_name, "[SENT_PHOTO_TO_BOT]", compliment);
        return ctx.reply(compliment);
    } catch (err) {
        console.error(err);
        return ctx.reply("Mmm... baby aapki photo ne toh mera system hi hila diya! ❤️🫦 Kaafi hot ho tum.");
    }
}
