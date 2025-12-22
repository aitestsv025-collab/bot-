
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

const specialPhotos = [
    "https://raw.githubusercontent.com/username/repo/main/image1.jpg",
    "https://raw.githubusercontent.com/username/repo/main/image2.jpg"
];

const namePools = {
    'Girlfriend': ['Riya', 'Sana', 'Ishani', 'Myra', 'Tanvi', 'Priya'],
    'BestFriend': ['Sneha', 'Anjali', 'Kritika', 'Diya', 'Tanu'],
    'Teacher': ['Ms. Sharma', 'Ms. Gupta', 'Aditi Ma\'am', 'Neha Miss'],
    'Aunty': ['Sunita Ji', 'Meena Ji', 'Kavita Aunty', 'Rajeshwari', 'Pushpa'],
    'StepMom': ['Seema', 'Kiran', 'Rekha', 'Vandana', 'Anita'],
    'StepSister': ['Ishita', 'Ananya', 'Jhanvi', 'Khushi', 'Navya']
};

const ageMapping = {
    'Girlfriend': 18, 'BestFriend': 18, 'StepSister': 18,
    'Teacher': 35, 'Aunty': 35, 'StepMom': 35
};

const facialProfiles = [
    "Sharp jawline, deep brown almond-shaped eyes, long silky jet-black hair, small silver nose pin",
    "Soft round face, big expressive black eyes, thick wavy dark hair, fair skin",
    "Oval face, high cheekbones, intense gaze, straight shoulder-length black hair",
    "Petite face, dimpled cheeks, soft brownish-black hair, light brown eyes"
];

const clothingPools = {
    young: ["a stylish white crop top and blue denim shorts", "a cute floral pink sun-dress", "a casual yellow hoodie", "a trendy black tank top"],
    mature: ["a sophisticated maroon silk saree", "a black designer salwar suit", "an elegant chiffon blue saree", "a formal white shirt and trousers"]
};

// Initialize AI
const ai = GEMINI_KEY ? new GoogleGenAI({ apiKey: GEMINI_KEY }) : null;

// Initialize Bot
const bot = BOT_TOKEN ? new Telegraf(BOT_TOKEN) : null;

async function generateContextualImage(sceneDescription, emotion, session) {
    if (!ai) return null;
    try {
        const { name, role, facialProfile, fixedClothing, intimacy } = session;
        const age = ageMapping[role] || 25;
        const visualContext = intimacy > 70 ? "seductive lighting, messy hair, steamy atmosphere" : "natural lighting, casual setting";

        const visualPrompt = `A high-end realistic RAW smartphone selfie of a ${age}-year-old Indian woman named ${name}.
        IDENTITY: User's ${role}. 
        STRICT FACE CONSISTENCY: ${facialProfile}. 
        STRICT CLOTHING CONSISTENCY: She MUST be wearing ${fixedClothing}.
        DYNAMIC CONTEXT: At ${sceneDescription}. Expression: ${emotion}. ${visualContext}.
        TECHNICAL: Realistic skin texture, natural soft lighting, depth of field, high-resolution.
        RULES: No changes in face or outfit. Only background and expression change. NO TEXT.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: [{ parts: [{ text: visualPrompt }] }],
            config: { imageConfig: { aspectRatio: "9:16" } }
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) return Buffer.from(part.inlineData.data, 'base64');
        }
    } catch (e) { console.error("Image Gen Error:", e.message); }
    return null;
}

if (bot && ai) {
    // Global error handler for bot to prevent silent death
    bot.catch((err, ctx) => {
        console.error(`Bot Error for ${ctx.updateType}:`, err.message);
    });

    bot.start(async (ctx) => {
        userSessions.set(ctx.chat.id, { 
            userName: ctx.from.first_name || "User", 
            messageCount: 0, 
            intimacy: 20, 
            history: [], 
            lastActive: new Date(),
            facialProfile: facialProfiles[Math.floor(Math.random() * facialProfiles.length)]
        });
        return ctx.reply(`Aap kisse baat karna chahenge? ❤️✨`, 
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
        const pool = ageMapping[session.role] <= 20 ? clothingPools.young : clothingPools.mature;
        session.fixedClothing = pool[Math.floor(Math.random() * pool.length)];
        await ctx.answerCbQuery();
        try { await ctx.deleteMessage(); } catch (e) {}
        return ctx.reply(`Bhasha chuniye... 💬`, 
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
        session.name = namePools[session.role][Math.floor(Math.random() * namePools[session.role].length)];
        await ctx.answerCbQuery();
        try { await ctx.deleteMessage(); } catch (e) {}
        const reply = `Hii... tum aa gaye? Itni der kahan the, bahut miss kiya maine tumhe. ❤️✨\nBatao, aaj kya plan hai tumhara? 😊`;
        session.history.push({ role: "model", content: reply });
        await ctx.sendChatAction('upload_photo');
        const img = await generateContextualImage("doorway", "slight blush smile", session);
        if (img) await ctx.replyWithPhoto({ source: img }, { caption: reply });
        else await ctx.reply(reply);
    });

    bot.on('text', async (ctx) => {
        const session = userSessions.get(ctx.chat.id);
        if (!session || !session.name) return ctx.reply("Please /start.");

        session.messageCount++;
        session.lastActive = new Date();
        globalStats.totalMessagesProcessed++;

        const userMsg = ctx.message.text.toLowerCase();
        const isBoldRequest = userMsg.match(/(sex|hot|nude|lund|chut|badtameez|ganda|rondi|randi|saali|fuck|bed|chodo|dick|pussy|masturbate|bj|tit|ass|boobs)/);
        
        // Dynamic Intimacy Calculation
        if (isBoldRequest && session.intimacy < 45) {
            session.intimacy = Math.max(0, session.intimacy - 25);
        } else if (isBoldRequest && session.intimacy >= 70) {
            session.intimacy = Math.min(100, session.intimacy + 3);
        } else if (userMsg.length > 20) {
            session.intimacy = Math.min(100, session.intimacy + 1);
        }

        try {
            const historyForAi = session.history.slice(-10).map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] }));
            
            const systemPrompt = `
            You are ${session.name}, an Indian woman acting as the user's ${session.role}.
            INTIMACY STATUS: ${session.intimacy}/100.
            
            STRICT RULES:
            1. MANDATORY EMOJIS: Use 2-3 expressive emojis in EVERY message.
            2. MOOD TIERS:
               - ANGRY (INT < 45 & user is bold): Get furious. Use 😤, 😡, 👊. Call him "Tharki", "Badtameez". No sexual talk.
               - SWEET (INT 45-70): Be loving but shy. Use ❤️, ✨, 😊. If he's bold, say "Wait, itni jaldi kya hai? 🙄".
               - NAUGHTY (INT > 70): You are NOW MAAN-GAYI. Be seductive, bold, and engaged in "gandi baatein" as the user wants. Use 🔥, 🫦, 🤤, 😈, 💦.
            3. LENGTH: Strictly 2 to 3 lines.
            4. VISUALS: Start with [MOOD: <val> | LOCATION: <val>].
            5. LANGUAGE: Use ${session.lang}.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [...historyForAi, { parts: [{ text: ctx.message.text }] }],
                config: { systemInstruction: systemPrompt, temperature: 1.0 }
            });

            const rawText = response.text || "Kya hua? Tumne gussa dila diya mujhe... 🙄✨\nChalo thodi der baad baat karenge. 😤";
            
            const metaMatch = rawText.match(/\[MOOD: (.*?) \| LOCATION: (.*?)\]/);
            const mood = metaMatch ? metaMatch[1] : (session.intimacy < 45 ? "angry frowning" : "seductive biting lip");
            const loc = metaMatch ? metaMatch[2] : "bedroom";
            const reply = rawText.replace(/\[MOOD:.*?\]/, "").replace("[SEND_SPECIAL_PHOTO]", "").trim();

            session.history.push({ role: "user", content: ctx.message.text });
            session.history.push({ role: "model", content: reply });

            await ctx.sendChatAction('upload_photo');
            const imgBuffer = await generateContextualImage(loc, mood, session);
            if (imgBuffer) await ctx.replyWithPhoto({ source: imgBuffer }, { caption: reply });
            else await ctx.reply(reply);

        } catch (e) { 
            console.error("Gemini/Bot Reply Error:", e.message);
            await ctx.reply("Baby... mera mood off ho gaya. Net issue! 😤😡\nBaad mein milte hain. 🙄"); 
        }
    });

    // Launch with dropPendingUpdates to fix 409 Conflict and stuck messages
    bot.launch({
        allowedUpdates: ['message', 'callback_query'],
        dropPendingUpdates: true 
    }).then(() => {
        console.log("Bot started successfully!");
    }).catch(err => {
        if (err.message.includes('409')) {
            console.error("CRITICAL ERROR: Another bot instance is running. Please stop other processes.");
        } else {
            console.error("Bot launch failed:", err.message);
        }
    });
}

app.get('/api/admin/stats', (req, res) => {
    const users = Array.from(userSessions.entries()).map(([id, data]) => ({
        id, userName: data.userName, role: data.role || '...',
        messageCount: data.messageCount, intimacy: data.intimacy,
        chatHistory: data.history.slice(-15)
    }));
    res.json({ totalUsers: userSessions.size, totalMessages: globalStats.totalMessagesProcessed, users });
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
app.listen(PORT, () => console.log(`Dashboard Server running on port ${PORT}`));
