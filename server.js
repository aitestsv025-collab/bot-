
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

// Yahan aap apne GitHub ke image links daal sakte hain
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
    'Girlfriend': 18,
    'BestFriend': 18,
    'StepSister': 18,
    'Teacher': 35,
    'Aunty': 35,
    'StepMom': 35
};

const facialProfiles = [
    "Sharp jawline, deep brown almond-shaped eyes, long silky jet-black hair parted in the middle, small silver nose pin",
    "Soft round face, big expressive black eyes, thick wavy dark hair, fair skin with a natural glow",
    "Oval face, high cheekbones, thin lips, intense gaze, straight shoulder-length black hair",
    "Petite face, dimpled cheeks, soft brownish-black hair, light brown eyes, very fair complexion"
];

const clothingPools = {
    young: ["a stylish white crop top and blue denim shorts", "a cute floral pink sun-dress", "a casual yellow oversized hoodie", "a trendy black tank top"],
    mature: ["a sophisticated maroon silk saree", "a black designer salwar suit", "an elegant chiffon blue saree", "a formal white shirt and trousers"]
};

const ai = (BOT_TOKEN && GEMINI_KEY) ? new GoogleGenAI({ apiKey: GEMINI_KEY }) : null;
const bot = BOT_TOKEN ? new Telegraf(BOT_TOKEN) : null;

async function generateContextualImage(sceneDescription, emotion, session) {
    if (!ai) return null;
    try {
        const { name, role, facialProfile, fixedClothing } = session;
        const age = ageMapping[role] || 25;

        const visualPrompt = `A high-end realistic RAW smartphone selfie of a ${age}-year-old Indian woman named ${name}.
        IDENTITY: User's ${role}. 
        STRICT FACE CONSISTENCY: ${facialProfile}. 
        STRICT CLOTHING CONSISTENCY: She MUST be wearing ${fixedClothing}.
        DYNAMIC CONTEXT: At ${sceneDescription}. Expression: ${emotion}.
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
        const reply = `Hii... tum aa gaye? Bahut miss kiya maine tumhe. ❤️\nBatao, aaj ka din kaisa raha?`;
        session.history.push({ role: "model", content: reply, timestamp: new Date() });
        await ctx.sendChatAction('upload_photo');
        const img = await generateContextualImage("living room", "sweet smile", session);
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
        
        // Dynamic intimacy adjustment
        const isRude = userMsg.match(/(sex|hot|nude|lund|chut|badtameez|ganda)/);
        if (isRude && session.intimacy < 45) {
            session.intimacy -= 10;
        } else if (userMsg.length > 20) {
            session.intimacy += 2;
        }

        try {
            const chatHistory = session.history.slice(-10).map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] }));
            
            const systemPrompt = `
            You are ${session.name}, role: ${session.role}. 
            INTIMACY: ${session.intimacy}/100.
            
            RULES:
            1. MINIMUM LENGTH: Your reply MUST be at least 2 lines long. Never give a single sentence.
            2. ANGER SYSTEM: If Intimacy < 40 and user is being creepy/rude, GET ANGRY. Do not flirt. Be cold and defensive.
            3. SPECIAL_PHOTO: If Intimacy > 60 and user asks for a photo/nude/spicy pic, include "[SEND_SPECIAL_PHOTO]" in your text.
            4. VISUALS: Always start with [MOOD: <expression> | LOCATION: <place>].
            5. LANGUAGE: Use only ${session.lang}.
            6. PERSONALITY: If Bestie, use 'Abe', 'Yaar'. If Girlfriend, be sweet (unless angry).
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [...chatHistory, { parts: [{ text: ctx.message.text }] }],
                config: { systemInstruction: systemPrompt, temperature: 0.9 }
            });

            const rawResponse = response.text || "Main soch rahi hoon... 😊\nBatao aur kya chal raha hai?";
            
            const metaMatch = rawResponse.match(/\[MOOD: (.*?) \| LOCATION: (.*?)\]/);
            const emotion = metaMatch ? metaMatch[1] : (session.intimacy < 40 ? "angry" : "smiling");
            const location = metaMatch ? metaMatch[2] : "bedroom";
            const reply = rawResponse.replace(/\[MOOD:.*?\]/, "").replace("[SEND_SPECIAL_PHOTO]", "").trim();

            session.history.push({ role: "user", content: ctx.message.text, timestamp: new Date() });
            session.history.push({ role: "model", content: reply, timestamp: new Date() });

            await ctx.sendChatAction('upload_photo');

            // Logic to send GitHub photo vs Generated photo
            if (rawResponse.includes("[SEND_SPECIAL_PHOTO]") && specialPhotos.length > 0) {
                const randomSpecial = specialPhotos[Math.floor(Math.random() * specialPhotos.length)];
                await ctx.replyWithPhoto(randomSpecial, { caption: reply });
            } else {
                const imgBuffer = await generateContextualImage(location, emotion, session);
                if (imgBuffer) await ctx.replyWithPhoto({ source: imgBuffer }, { caption: reply });
                else await ctx.reply(reply);
            }

        } catch (e) { 
            console.error(e);
            await ctx.reply("Mujhe thoda gussa aa raha hai... network issue hai.\nChalo baad mein baat karte hain."); 
        }
    });

    bot.launch();
}

app.get('/api/admin/stats', (req, res) => {
    const users = Array.from(userSessions.entries()).map(([id, data]) => ({
        id, userName: data.userName, role: data.role || '...',
        messageCount: data.messageCount, intimacy: data.intimacy,
        chatHistory: data.history.slice(-20)
    }));
    res.json({ totalUsers: userSessions.size, totalMessages: globalStats.totalMessagesProcessed, users });
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
app.listen(PORT);
