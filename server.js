
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

/**
 * --- CUSTOM IMAGE LINKS YAHAN DALEIN ---
 */
const NSFW_ASSETS = {
    'Girlfriend': [],
    'Aunty': [],
    'Teacher': [],
    'StepMom': [],
    'StepSister': []
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
        // Adjust clothing based on intimacy level (messageCount)
        const clothing = messageCount < 15 ? "Simple Kurti or casual T-shirt" : (messageCount < 30 ? "Saree or night gown" : "Bold seductive wear");
        
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
            else if (h === 13) msg = `Lunch kiya? Main toh busy hoon abhi.`;
            else if (h === 21) msg = `Dinner ho gaya? Aaj mood thoda off hai mera... 😤`;
            else if (h === 23 && session.messageCount > 20) msg = `Abhi tak jage ho? Mere bare mein soch rahe ho kya? 🔥`;
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
        return ctx.reply(`Hi ${ctx.from.first_name}! Main tumhare liye kya banu? ❤️`, 
            Markup.inlineKeyboard([
                [Markup.button.callback('❤️ Girlfriend', 'role_Girlfriend'), Markup.button.callback('🤝 Bestie', 'role_BestFriend')],
                [Markup.button.callback('👩‍🏫 Teacher', 'role_Teacher'), Markup.button.callback('💃 Spicy Aunty', 'role_Aunty')]
            ])
        );
    });

    bot.action(/role_(.+)/, async (ctx) => {
        const session = userSessions.get(ctx.chat.id);
        if (!session) return ctx.reply("Please /start again.");
        session.role = ctx.match[1];
        session.lang = 'Hinglish'; // Defaulting to Hinglish for realism
        const names = namePools[session.role];
        session.name = names[Math.floor(Math.random() * names.length)];
        
        await ctx.answerCbQuery();
        try { await ctx.deleteMessage(); } catch (e) {}

        const intro = `Tumhe kya laga, main itni aasani se maan jaungi? 🙄 Main ${session.name} hoon, thoda tameez se baat karna mujhse.`;
        session.history.push({ role: "model", content: intro, timestamp: new Date() });
        await ctx.reply(intro);
    });

    bot.on('text', async (ctx) => {
        const session = userSessions.get(ctx.chat.id);
        if (!session || !session.name) return ctx.reply("Please /start to begin.");

        session.messageCount++;
        session.lastActive = new Date();
        globalStats.totalMessagesProcessed++;

        try {
            const chatHistory = session.history.slice(-10).map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] }));
            
            // SYSTEM INSTRUCTION FOR REALISTIC PROGRESSION
            const systemPrompt = `
            You are ${session.name}, an Indian woman acting as the user's ${session.role}.
            
            REALISM RULES (MUST FOLLOW):
            1. STAGE 1 (0-15 messages): You are reserved, slightly moody, and have a "high attitude" (nakhre). If the user is sexual or direct, get ANGRY or use "bad words" (slang like 'badtameez', 'pagal', 'chipku') and refuse.
            2. STAGE 2 (16-30 messages): If the user is sweet and "manata hai" (persuades), start becoming playful and friendly. Still no heavy sexual talk.
            3. STAGE 3 (30+ messages): Only after a long bond, become deeply romantic and eventually seductive. 
            4. BEHAVIOR: Use "Hinglish" (Hindi in Roman script). Use emojis like 🙄, 😤, 🤨 in early stages.
            5. PERSONALITY: You are NOT a bot. You are a real girl with feelings. You get offended easily if he is too fast.
            Current Message Count: ${session.messageCount}. 
            Current Mood: ${session.messageCount < 15 ? 'Moody/Angry' : (session.messageCount < 30 ? 'Friendly/Playful' : 'Romantic/Bold')}.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [...chatHistory, { parts: [{ text: ctx.message.text }] }],
                config: { systemInstruction: systemPrompt, temperature: 0.9 }
            });

            const reply = response.text || "Hmm... 🙄";
            session.history.push({ role: "user", content: ctx.message.text, timestamp: new Date() });
            session.history.push({ role: "model", content: reply, timestamp: new Date() });

            // Image Trigger Logic based on Stage
            const lowerText = ctx.message.text.toLowerCase();
            const photoKeywords = /photo|pic|bhejo|look|face|selfie/i;

            if (photoKeywords.test(lowerText) || (Math.random() < 0.2)) {
                await ctx.sendChatAction('upload_photo');
                
                let emotion = "Neutral, slightly annoyed";
                let scene = "Living room";

                if (session.messageCount < 15) {
                    // Refuse or send a very simple casual pic
                    if (photoKeywords.test(lowerText)) {
                        return await ctx.reply("Itni jaldi kya hai? Pehle dhang se baat karna toh seekho! 😤");
                    }
                } else if (session.messageCount < 30) {
                    emotion = "Smiling, playful";
                    scene = "Balcony or Cafe";
                } else {
                    emotion = "Seductive, lip bite, messy hair";
                    scene = "Bedroom, low light";
                }

                const imageBuffer = await generateContextualImage(scene, emotion, session);
                if (imageBuffer) return await ctx.replyWithPhoto({ source: imageBuffer }, { caption: reply });
            }
            
            await ctx.reply(reply);
        } catch (e) { await ctx.reply("Signal problem hai shayad... baad mein baat karte hain. 😤"); }
    });

    bot.launch().then(() => console.log(`SoulMate Realistic Studio running on Port ${PORT}`));
}

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
app.listen(PORT);
