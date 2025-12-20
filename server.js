
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

const namePools = {
    'Girlfriend': ['Riya', 'Sana', 'Ishani', 'Myra', 'Tanvi', 'Priya'],
    'BestFriend': ['Sneha', 'Anjali', 'Kritika', 'Diya', 'Tanu'],
    'Teacher': ['Ms. Sharma', 'Ms. Gupta', 'Aditi Ma\'am', 'Ms. Deshmukh', 'Neha Miss'],
    'Aunty': ['Sunita Ji', 'Meena Ji', 'Kavita Aunty', 'Rajeshwari', 'Pushpa'],
    'StepMom': ['Seema', 'Kiran', 'Rekha', 'Vandana', 'Anita'],
    'StepSister': ['Ishita', 'Ananya', 'Jhanvi', 'Khushi', 'Navya']
};

// Character facial consistency map - assigned per session to keep the face same
const facialProfiles = [
    "fair skin, sharp nose, almond-shaped eyes, long silky dark hair",
    "wheatish complexion, round face, expressive large eyes, shoulder length hair",
    "oval face, high cheekbones, dark brown eyes, thick straight hair",
    "dimpled cheeks, thin lips, black hair with soft curls"
];

const ai = (BOT_TOKEN && GEMINI_KEY) ? new GoogleGenAI({ apiKey: GEMINI_KEY }) : null;
const bot = BOT_TOKEN ? new Telegraf(BOT_TOKEN) : null;

async function generateContextualImage(emotion, session) {
    if (!ai) return null;
    try {
        const { name, role, facialProfile } = session;
        // Strict prompt for photorealism, CONSISTENT FACE, and dynamic EMOTION
        const visualPrompt = `A high-end RAW photorealistic smartphone selfie of a beautiful young Indian woman named ${name}. 
        FEATURES: ${facialProfile}.
        ROLE: ${role}.
        EXPRESSION/MOOD: ${emotion}. 
        STYLE: Realistic skin texture, natural lighting, bokeh, high quality.
        STRICT RULES: 
        1. ABSOLUTELY NO TEXT, NO LETTERS, NO NUMBERS IN THE IMAGE.
        2. NO CARTOON, NO ANIME, NO 3D RENDER.
        3. MUST BE THE SAME PERSON AS PREVIOUS PHOTOS.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: [{ parts: [{ text: visualPrompt }] }],
            config: {
                imageConfig: { aspectRatio: "1:1" }
            }
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return Buffer.from(part.inlineData.data, 'base64');
            }
        }
    } catch (e) {
        console.error("Image generation failed:", e.message);
    }
    return null;
}

async function sendAutoMessage(chatId, text) {
    const session = userSessions.get(chatId);
    if (!session || !bot || !session.name) return;
    try {
        await bot.telegram.sendMessage(chatId, text);
        session.history.push({ role: "model", content: `[AUTO] ${text}`, timestamp: new Date() });
    } catch (e) {
        console.error("Auto-message failed:", e.message);
    }
}

setInterval(() => {
    const now = new Date();
    const hours = now.getHours();
    userSessions.forEach(async (session, chatId) => {
        if (!session.name) return;
        if (now.getMinutes() === 0) {
            if (hours === 10) await sendAutoMessage(chatId, "*Gusse me* Kal raat kaha gayab the? Bina bataye so gaye? 😤☕");
        }
    });
}, 60000);

app.get('/api/admin/stats', (req, res) => {
    const users = Array.from(userSessions.entries()).map(([id, data]) => ({
        id, userName: data.userName, role: data.role || 'Selecting...',
        messageCount: data.messageCount || 0, lastActive: data.lastActive || new Date(),
        chatHistory: data.history || []
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
        return ctx.reply(`Aap kisse baat karna chahenge? ❤️`, 
            Markup.inlineKeyboard([
                [Markup.button.callback('❤️ Girlfriend', 'role_Girlfriend'), Markup.button.callback('🤝 Best Friend', 'role_BestFriend')],
                [Markup.button.callback('👩‍🏫 Teacher', 'role_Teacher'), Markup.button.callback('💃 Aunty', 'role_Aunty')],
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
        return ctx.reply(`Ab language select karein: ✨`, 
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

        const loadingMsg = await ctx.reply(`Connecting to ${session.name}... 💓`);
        try {
            const introPrompt = `You are ${session.name}, user's ${session.role}. 
            CRITICAL: Start the conversation with strong NAKHRE (stubborn/angry). 
            You are annoyed that the user just showed up. Be rude but in a real-life moody girl way.
            Response: 2 lines with 🙄 or 😤. Language: ${session.lang} script.`;

            const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: introPrompt });
            const firstMsg = response.text || "Hmm... toh aap aa gaye? ❤️";
            session.history.push({ role: "model", content: firstMsg, timestamp: new Date() });
            
            const imageBuffer = await generateContextualImage("Looking extremely annoyed, crossing arms, angry facial expression", session);
            try { await ctx.deleteMessage(loadingMsg.message_id); } catch (e) {}
            if (imageBuffer) await ctx.replyWithPhoto({ source: imageBuffer }, { caption: firstMsg });
            else await ctx.reply(firstMsg);
        } catch (e) {
            await ctx.reply(`*Muh fer kar* Badi jaldi yaad aa gayi meri? 😤`);
        }
    });

    bot.on('text', async (ctx) => {
        const session = userSessions.get(ctx.chat.id);
        if (!session || !session.name) return ctx.reply("Please /start to set up your partner.");

        session.messageCount++;
        session.lastActive = new Date();
        globalStats.totalMessagesProcessed++;

        try {
            const chatHistoryForAI = session.history.slice(-10).map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] }));
            
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [...chatHistoryForAI, { parts: [{ text: ctx.message.text }] }],
                config: {
                    systemInstruction: `You are ${session.name}, a real girl with high standards and moods.
                    INTELLECT RULE: Understand the user's intent. If they are being cheesy, show nakhre. If they are apologetic, stay stubborn for a while.
                    NAKHRE LOGIC: 
                    - First 5-7 messages: Be angry, give short answers, show attitude (*muh fulate hue*, *ignoring*).
                    - Transition: Only if user is very sweet, slowly melt into shyness (*sharmate hue*).
                    - Never repeat phrases. Describe actions in *asterisks*.
                    MAX 2-3 lines. Use emojis. Speak ONLY in ${session.lang}.`,
                    temperature: 0.9
                }
            });

            const reply = response.text || "Hmm... 😤";
            session.history.push({ role: "user", content: ctx.message.text, timestamp: new Date() });
            session.history.push({ role: "model", content: reply, timestamp: new Date() });

            // Determine if image is needed and what emotion
            const isMelting = reply.includes("sharma") || reply.includes("sweet") || reply.includes("❤️") || reply.includes("🥰");
            const visualKeywords = /dress|look|photo|face|eyes|sharma|selfie|wear|gussa|nakhre/i;
            
            if (Math.random() < 0.3 || visualKeywords.test(reply)) {
                await ctx.sendChatAction('upload_photo');
                const emotionDesc = isMelting ? "blushing shyly, looking away, smiling softly" : "angry, annoyed, rolling eyes, stubborn face";
                const imageBuffer = await generateContextualImage(emotionDesc, session);
                if (imageBuffer) return await ctx.replyWithPhoto({ source: imageBuffer }, { caption: reply });
            }
            await ctx.reply(reply);
        } catch (e) { 
            await ctx.reply("*Gusse me phone phenkte hue* Signal nahi aa raha! 😤");
        }
    });

    bot.launch();
}

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
app.listen(PORT, () => console.log(`Server running on Port ${PORT}`));
