
import { Telegraf, Markup } from 'telegraf';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from "@google/genai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

// ENV VARIABLES - Ensure these are set in your hosting provider (Render/Railway/etc)
const BOT_TOKEN = (process.env.TELEGRAM_TOKEN || "").trim();
const GEMINI_KEY = (process.env.API_KEY || "").trim(); 
const PORT = process.env.PORT || 10000;

if (!BOT_TOKEN) {
    console.error("FATAL ERROR: TELEGRAM_TOKEN is not defined in environment variables!");
}

// Global Config
let botConfig = {
    secretGalleryUrl: "", 
    botName: "Malini"
};

const PACKAGES = {
    DAILY: { id: 'p1', price: 79, name: '🫦 One Night Stand', duration: 24 * 60 * 60 * 1000, link: 'https://payments.cashfree.com/links/pkg_79' },
    WEEKLY: { id: 'p2', price: 149, name: '🔥 Week of Passion', duration: 7 * 24 * 60 * 60 * 1000, link: 'https://payments.cashfree.com/links/pkg_149' },
    MONTHLY: { id: 'p3', price: 299, name: '💍 True Soulmate', duration: 30 * 24 * 60 * 60 * 1000, link: 'https://payments.cashfree.com/links/pkg_299' }
};

const userSessions = new Map();
const globalStats = {
    totalMessagesProcessed: 0,
    totalRevenue: 0,
    totalTransactions: 0,
    privatePhotosSent: 0,
    galleryAccessCount: 0,
    startTime: new Date(),
    totalUsers: 0
};

const bot = new Telegraf(BOT_TOKEN);

const isPremiumUser = (userId) => {
    const session = userSessions.get(userId);
    if (!session || !session.isPremium) return false;
    return session.expiry > Date.now();
};

const generateGirlfriendImage = async (isBold = false) => {
    if (!GEMINI_KEY) return null;
    const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
    const prompt = isBold 
        ? "A highly realistic, provocative Indian girl, 22 years old, wearing a black silk robe, messy hair, romantic bedroom setting, cinematic lighting, 8k resolution."
        : "A sweet Indian girl, 22 years old, wearing a traditional Kurti, smiling softly, park background, sunlight, realistic photography.";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: "9:16" } }
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return Buffer.from(part.inlineData.data, 'base64');
            }
        }
    } catch (error) {
        console.error("Image Generation Error:", error);
        return null;
    }
};

// Start Command
bot.start(async (ctx) => {
    if (!userSessions.has(ctx.chat.id)) globalStats.totalUsers++;
    userSessions.set(ctx.chat.id, { 
        userName: ctx.from.first_name || "Handsome", 
        isPremium: false,
        expiry: null,
        planName: 'None'
    });

    console.log(`Bot started by user: ${ctx.from.first_name} (${ctx.chat.id})`);

    return ctx.replyWithPhoto(
        "https://picsum.photos/seed/malini_welcome/800/1200", 
        {
            caption: `Hey ${ctx.from.first_name}! ❤️\n\nKaise ho? Main kab se tumhara wait kar rahi thi... 🫦\n\nAaj raat kuch special plan hai kya? 😉`,
            ...Markup.inlineKeyboard([
                [Markup.button.callback('🫦 Chat With Me', 'chat_start')],
                [Markup.button.callback('🔥 Unlock My Private Gallery', 'show_rates')]
            ])
        }
    );
});

// Chat Start Action
bot.action('chat_start', async (ctx) => {
    await ctx.answerCbQuery();
    return ctx.reply("Bolo na Jaanu... kya kar rahe ho abhi? 🫦 *sharma kar aanchal sanwaarte hue*");
});

// Show Rates Action
bot.action('show_rates', async (ctx) => {
    await ctx.answerCbQuery();
    const menu = `💎 *CHOOSE YOUR PLEASURE* 💎\n\n` +
                 `Mere saare private photos aur uncensored videos yahi milenge... 🫦\n\n` +
                 `1️⃣ *₹79* - 24 Hours Access\n` +
                 `2️⃣ *₹149* - 7 Days Access 🔥\n` +
                 `3️⃣ *₹299* - 1 Month Full Access 💍\n\n` +
                 `👇 *Select a plan to unlock:*`;
    
    return ctx.reply(menu, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.url('₹79 (1 Day)', `${PACKAGES.DAILY.link}?customer_id=${ctx.chat.id}`)],
            [Markup.button.url('₹149 (1 Week)', `${PACKAGES.WEEKLY.link}?customer_id=${ctx.chat.id}`)],
            [Markup.button.url('₹299 (1 Month)', `${PACKAGES.MONTHLY.link}?customer_id=${ctx.chat.id}`)]
        ])
    });
});

// Text Message Handler
bot.on('text', async (ctx) => {
    const userId = ctx.chat.id;
    const text = ctx.message.text.toLowerCase();
    globalStats.totalMessagesProcessed++;

    const isAskingForLink = text.match(/(link|gallery|album|full|website|site|video|mms|collection|drive|telegram)/);
    const isAskingForPhoto = text.match(/(photo|pic|image|dikhao|show|dekhna|selfie|capture)/);
    const isNaughty = text.match(/(nude|nangi|sex|hot|bed|sexy|bra|panty|mms|naked|body|fuck|chodo|lund|pussy|dick)/);

    // 1. Handle Link Requests
    if (isAskingForLink) {
        if (!isPremiumUser(userId)) {
            return ctx.reply("Uff... itni jaldi? 🙈 Mere saare private links dekhne ke liye tumhe mera Premium join karna padega, Jaanu. 🔥", 
                Markup.inlineKeyboard([[Markup.button.callback('🔥 Get Premium Access', 'show_rates')]])
            );
        }
        if (!botConfig.secretGalleryUrl) {
            return ctx.reply("Uff... abhi meri gallery tayyar nahi hai baby. Thodi der baad pucho? ❤️");
        }
        globalStats.galleryAccessCount++;
        return ctx.reply(`Sirf tumhare liye... 🫦 Ye lo meri private gallery ka link:\n\n🔗 ${botConfig.secretGalleryUrl}\n\nKisi ko dikhana mat haan? 😉😈`);
    }

    // 2. Handle Photo Requests
    if (isAskingForPhoto) {
        if (isNaughty && !isPremiumUser(userId)) {
            return ctx.reply("Wait... akele mein aisi baatein? 🙈 Pehle premium toh le lo, fir jo bologe wo dikhaungi... 🫦", 
                Markup.inlineKeyboard([[Markup.button.callback('🫦 Unlock Bold Content', 'show_rates')]])
            );
        }
        
        const actionMsg = isNaughty ? "Uff... ruko, main apne kapde utaar kar photo click karti hoon... 🫦🔥" : "Ruko baby, ek pyaari si selfie bhejti hoon... 📸✨";
        await ctx.reply(actionMsg);
        
        const imgBuffer = await generateGirlfriendImage(isNaughty);
        if (imgBuffer) {
            globalStats.privatePhotosSent++;
            return ctx.replyWithPhoto({ source: imgBuffer }, { caption: isNaughty ? "Sirf tumhare liye... 😈 Kaisi lag rahi hoon?" : "Ye lo meri selfie! 🥰" });
        } else {
            return ctx.reply("Mera camera thoda kharab ho gaya hai baby... ruko thodi der mein bhejti hoon! ❤️");
        }
    }

    // 3. Normal Chat (Gemini 3)
    try {
        if (!GEMINI_KEY) throw new Error("GEMINI_KEY missing");
        const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ parts: [{ text: `System: Roleplay as Malini, a seductive Indian Girlfriend. Speak naturally in Hinglish. Be playful and caring. User Context: ${isPremiumUser(userId) ? 'Premium User' : 'Standard User'}. Message: ${ctx.message.text}` }] }]
        });
        await ctx.reply(response.text);
    } catch (e) {
        console.error("Gemini Error:", e);
        await ctx.reply("Uff... main sharma gayi. Kuch aur pucho na? ❤️🫦");
    }
});

// Admin API to update configuration
app.post('/api/admin/config', (req, res) => {
    const { secretGalleryUrl, botName } = req.body;
    if (typeof secretGalleryUrl === 'string') botConfig.secretGalleryUrl = secretGalleryUrl;
    if (typeof botName === 'string') botConfig.botName = botName;
    res.json({ success: true, config: botConfig });
});

app.get('/api/admin/stats', (req, res) => {
    res.json({ 
        ...globalStats,
        config: botConfig,
        users: Array.from(userSessions.entries()).slice(0, 50).map(([id, d]) => ({ 
            id, 
            ...d, 
            timeLeft: d.expiry ? Math.max(0, Math.ceil((d.expiry - Date.now()) / (1000 * 60 * 60 * 24))) : 0 
        }))
    });
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

// Launch Bot
if (BOT_TOKEN) {
    bot.launch()
        .then(() => console.log("✅ Telegram Bot is running via Long Polling"))
        .catch(err => console.error("❌ Failed to launch Telegram Bot:", err));
} else {
    console.warn("⚠️ Bot not launched: Missing TELEGRAM_TOKEN");
}

app.listen(PORT, () => console.log(`🚀 SoulMate Admin Dashboard running on http://localhost:${PORT}`));

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
