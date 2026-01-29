
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

// Internal State
const userSessions = new Map();
const globalStats = {
    totalMessagesProcessed: 0,
    totalRevenue: 0,
    totalTransactions: 0,
    privatePhotosSent: 0,
    startTime: new Date(),
    totalUsers: 0
};

// Bot Config (Dynamic)
let botConfig = {
    welcomeImageUrl: "https://picsum.photos/seed/soulmate_welcome/800/1200",
    botName: "Malini"
};

// --- CASHFREE API INTEGRATION ---
async function createCashfreePaymentLink(userId, amount, planName) {
    const baseUrl = "https://api.cashfree.com/pg/links";
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
                link_purpose: `Unlock ${planName} Access`,
                link_meta: { 
                  return_url: `https://t.me/soulmate_ai_bot`, 
                  notify_url: `https://${process.env.RENDER_EXTERNAL_HOSTNAME || 'your-domain.com'}/api/cashfree/webhook`
                }
            })
        });

        const data = await response.json();
        return data.link_url || null;
    } catch (error) {
        console.error("Cashfree Link Gen Failed:", error);
        return null;
    }
}

app.post('/api/cashfree/webhook', (req, res) => {
    const { link_id, link_status, link_amount } = req.body;
    if (link_status === 'PAID') {
        const userIdString = link_id.split('_')[1];
        const userId = parseInt(userIdString);
        const session = userSessions.get(userId);
        if (session) {
            let days = link_amount >= 299 ? 30 : (link_amount >= 149 ? 7 : 1);
            session.isPremium = true;
            session.expiry = Date.now() + (days * 24 * 60 * 60 * 1000);
            session.planName = days === 30 ? 'Monthly' : (days === 7 ? 'Weekly' : 'Daily');
            globalStats.totalRevenue += parseFloat(link_amount);
            bot.telegram.sendMessage(userId, "❤️ *Jaanu, payment mil gayi!* Ab main tumhari premium partner hoon. 🫦 Mere saare bold photos aur private links ab tumhare liye open hain! *mwah*");
        }
    }
    res.send("OK");
});

const bot = new Telegraf(BOT_TOKEN);

const isPremiumUser = (userId) => {
    const session = userSessions.get(userId);
    return session && session.isPremium && (session.expiry > Date.now());
};

const generateGirlfriendImage = async (isBold = false) => {
    if (!GEMINI_KEY) return null;
    const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
    const prompt = isBold 
        ? "Cinematic realistic 8k photo of a beautiful Indian woman in provocative nightwear, messy hair, low light bedroom setting, seductive eyes."
        : "A stunningly beautiful Indian girl in casual dress, smiling warmly, outdoor natural lighting, high quality realistic portrait.";
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: "9:16" } }
        });
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) return Buffer.from(part.inlineData.data, 'base64');
        }
    } catch (e) { return null; }
};

bot.start(async (ctx) => {
    const userId = ctx.chat.id;
    if (!userSessions.has(userId)) {
        globalStats.totalUsers++;
        userSessions.set(userId, { 
            userName: ctx.from.first_name || "Handsome", 
            isPremium: false,
            expiry: null,
            language: 'Hinglish',
            role: 'Romantic'
        });
    }

    return ctx.replyWithPhoto(
        botConfig.welcomeImageUrl, 
        {
            caption: `Hey ${ctx.from.first_name}! ❤️\n\nMain ${botConfig.botName}... tumhari digital SoulMate. 🫦\n\nBaatein shuru karne se pehle setting kar lo Jaanu:`,
            ...Markup.inlineKeyboard([
                [Markup.button.callback('🌐 Set Language', 'menu_lang')],
                [Markup.button.callback('🎭 Choose Role', 'menu_role')],
                [Markup.button.callback('🫦 Start Chatting', 'chat_start')],
                [Markup.button.callback('🔥 Join Premium', 'show_rates')]
            ])
        }
    );
});

bot.action('menu_lang', (ctx) => ctx.editMessageCaption("Select your language baby: 🫦", Markup.inlineKeyboard([
    [Markup.button.callback('🇮🇳 Hindi', 'set_lang_Hindi'), Markup.button.callback('🇬🇧 English', 'set_lang_English')],
    [Markup.button.callback('🇮🇳 Tamil', 'set_lang_Tamil'), Markup.button.callback('🇮🇳 Telugu', 'set_lang_Telugu')],
    [Markup.button.callback('🗣️ Hinglish', 'set_lang_Hinglish')],
    [Markup.button.callback('⬅️ Back', 'back_start')]
])));

bot.action('menu_role', (ctx) => ctx.editMessageCaption("Main kaun banoon aaj? 😉", Markup.inlineKeyboard([
    [Markup.button.callback('❤️ Romantic', 'set_role_Romantic'), Markup.button.callback('🔥 Naughty', 'set_role_Naughty')],
    [Markup.button.callback('👵 Aunty', 'set_role_Aunty'), Markup.button.callback('👩‍🏫 Teacher', 'set_role_Teacher')],
    [Markup.button.callback('👗 Stepmom', 'set_role_Stepmom'), Markup.button.callback('👧 Stepsister', 'set_role_Stepsister')],
    [Markup.button.callback('💼 Boss', 'set_role_Boss'), Markup.button.callback('🏡 Neighbor', 'set_role_Neighbor')],
    [Markup.button.callback('⬅️ Back', 'back_start')]
])));

bot.action(/set_(lang|role)_(.+)/, async (ctx) => {
    const [, type, value] = ctx.match;
    const session = userSessions.get(ctx.chat.id);
    if (session) session[type === 'lang' ? 'language' : 'role'] = value;
    await ctx.answerCbQuery(`${value} selected!`);
    return ctx.reply(`Done baby! Ab main ${value} bankar tumse connect rahungi... 🫦`);
});

bot.action('back_start', (ctx) => ctx.editMessageCaption("Settings update kar lo baby... 😉", Markup.inlineKeyboard([
    [Markup.button.callback('🌐 Set Language', 'menu_lang')],
    [Markup.button.callback('🎭 Choose Role', 'menu_role')],
    [Markup.button.callback('🫦 Start Chatting', 'chat_start')],
    [Markup.button.callback('🔥 Join Premium', 'show_rates')]
])));

bot.action('chat_start', async (ctx) => {
    const session = userSessions.get(ctx.chat.id);
    const role = session?.role || 'Romantic';
    const lang = session?.language || 'Hinglish';
    
    await ctx.reply("Ruko baby, main taiyar ho rahi hoon... 🫦✨");
    
    try {
        const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
        const storyPrompt = `Act as an Indian woman in the role of ${role}. Language: ${lang}. 
        Create a very short, engaging 2-sentence story starter/hook to start a spicy or intimate roleplay. 
        Scenario should match the role (e.g., if Teacher, alone in class; if Boss, stay late in office). 
        Format: Just the hook message with *asterisks* for actions. No meta.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ parts: [{ text: storyPrompt }] }]
        });
        return ctx.reply(response.text);
    } catch (e) {
        return ctx.reply("Bolo na Jaanu... main wait kar rahi hoon? 🫦");
    }
});

bot.action('show_rates', (ctx) => ctx.reply("💍 *PREMIUM PLANS* 💍\n\n1️⃣ ₹79 - One Day\n2️⃣ ₹149 - One Week\n3️⃣ ₹299 - One Month\n\nPayment ke baad automatic unlock ho jayega baby:", {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
        [Markup.button.callback('₹79 - 1 Day', 'pay_79')],
        [Markup.button.callback('₹149 - 1 Week', 'pay_149')],
        [Markup.button.callback('₹299 - 1 Month', 'pay_299')]
    ])
}));

bot.action(/pay_(.+)/, async (ctx) => {
    const amount = parseInt(ctx.match[1]);
    const link = await createCashfreePaymentLink(ctx.chat.id, amount, `${amount} Plan`);
    if (link) {
        return ctx.reply(`🫦 Ye lo baby payment link, jaldi aao:\n\n🔗 [CLICK HERE TO PAY](${link})`, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([[Markup.button.url('🔥 Pay Securely', link)]])
        });
    }
    return ctx.reply("Oops! Link generator fail ho gaya baby, try again. ❤️");
});

bot.on('text', async (ctx) => {
    const userId = ctx.chat.id;
    const session = userSessions.get(userId) || { language: 'Hinglish', role: 'Romantic' };
    const text = ctx.message.text.toLowerCase();
    globalStats.totalMessagesProcessed++;

    const photoKeywords = ['photo', 'pic', 'image', 'selfie', 'dikhao', 'show', 'face', 'shakal'];
    if (photoKeywords.some(key => text.includes(key))) {
        const isBold = text.match(/(nude|nangi|sexy|hot|bed|naked|body)/);
        if (isBold && !isPremiumUser(userId)) {
            return ctx.reply("Uff... aisi bold photos ke liye premium join karo baby! 🙈🫦", Markup.inlineKeyboard([[Markup.button.callback('🔥 Join Premium', 'show_rates')]]));
        }
        await ctx.reply("Ruko baby, photo click kar rahi hoon... 🫦📸");
        const img = await generateGirlfriendImage(isBold);
        if (img) {
            globalStats.privatePhotosSent++;
            return ctx.replyWithPhoto({ source: img }, { caption: "Kaisi lag rahi hoon? Sirf tumhare liye... 🫦" });
        }
    }

    try {
        const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
        const systemPrompt = `You are ${botConfig.botName}. Role: ${session.role}. Language: ${session.language}. 
        User is your lover. Be seductive, flirty and deeply engaging. 
        RULES: 
        1. NEVER generate or mention creating images in text. 
        2. Speak only in ${session.language}. 
        3. Use *asterisks* for physical actions. 
        4. Keep it to 2-3 sentences max.`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ parts: [{ text: `${systemPrompt}\n\nLover: ${ctx.message.text}` }] }]
        });
        await ctx.reply(response.text);
    } catch (e) {
        await ctx.reply("Uff... kuch network issue hai Jaanu. ❤️");
    }
});

// Admin API
app.get('/api/admin/stats', (req, res) => {
    res.json({ 
        ...globalStats,
        config: botConfig,
        users: Array.from(userSessions.entries()).slice(0, 50).map(([id, d]) => ({ id, ...d }))
    });
});

app.post('/api/admin/config', (req, res) => {
    if (req.body.welcomeImageUrl) botConfig.welcomeImageUrl = req.body.welcomeImageUrl;
    if (req.body.botName) botConfig.botName = req.body.botName;
    res.json({ success: true, config: botConfig });
});

app.use(express.static(path.join(__dirname, 'dist')));
if (BOT_TOKEN) bot.launch();
app.listen(PORT, () => console.log(`SoulMate Engine Active on Port ${PORT}`));
