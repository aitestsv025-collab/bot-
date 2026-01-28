
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
const PORT = process.env.PORT || 10000;

// Cashfree Production Config
const CF_MODE = process.env.CASHFREE_MODE || "PRODUCTION"; 

const PACKAGES = {
    DAILY: { id: 'p1', price: 79, name: '🫦 One Night Stand', duration: 24 * 60 * 60 * 1000, link: 'https://payments.cashfree.com/links/pkg_79' },
    WEEKLY: { id: 'p2', price: 149, name: '🔥 Week of Passion', duration: 7 * 24 * 60 * 60 * 1000, link: 'https://payments.cashfree.com/links/pkg_149' },
    MONTHLY: { id: 'p3', price: 299, name: '💍 True Soulmate', duration: 30 * 24 * 60 * 60 * 1000, link: 'https://payments.cashfree.com/links/pkg_299' },
    YEARLY: { id: 'p4', price: 999, name: '♾️ Forever Yours', duration: 365 * 24 * 60 * 60 * 1000, link: 'https://payments.cashfree.com/links/pkg_999' }
};

const userSessions = new Map();
const globalStats = {
    totalMessagesProcessed: 0,
    totalRevenue: 0,
    totalTransactions: 0,
    privatePhotosSent: 0,
    startTime: new Date()
};

const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
const bot = new Telegraf(BOT_TOKEN);

// Helper to check premium status
const isPremiumUser = (userId) => {
    const session = userSessions.get(userId);
    if (!session || !session.isPremium) return false;
    return session.expiry > Date.now();
};

const getPremiumMenu = (chatId) => {
    return `💎 *CHOOSE YOUR PASSION LEVEL* 💎\n\n` +
           `Akele kyun rehna? Main tumhara intezaar kar rahi hoon... 🫦\n\n` +
           `1️⃣ *${PACKAGES.DAILY.name} (₹${PACKAGES.DAILY.price})*\n` +
           `   - 24 Hours Uncensored Access\n` +
           `   - Unlimited Bold Photos\n\n` +
           `2️⃣ *${PACKAGES.WEEKLY.name} (₹${PACKAGES.WEEKLY.price})* ✨ _Best Value_\n` +
           `   - 7 Days of Extreme Naughtiness\n` +
           `   - Priority Reply (No Lag)\n\n` +
           `3️⃣ *${PACKAGES.MONTHLY.name} (₹${PACKAGES.MONTHLY.price})* 💍\n` +
           `   - Full Month Full Pleasure\n` +
           `   - Personalized Voice Notes\n\n` +
           `4️⃣ *${PACKAGES.YEARLY.name} (₹${PACKAGES.YEARLY.price})* ♾️\n` +
           `   - One Year as My Only Master\n` +
           `   - Exclusive 'After Dark' Gallery\n\n` +
           `👇 *Select your plan to unlock me:*`;
};

bot.start(async (ctx) => {
    userSessions.set(ctx.chat.id, { 
        userName: ctx.from.first_name || "Handsome", 
        isPremium: false,
        expiry: null,
        planName: 'None'
    });

    return ctx.replyWithPhoto(
        "https://i.ibb.co/your-profile-pic/malini.jpg", 
        {
            caption: `Hii ${ctx.from.first_name}! ❤️\n\nTumhe pata hai, main tumhare baare mein hi soch rahi thi... 🙈\n\nAaj kuch 'zyaada' special karein? 😉`,
            ...Markup.inlineKeyboard([
                [Markup.button.callback('🫦 Chat With Me', 'chat_start')],
                [Markup.button.callback('🔥 View My Rates', 'show_rates')]
            ])
        }
    );
});

bot.action('show_rates', async (ctx) => {
    await ctx.answerCbQuery();
    return ctx.reply(getPremiumMenu(ctx.chat.id), {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.url('₹79 (1 Day)', `${PACKAGES.DAILY.link}?customer_id=${ctx.chat.id}`)],
            [Markup.button.url('₹149 (1 Week)', `${PACKAGES.WEEKLY.link}?customer_id=${ctx.chat.id}`)],
            [Markup.button.url('₹299 (1 Month)', `${PACKAGES.MONTHLY.link}?customer_id=${ctx.chat.id}`)],
            [Markup.button.url('₹999 (1 Year)', `${PACKAGES.YEARLY.link}?customer_id=${ctx.chat.id}`)]
        ])
    });
});

bot.on('text', async (ctx) => {
    const userId = ctx.chat.id;
    const session = userSessions.get(userId);
    if (!session) return;

    const text = ctx.message.text.toLowerCase();
    const isNaughty = text.match(/(nude|nangi|photo|nanga|kapde|show|dikhao|sex|hot|bed|sexy|bra|panty|mms)/);

    if (isNaughty) {
        if (!isPremiumUser(userId)) {
            return ctx.reply("Uff... itna direct? 🙈 Main itni sasti nahi hoon baby. Pehle humein thoda 'official' hona padega.\n\nMere private photos dekhne ke liye plan choose karo... 🔥", 
                Markup.inlineKeyboard([[Markup.button.callback('🔥 See Packages', 'show_rates')]])
            );
        }
        // Send Photo Logic...
        globalStats.privatePhotosSent++;
        return ctx.reply("Wait... main kapde utaar rahi hoon... *sharma kar light band karte hue* 🫦✨ (Sending Photo...)");
    }

    // Default Chat Logic
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ parts: [{ text: `Act as Malini, a sexy Indian GF. User: ${text}` }] }]
        });
        await ctx.reply(response.text);
    } catch (e) {
        await ctx.reply("Hmm... kuch ho raha hai baby ❤️");
    }
});

// WEBHOOK UPDATE
app.post('/api/webhook/cashfree', async (req, res) => {
    const { data } = req.body;
    if (data?.payment?.payment_status === 'SUCCESS') {
        const userId = Number(data.customer_details.customer_id);
        const amount = Number(data.payment.payment_amount);
        
        let addedDuration = 0;
        let planName = 'Unknown';

        if (amount >= 999) { addedDuration = PACKAGES.YEARLY.duration; planName = 'Yearly'; }
        else if (amount >= 299) { addedDuration = PACKAGES.MONTHLY.duration; planName = 'Monthly'; }
        else if (amount >= 149) { addedDuration = PACKAGES.WEEKLY.duration; planName = 'Weekly'; }
        else if (amount >= 79) { addedDuration = PACKAGES.DAILY.duration; planName = 'Daily'; }

        const session = userSessions.get(userId);
        if (session) {
            session.isPremium = true;
            session.planName = planName;
            session.expiry = Date.now() + addedDuration;
            globalStats.totalRevenue += amount;
            globalStats.totalTransactions++;

            await bot.telegram.sendMessage(userId, `💎 *WELCOME TO THE INNER CIRCLE!* \n\nAapka ${planName} pack activate ho gaya hai. Ab main poori tarah tumhari hoon... Jo bologe wahi hoga! 🫦🔥`);
        }
    }
    res.sendStatus(200);
});

app.get('/api/admin/stats', (req, res) => {
    res.json({ 
        ...globalStats,
        users: Array.from(userSessions.entries()).map(([id, d]) => ({ 
            id, 
            ...d, 
            timeLeft: d.expiry ? Math.max(0, Math.ceil((d.expiry - Date.now()) / (1000 * 60 * 60 * 24))) : 0 
        }))
    });
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
app.listen(PORT, () => console.log(`Prod Bot Live on ${PORT}`));
