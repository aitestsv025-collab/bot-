
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

const facialProfiles = [
    "Fair skin, sharp nose, hazel eyes, long silky straight black hair, wearing a small bindi",
    "Wheatish complexion, round face, large expressive brown eyes, shoulder-length wavy hair",
    "Oval face, high cheekbones, dark eyes, thick jet black hair tied back",
    "Petite face, dimpled smile, spectacles, soft curls, light brown eyes"
];

const ai = (BOT_TOKEN && GEMINI_KEY) ? new GoogleGenAI({ apiKey: GEMINI_KEY }) : null;
const bot = BOT_TOKEN ? new Telegraf(BOT_TOKEN) : null;

async function generateContextualImage(sceneDescription, emotion, session) {
    if (!ai) return null;
    try {
        const { name, role, facialProfile } = session;
        const visualPrompt = `A high-end photorealistic RAW smartphone photo of an Indian woman named ${name} (${role}).
        FACE FEATURES: ${facialProfile}.
        SCENE: ${sceneDescription}.
        EMOTION: ${emotion}.
        STYLE: Realistic texture, cinematic natural lighting, depth of field, 8k resolution.
        STRICT RULES: 
        1. NO TEXT, NO LOGOS, NO WATERMARKS IN THE IMAGE.
        2. NO CARTOON, NO ANIME, NO CGI.
        3. MUST BE THE EXACT SAME PERSON IN EVERY PHOTO.`;
        
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
        return ctx.reply(`Ab apni pasand ki language chunein: ✨`, 
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

        const loadingMsg = await ctx.reply(`Setting the scene for ${session.name}... 💓`);
        try {
            const introPrompt = `You are ${session.name}, user's ${session.role}. 
            SITUATION: You are meeting the user in a normal setting (e.g., Aunty at the gate, Teacher in the hallway, Girlfriend at home).
            BEHAVIOR: Start with a "Normal" friendly greeting like "Hi, kaise ho?" or "Hi bete, kya haal hai?".
            BUT IMMEDIATELY transition to 'Nakhre' or 'Gussa' (e.g., "But itne dino se kahan gayab the?").
            RULES: 
            1. Respond in ${session.lang} script.
            2. Use *asterisks* for the scene (e.g., *Gate par khadi hokar puchte hue*).
            3. MAX 2 lines.`;

            const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: introPrompt });
            const firstMsg = response.text || "Hi, kaise ho? Par itni der kyun kardi? 😤";
            session.history.push({ role: "model", content: firstMsg, timestamp: new Date() });
            
            const imageBuffer = await generateContextualImage("Standing at the entrance of a house or gate", "Smiling normally but with suspicious eyes", session);
            
            try { await ctx.deleteMessage(loadingMsg.message_id); } catch (e) {}
            if (imageBuffer) await ctx.replyWithPhoto({ source: imageBuffer }, { caption: firstMsg });
            else await ctx.reply(firstMsg);
        } catch (e) {
            await ctx.reply(`*Darwaze par khadi hokar* Hi bete, kaise ho? Itne dino baad meri yaad aayi? 🙄`);
        }
    });

    bot.on('text', async (ctx) => {
        const session = userSessions.get(ctx.chat.id);
        if (!session || !session.name) return ctx.reply("Please use /start to begin.");

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
                    INTELLECT: If the user is being nice, stay stubborn (Nakhre) for at least 5 turns. If user is rude, be very angry.
                    PERSONALITY ARC:
                    - Normal Start -> Moody/Angry -> Stubborn -> Slowly Melting -> Shyness.
                    MANDATORY: 
                    1. Use *asterisks* for every action (e.g., *muh ferte hue*).
                    2. MAX 2 lines. Speak ONLY in ${session.lang}.
                    3. Keep face and vibe consistent with previous messages.`,
                    temperature: 0.9
                }
            });

            const reply = response.text || "Hmm... 😤";
            session.history.push({ role: "user", content: ctx.message.text, timestamp: new Date() });
            session.history.push({ role: "model", content: reply, timestamp: new Date() });

            const isHappy = reply.includes("❤️") || reply.includes("sharma") || reply.includes("🥰") || reply.includes("sweet");
            const visualKeywords = /dress|look|photo|face|eyes|sharma|selfie|wear|gussa|nakhre|hii|kaise|gate/i;
            
            if (Math.random() < 0.35 || visualKeywords.test(reply)) {
                await ctx.sendChatAction('upload_photo');
                const emotion = isHappy ? "blushing, shy smile" : "annoyed expression, looking away with attitude";
                const scene = isHappy ? "Cozy living room" : "Standing near a door or window";
                const imageBuffer = await generateContextualImage(scene, emotion, session);
                if (imageBuffer) return await ctx.replyWithPhoto({ source: imageBuffer }, { caption: reply });
            }
            await ctx.reply(reply);
        } catch (e) { 
            await ctx.reply("*Chiddte hue* Network error! 😤");
        }
    });

    // Graceful Shutdown to prevent 409 Conflict error on Render/Heroku
    bot.launch().then(() => console.log(`SoulMate Bot Studio running on Port ${PORT}`));

    process.once('SIGINT', () => {
        bot.stop('SIGINT');
        process.exit(0);
    });
    process.once('SIGTERM', () => {
        bot.stop('SIGTERM');
        process.exit(0);
    });
}

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
app.listen(PORT);
