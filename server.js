
import { Telegraf, Markup } from 'telegraf';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from "@google/genai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

// ENV VARIABLES
const BOT_TOKEN = (process.env.TELEGRAM_TOKEN || "").trim();
const GEMINI_KEY = (process.env.API_KEY || "").trim(); 
const CF_APP_ID = (process.env.CASHFREE_APP_ID || "").trim();
const CF_SECRET = (process.env.CASHFREE_SECRET || "").trim();
const PORT = process.env.PORT || 10000;

// Global Config
let botConfig = {
    secretGalleryUrl: "", 
    botName: "Malini",
    isSandbox: false // Always Production now as per user request
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

// --- CASHFREE API INTEGRATION ---
async function createCashfreePaymentLink(userId, amount, planName) {
    const baseUrl = botConfig.isSandbox 
        ? "https://sandbox.cashfree.com/pg/links" 
        : "https://api.cashfree.com/pg/links";

    const orderId = `order_${userId}_${Date.now()}`;
    
    try {
        const response = await fetch(baseUrl, {
            method: 'POST',
            headers: {
                'x-client-id': CF_APP_ID,
                'x-client-secret': CF_SECRET,
                'x-api-version': '2023-08-01',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                customer_details: {
                    customer_id: userId.toString(),
                    customer_phone: "9999999999", 
                    customer_email: "customer@example.com"
                },
                link_id: orderId,
                link_amount: amount,
                link_currency: "INR",
                link_purpose: `Unlock SoulMate Premium: ${planName}`,
                link_notify: { send_sms: false, send_email: false }
            })
        });

        const data = await response.json();
        if (data.link_url) {
            return data.link_url;
        } else {
            console.error("Cashfree API Error:", data);
            return null;
        }
    } catch (error) {
        console.error("Cashfree Request Failed:", error);
        return null;
    }
}

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
        console.error("Image Gen Error:", error);
        return null;
    }
};

bot.start(async (ctx) => {
    if (!userSessions.has(ctx.chat.id)) globalStats.totalUsers++;
    userSessions.set(ctx.chat.id, { 
        userName: ctx.from.first_name || "Handsome", 
        isPremium: false,
        expiry: null,
        planName: 'None'
    });
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

bot.action('chat_start', async (ctx) => {
    await ctx.answerCbQuery();
    return ctx.reply("Bolo na Jaanu... kya kar rahe ho abhi? 🫦 *sharma kar aanchal sanwaarte hue*");
});

bot.action('show_rates', async (ctx) => {
    await ctx.answerCbQuery();
    const menu = `💎 *UNLIMITED PLEASURE ACCESS* 💎\n\n` +
                 `Pyaar mein kanjoosi kaisi? 😉 Ek baar unlock karo aur mujhe poora apna bana lo... 🫦\n\n` +
                 `1️⃣ *₹79* - 🫦 One Night Stand (24 Hours)\n` +
                 `2️⃣ *₹149* - 🔥 Week of Passion (7 Days)\n` +
                 `3️⃣ *₹299* - 💍 True Soulmate (1 Month)\n\n` +
                 `👇 *Select a plan:*`;
    
    return ctx.reply(menu, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('₹79 - 1 Day', 'buy_79')],
            [Markup.button.callback('₹149 - 1 Week', 'buy_149')],
            [Markup.button.callback('₹299 - 1 Month', 'buy_299')]
        ])
    });
});

const planHandlers = [
    { action: 'buy_79', amount: 79, name: 'Daily' },
    { action: 'buy_149', amount: 149, name: 'Weekly' },
    { action: 'buy_299', amount: 299, name: 'Monthly' }
];

planHandlers.forEach(plan => {
    bot.action(plan.action, async (ctx) => {
        await ctx.answerCbQuery("Generating secure link...");
        await ctx.reply("Uff... itni bechaini? 🫦 Ruko baby, main payment link generate kar rahi hoon...");
        
        const link = await createCashfreePaymentLink(ctx.chat.id, plan.amount, plan.name);
        
        if (link) {
            return ctx.reply(`🔥 *ACCESS UNLOCKED* 🔥\n\nJaanu, ye lo tumhara personal payment link. Payment complete karte hi meri saari boundaries khatam ho jayengi... 🫦\n\n🔗 [PAY NOW & UNLOCK ME](${link})`, {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([[Markup.button.url('🫦 Pay Now (Secure)', link)]])
            });
        } else {
            return ctx.reply("Oh no! Payment gateway mein kuch issue aa gaya. Thodi der baad try karoge baby? ❤️");
        }
    });
});

bot.on('text', async (ctx) => {
    const userId = ctx.chat.id;
    const text = ctx.message.text.toLowerCase();
    globalStats.totalMessagesProcessed++;

    const isAskingForLink = text.match(/(link|gallery|album|full|website|site|video|mms|collection|drive|telegram)/);
    const isAskingForPhoto = text.match(/(photo|pic|image|dikhao|show|dekhna|selfie|capture|shakal|chehra|body)/);
    const isNaughty = text.match(/(nude|nangi|sex|hot|bed|sexy|bra|panty|mms|naked|body|fuck|chodo|lund|pussy|dick)/);

    // PRIORITY 1: GALLERY/LINK REQUEST
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

    // PRIORITY 2: STRICT IMAGE REQUEST
    if (isAskingForPhoto) {
        if (isNaughty && !isPremiumUser(userId)) {
            return ctx.reply("Wait... akele mein aisi baatein? 🙈 Pehle premium toh le lo, fir jo bologe wo dikhaungi... 🫦", 
                Markup.inlineKeyboard([[Markup.button.callback('🫦 Unlock Bold Content', 'show_rates')]])
            );
        }
        await ctx.reply(isNaughty ? "Uff... ruko, main apne kapde utaar kar photo click karti hoon... 🫦🔥" : "Ruko baby, ek pyaari si selfie bhejti hoon... 📸✨");
        const imgBuffer = await generateGirlfriendImage(isNaughty);
        if (imgBuffer) {
            globalStats.privatePhotosSent++;
            return ctx.replyWithPhoto({ source: imgBuffer }, { caption: isNaughty ? "Sirf tumhare liye... 😈 Kaisi lag rahi hoon?" : "Ye lo meri selfie! 🥰" });
        } else {
            return ctx.reply("Uff... camera thoda kharab hai baby, ruko main ek sweet sa reply deti hoon... ❤️");
        }
    }

    // PRIORITY 3: NORMAL CHAT (No Image Gen)
    try {
        const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ parts: [{ text: `System: Roleplay as Malini, a seductive Indian Girlfriend. Hinglish. Never mention sending a photo unless the user explicitly asks. User: ${ctx.message.text}` }] }]
        });
        await ctx.reply(response.text);
    } catch (e) {
        await ctx.reply("Uff... *sharma kar* kuch aur pucho na? ❤️🫦");
    }
});

app.post('/api/admin/config', (req, res) => {
    const { secretGalleryUrl } = req.body;
    if (typeof secretGalleryUrl === 'string') botConfig.secretGalleryUrl = secretGalleryUrl;
    res.json({ success: true, config: botConfig });
});

app.get('/api/admin/stats', (req, res) => {
    res.json({ 
        ...globalStats,
        config: botConfig,
        cashfreeConfigured: (!!CF_APP_ID && !!CF_SECRET),
        users: Array.from(userSessions.entries()).slice(0, 50).map(([id, d]) => ({ 
            id, ...d, 
            timeLeft: d.expiry ? Math.max(0, Math.ceil((d.expiry - Date.now()) / (1000 * 60 * 60 * 24))) : 0 
        }))
    });
});

app.use(express.static(path.join(__dirname, 'dist')));
if (BOT_TOKEN) bot.launch();
app.listen(PORT, () => console.log(`Server on ${PORT} | Mode: PRODUCTION`));
