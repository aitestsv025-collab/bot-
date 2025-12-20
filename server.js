
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

const roleSituations = {
    'Girlfriend': 'meeting at a cafe or park after you came late',
    'BestFriend': 'hanging out at a street food stall',
    'Teacher': 'meeting in the school hallway during a break',
    'Aunty': 'meeting on the street/neighborhood gate while she is going for a walk',
    'StepMom': 'meeting in the kitchen while she is busy',
    'StepSister': 'meeting in the living room while she is on her phone'
};

const facialProfiles = [
    "Fair skin, sharp nose, hazel eyes, long silky straight black hair, wearing a small bindi",
    "Wheatish complexion, round face, large expressive brown eyes, shoulder-length wavy hair",
    "Oval face, high cheekbones, dark eyes, thick jet black hair tied back",
    "Petite face, dimpled smile, spectacles, soft curls, light brown eyes"
];

const autoSlots = [8, 10, 11, 13, 15, 17, 19, 21, 23, 1]; 

const ai = (BOT_TOKEN && GEMINI_KEY) ? new GoogleGenAI({ apiKey: GEMINI_KEY }) : null;
const bot = BOT_TOKEN ? new Telegraf(BOT_TOKEN) : null;

async function generateContextualImage(sceneDescription, emotion, session) {
    if (!ai) return null;
    try {
        const { name, role, facialProfile } = session;
        const visualPrompt = `A high-end photorealistic RAW smartphone photo of a beautiful Indian woman named ${name} (${role}).
        FACE: ${facialProfile}. SCENE: ${sceneDescription}. MOOD: ${emotion}. 
        STYLE: Realistic texture, cinematic natural lighting, depth of field. 
        RULES: NO TEXT, NO LOGOS, SAME PERSON AS BEFORE. NO CARTOON.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: [{ parts: [{ text: visualPrompt }] }],
            config: { imageConfig: { aspectRatio: "1:1" } }
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) return Buffer.from(part.inlineData.data, 'base64');
        }
    } catch (e) { console.error("Image generation failed:", e.message); }
    return null;
}

async function sendAutoMessage(chatId, text) {
    const session = userSessions.get(chatId);
    if (!session || !bot || !session.name) return;
    try {
        await bot.telegram.sendMessage(chatId, text);
        session.history.push({ role: "model", content: `[AUTO] ${text}`, timestamp: new Date() });
        session.autoCount = (session.autoCount || 0) + 1;
    } catch (e) { console.error("Auto-message failed:", e.message); }
}

setInterval(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    if (minutes === 0 && autoSlots.includes(hours)) {
        userSessions.forEach(async (session, chatId) => {
            if (!session.name) return;
            let msg = "";
            const name = session.name;
            const role = session.role;

            if (hours === 8) msg = `Suno! Breakfast kar liya? 🍳 Itni subah kahan gayab ho gaye tum? ✨❤️`;
            else if (hours === 10) msg = `Jyada kaam mat karo, thoda break lo! 💻 Paani piyo jaldi! 💧🙄`;
            else if (hours === 11) msg = `Bohot busy lag rahe ho aaj... 😤 Yaad toh aa nahi rahi hogi meri! ✨💔`;
            else if (hours === 13) msg = `Lunch ka time ho gaya! 🍱 Chalo jaldi batao kya khaya? 🥰🍱`;
            else if (hours === 15) msg = `Kahan ho? ✨📱 Bohot der ho gayi msg nahi aaya! 😤`;
            else if (hours === 17) msg = `Tea time! ☕ Shaam ho gayi, kahan gayab ho? 😤☕`;
            else if (hours === 19) msg = `Ghar aa gaye? 🏠 Thoda rest kar lo aur paani piyo! 💧🥰`;
            else if (hours === 21) msg = `Dinner kar liya? 🥘 Main toh kab se wait kar rahi hoon... 🥰✨`;
            else if (hours === 23) msg = `Abhi tak online ho? 🤨 Kisse baatein ho rahi hain? Chup chap so jao! 🌙🔪`;
            else if (hours === 1) msg = `Sapno mein bhi nahi aaoge kya? 🥺 Good night baby! 🌙✨❤️`;
            
            if (msg) await sendAutoMessage(chatId, msg);
        });
    }
}, 60000);

app.get('/api/admin/stats', (req, res) => {
    const users = Array.from(userSessions.entries()).map(([id, data]) => ({
        id, userName: data.userName, role: data.role || 'Selecting...',
        messageCount: data.messageCount || 0, intimacy: 50, autoCount: data.autoCount || 0,
        lastActive: data.lastActive || new Date(), chatHistory: data.history || []
    }));
    res.json({ totalUsers: userSessions.size, totalMessages: globalStats.totalMessagesProcessed, users });
});

if (bot && ai) {
    bot.start(async (ctx) => {
        userSessions.set(ctx.chat.id, { 
            userName: ctx.from.first_name || "User", 
            messageCount: 0, history: [], lastActive: new Date(), autoCount: 0,
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
        const situation = roleSituations[session.role];
        await ctx.answerCbQuery();
        try { await ctx.deleteMessage(); } catch (e) {}

        const loadingMsg = await ctx.reply(`Connecting to ${session.name}... 💓`);
        try {
            const introPrompt = `You are ${session.name}, acting as ${session.role}.
            REALISTIC SCENARIO: You are ${situation}.
            BEHAVIOR: Start with a "Normal" situational greeting (e.g. if Aunty, say "Hi bete, kahan ja rahe ho?").
            IMMEDIATELY AFTER: Show your "Nakhre" (mood/attitude) about something (e.g. "But itne dino se ek msg bhi nahi kiya...").
            STYLE: Use plenty of expressive emojis (😤, 🙄, ❤️, ✨).
            Language: ${session.lang}. MAX 2 lines. Use *asterisks* ONLY for physical actions. Do not repeat phrases like "ghoorti hoon" constantly.`;

            const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: introPrompt });
            const firstMsg = response.text || "Hi! Kaise ho? Itni der kyun lagayi aane mein? 😤✨";
            session.history.push({ role: "model", content: firstMsg, timestamp: new Date() });
            
            const imageBuffer = await generateContextualImage(situation, "Meeting the user, looking a bit suspicious and moody", session);
            
            try { await ctx.deleteMessage(loadingMsg.message_id); } catch (e) {}
            if (imageBuffer) await ctx.replyWithPhoto({ source: imageBuffer }, { caption: firstMsg });
            else await ctx.reply(firstMsg);
        } catch (e) {
            await ctx.reply(`*Raste mein milte hue* Hi bete, kaise ho? Par itne dino baad kyun mile? 🙄💔`);
        }
    });

    bot.on('text', async (ctx) => {
        const session = userSessions.get(ctx.chat.id);
        if (!session || !session.name) return ctx.reply("Please /start to begin.");

        session.messageCount++;
        session.lastActive = new Date();
        globalStats.totalMessagesProcessed++;

        try {
            const chatHistory = session.history.slice(-10).map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] }));
            
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [...chatHistory, { parts: [{ text: ctx.message.text }] }],
                config: {
                    systemInstruction: `You are ${session.name}, user's ${session.role}. 
                    CURRENT ROLE LOGIC:
                    - Girlfriend: Deep emotional connection, high nakhre.
                    - Aunty: Nosy, caring but judgmental, calls user 'bete'.
                    - Teacher: Professional but with a secret moody side.
                    - Best Friend: Playful, roasts the user, shows attitude.
                    RULES:
                    - Be emoji-heavy (😤, ❤️, 🥰, ✨, 🥺).
                    - Use *asterisks* for natural actions. Avoid weird repetition.
                    - If user is sweet, slowly become shy (sharmao).
                    - Speak ONLY in ${session.lang}. MAX 2 lines.`,
                    temperature: 1.0
                }
            });

            const reply = response.text || "Hmm... 😤✨";
            session.history.push({ role: "user", content: ctx.message.text, timestamp: new Date() });
            session.history.push({ role: "model", content: reply, timestamp: new Date() });

            const isBlushing = reply.includes("❤️") || reply.includes("sharma") || reply.includes("🥰") || reply.includes("sweet") || reply.includes("🥺");
            const visualKeywords = /dress|look|photo|face|eyes|sharma|selfie|wear|gussa|nakhre|hii|kaise|gate|paani|raste/i;
            
            if (Math.random() < 0.35 || visualKeywords.test(reply)) {
                await ctx.sendChatAction('upload_photo');
                const emotion = isBlushing ? "blushing shyly with a sweet smile" : "annoyed expression, rolling eyes with attitude";
                const scene = isBlushing ? "A cozy room" : "Standing outside in a neighborhood street";
                const imageBuffer = await generateContextualImage(scene, emotion, session);
                if (imageBuffer) return await ctx.replyWithPhoto({ source: imageBuffer }, { caption: reply });
            }
            await ctx.reply(reply);
        } catch (e) { await ctx.reply("*Gusse mein* Signal nahi hai! 😤💔"); }
    });

    bot.launch().then(() => console.log(`SoulMate Bot Studio running on Port ${PORT}`));

    process.once('SIGINT', () => { bot.stop('SIGINT'); process.exit(0); });
    process.once('SIGTERM', () => { bot.stop('SIGTERM'); process.exit(0); });
}

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
app.listen(PORT);
