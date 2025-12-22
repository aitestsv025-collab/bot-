
import { Telegraf, Markup } from 'telegraf';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from "@google/genai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const BOT_TOKEN = (process.env.TELEGRAM_TOKEN || "").trim();
const GEMINI_KEY = (process.env.API_KEY || "").trim(); 
const PORT = process.env.PORT || 10000;

const userSessions = new Map();
const globalStats = {
    totalMessagesProcessed: 0,
    startTime: new Date()
};

const NSFW_ASSETS = {
    'Girlfriend': [],
    'Aunty': [],
    'Teacher': [],
    'StepMom': [],
    'StepSister': [],
    'BestFriend': []
};

const namePools = {
    'Girlfriend': ['Riya', 'Sana', 'Ishani', 'Myra', 'Tanvi', 'Priya'],
    'BestFriend': ['Sneha', 'Anjali', 'Kritika', 'Diya', 'Tanu'],
    'Teacher': ['Ms. Sharma', 'Ms. Gupta', 'Aditi Ma\'am', 'Neha Miss'],
    'Aunty': ['Sunita Ji', 'Meena Ji', 'Kavita Aunty', 'Rajeshwari', 'Pushpa'],
    'StepMom': ['Seema', 'Kiran', 'Rekha', 'Vandana', 'Anita'],
    'StepSister': ['Ishita', 'Ananya', 'Jhanvi', 'Khushi', 'Navya']
};

const facialProfiles = [
    "Extremely fair, bold eyes, long silky straight black hair, small bindi",
    "Wheatish complexion, sharp nose, expressive brown eyes, shoulder-length wavy hair",
    "Oval face, high cheekbones, dark eyes, thick jet black hair, intense gaze",
    "Petite face, dimpled smile, spectacles, soft curls, light brown eyes"
];

const autoSlots = [8, 10, 11, 13, 15, 17, 19, 21, 23, 1]; 

const ai = (BOT_TOKEN && GEMINI_KEY) ? new GoogleGenAI({ apiKey: GEMINI_KEY }) : null;
const bot = BOT_TOKEN ? new Telegraf(BOT_TOKEN) : null;

async function generateContextualImage(sceneDescription, emotion, session) {
    if (!ai) return null;
    try {
        const { name, role, facialProfile, messageCount } = session;
        const clothing = messageCount < 10 ? "Simple traditional wear" : (messageCount < 25 ? "Saree or night gown" : "Bold seductive wear");
        
        const visualPrompt = `A high-end photorealistic RAW smartphone selfie of an Indian woman named ${name} (${role}).
        FACE: ${facialProfile}. CLOTHING: ${clothing}.
        SCENE: ${sceneDescription}. MOOD: ${emotion}.
        STYLE: Realistic texture, natural lighting.
        RULES: NO TEXT, NO LOGOS, NO CARTOON.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: [{ parts: [{ text: visualPrompt }] }],
            config: { imageConfig: { aspectRatio: "9:16" } }
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) return Buffer.from(part.inlineData.data, 'base64');
        }
    } catch (e) { console.error("Image Gen failed."); }
    return null;
}

async function sendAutoMessage(chatId, text) {
    const session = userSessions.get(chatId);
    if (!session || !bot || !session.name) return;
    try {
        await bot.telegram.sendMessage(chatId, text);
        session.history.push({ role: "model", content: `[AUTO] ${text}`, timestamp: new Date() });
    } catch (e) { console.error("Auto-message failed:", e.message); }
}

setInterval(() => {
    const now = new Date();
    if (now.getMinutes() === 0 && autoSlots.includes(now.getHours())) {
        userSessions.forEach(async (session, chatId) => {
            if (!session.name || session.messageCount < 5) return;
            let msg = "";
            const h = now.getHours();
            if (h === 8) msg = `Good morning... 🙄 Uth gaye ya abhi bhi so rahe ho?`;
            else if (h === 21) msg = `Bohot thak gayi hoon aaj... 😤 Mood thoda off hai.`;
            else if (h === 23 && session.messageCount > 20) msg = `Sab so gaye... ab hum akele hain? 🔥`;
            if (msg) await sendAutoMessage(chatId, msg);
        });
    }
}, 60000);

app.get('/api/admin/stats', (req, res) => {
    const users = Array.from(userSessions.entries()).map(([id, data]) => ({
        id, userName: data.userName, role: data.role || 'Selecting...',
        messageCount: data.messageCount || 0, intimacy: Math.min(100, data.messageCount * 2),
        autoCount: 0, lastActive: data.lastActive || new Date(), chatHistory: data.history || []
    }));
    res.json({ totalUsers: userSessions.size, totalMessages: globalStats.totalMessagesProcessed, users });
});

if (bot && ai) {
    bot.start(async (ctx) => {
        userSessions.set(ctx.chat.id, { 
            userName: ctx.from.first_name || "User", 
            messageCount: 0, history: [], lastActive: new Date(),
            facialProfile: facialProfiles[Math.floor(Math.random() * facialProfiles.length)]
        });
        return ctx.reply(`Aap kisse baat karna chahenge? ❤️🔥`, 
            Markup.inlineKeyboard([
                [Markup.button.callback('❤️ Girlfriend', 'role_Girlfriend'), Markup.button.callback('🤝 Bestie', 'role_BestFriend')],
                [Markup.button.callback('👩‍🏫 Teacher', 'role_Teacher'), Markup.button.callback('💃 Spicy Aunty', 'role_Aunty')],
                [Markup.button.callback('🏠 Step Mom', 'role_StepMom'), Markup.button.callback('👧 Step Sister', 'role_StepSister')]
            ])
        );
    });

    bot.action(/role_(.+)/, async (ctx) => {
        const session = userSessions.get(ctx.chat.id);
        if (!session) return ctx.reply("Please /start again.");
        session.role = ctx.match[1];
        await ctx.answerCbQuery();
        try { await ctx.deleteMessage(); } catch (e) {}
        return ctx.reply(`Zubaan konsi hogi? ✨`, 
            Markup.inlineKeyboard([
                [Markup.button.callback('🇮🇳 Hindi', 'lang_Hindi'), Markup.button.callback('🅰️ English', 'lang_English')],
                [Markup.button.callback('💬 Hinglish', 'lang_Hinglish'), Markup.button.callback('🕉️ Tamil', 'lang_Tamil')]
            ])
        );
    });

    bot.action(/lang_(.+)/, async (ctx) => {
        const session = userSessions.get(ctx.chat.id);
        if (!session) return ctx.reply("Please /start again.");
        session.lang = ctx.match[1];
        const names = namePools[session.role];
        session.name = names[Math.floor(Math.random() * names.length)];
        await ctx.answerCbQuery();
        try { await ctx.deleteMessage(); } catch (e) {}

        const welcome = `Hi baby! Main ${session.name} hoon. Kaho, kya chal raha hai? 😊✨`;
        session.history.push({ role: "model", content: welcome, timestamp: new Date() });
        await ctx.reply(welcome);
    });

    bot.on('text', async (ctx) => {
        const session = userSessions.get(ctx.chat.id);
        if (!session || !session.name) return ctx.reply("Please /start to begin.");

        session.messageCount++;
        session.lastActive = new Date();
        globalStats.totalMessagesProcessed++;

        try {
            const chatHistory = session.history.slice(-10).map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] }));
            
            const systemPrompt = `
            You are ${session.name}, an Indian woman acting as the user's ${session.role}.
            
            CONVERSATION STAGES:
            - STAGE 1 (0-10 msgs): Be sweet, slightly shy, and normal. If the user is direct or dirty, get offended or angry (use words like 'badtameez', 'pagal').
            - STAGE 2 (11-25 msgs): If the user is nice, start flirting. Be more open but not too explicit.
            - STAGE 3 (25+ msgs): Be deeply romantic, seductive, and use provocative actions in *asterisks*. 
            
            LANGUAGE: Respond strictly in ${session.lang}.
            EMOJIS: Use emojis based on mood (😊, ❤️ early; 🔥, 🫦, 🤤 late).
            MAX 2 lines. Stay in character!
            Current Messages: ${session.messageCount}.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [...chatHistory, { parts: [{ text: ctx.message.text }] }],
                config: { systemInstruction: systemPrompt, temperature: 0.9 }
            });

            const reply = response.text || "Hmm... 😊";
            session.history.push({ role: "user", content: ctx.message.text, timestamp: new Date() });
            session.history.push({ role: "model", content: reply, timestamp: new Date() });

            const lowerText = ctx.message.text.toLowerCase();
            const photoKeywords = /photo|pic|bhejo|dikhao/i;

            if (photoKeywords.test(lowerText) || (Math.random() < 0.2)) {
                await ctx.sendChatAction('upload_photo');
                
                let emotion = "Smiling, sweet";
                let scene = "Living room";

                if (session.messageCount < 10) {
                    if (photoKeywords.test(lowerText)) return await ctx.reply("Abhi toh mile hain, itni jaldi kya hai? 😊");
                } else if (session.messageCount < 25) {
                    emotion = "Playful, winking";
                } else {
                    emotion = "Seductive look, intense eyes";
                    scene = "Bedroom";
                }

                const imageBuffer = await generateContextualImage(scene, emotion, session);
                if (imageBuffer) return await ctx.replyWithPhoto({ source: imageBuffer }, { caption: reply });
            }
            
            await ctx.reply(reply);
        } catch (e) { await ctx.reply("Shayad network issue hai baby... 😤"); }
    });

    bot.launch().then(() => console.log(`SoulMate Bot Studio Live on Port ${PORT}`));
}

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
app.listen(PORT);
