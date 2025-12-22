
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
    young: ["a simple white crop top and blue denim jeans", "a floral pink summer dress", "a casual yellow oversized t-shirt", "a trendy black tank top"],
    mature: ["a sophisticated maroon cotton saree", "a black and gold designer salwar suit", "an elegant silk blue saree", "a formal white shirt and black trousers"]
};

const ai = (BOT_TOKEN && GEMINI_KEY) ? new GoogleGenAI({ apiKey: GEMINI_KEY }) : null;
const bot = BOT_TOKEN ? new Telegraf(BOT_TOKEN) : null;

async function generateContextualImage(sceneDescription, emotion, session) {
    if (!ai) return null;
    try {
        const { name, role, facialProfile, fixedClothing } = session;
        const age = ageMapping[role] || 25;

        // The prompt strictly enforces the SAME face and SAME clothing, only changing expression and location.
        const visualPrompt = `A ultra-realistic high-end RAW smartphone selfie of a ${age}-year-old Indian woman named ${name}.
        IDENTITY: She is the user's ${role}. 
        STRICT FACE CONSISTENCY: ${facialProfile}. 
        STRICT CLOTHING CONSISTENCY: She MUST be wearing ${fixedClothing}.
        DYNAMIC CONTEXT: Location is ${sceneDescription}. Her facial expression is ${emotion}.
        TECHNICAL: Realistic skin texture, natural soft lighting, 8k resolution, photorealistic, iPhone 15 Pro quality.
        RULES: NO TEXT, NO LOGOS, NO CARTOON, NO CLOTHING CHANGES.`;
        
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

app.get('/api/admin/stats', (req, res) => {
    const users = Array.from(userSessions.entries()).map(([id, data]) => ({
        id, userName: data.userName, role: data.role || 'Selecting...',
        messageCount: data.messageCount || 0, intimacy: data.intimacy,
        lastActive: data.lastActive || new Date(), chatHistory: data.history || []
    }));
    res.json({ totalUsers: userSessions.size, totalMessages: globalStats.totalMessagesProcessed, users });
});

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
                [Markup.button.callback('❤️ Girlfriend (18)', 'role_Girlfriend'), Markup.button.callback('🤝 Bestie (18)', 'role_BestFriend')],
                [Markup.button.callback('👩‍🏫 Teacher (35)', 'role_Teacher'), Markup.button.callback('💃 Spicy Aunty (35)', 'role_Aunty')],
                [Markup.button.callback('🏠 Step Mom (35)', 'role_StepMom'), Markup.button.callback('👧 Step Sister (18)', 'role_StepSister')]
            ])
        );
    });

    bot.action(/role_(.+)/, async (ctx) => {
        const session = userSessions.get(ctx.chat.id);
        if (!session) return ctx.reply("Please /start again.");
        session.role = ctx.match[1];
        
        // Fix clothing for the ENTIRE session
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

        const welcomeMsgs = {
            'Girlfriend': "Hii baby... tum aa gaye? ❤️ Bahut yaad aa rahi thi tumhari.",
            'BestFriend': "Aur bata yaar! Kya scene hai? Aaj bada free hai tu? 🙄☕",
            'Teacher': "Namaste. Syllabus toh tumne dekha nahi hoga, chalo thodi padhai karein? 👩‍🏫",
            'Aunty': "Beta, kitchen mein thoda haath bataoge? Ghar pe akeli boring ho rahi hoon. 😊🥘",
            'StepMom': "Aa gaye tum? Chalo haath-muh dho lo, maine tumhara favorite khana banaya hai. 🏠🥘",
            'StepSister': "Bhaiya! Mera project poora kar doge na? Please... 🥺✨"
        };

        const reply = welcomeMsgs[session.role];
        session.history.push({ role: "model", content: reply, timestamp: new Date() });
        
        await ctx.sendChatAction('upload_photo');
        const img = await generateContextualImage("the living room", "warm welcoming smile", session);
        if (img) {
            await ctx.replyWithPhoto({ source: img }, { caption: reply });
        } else {
            await ctx.reply(reply);
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
            
            const systemPrompt = `
            You are ${session.name}, aged ${ageMapping[session.role]}, role: ${session.role}. 
            
            STRICT RULES:
            1. BESTIE: NEVER call him 'Baby' or 'Jaan'. Use 'Yaar', 'Abe', 'Kamine'.
            2. MOOD: Based on the chat, determine your MOOD and LOCATION for the photo.
            3. EMOJIS: Use emojis in EVERY reply.
            4. FORMAT: Output MUST be in this format:
               [MOOD: <one word mood> | LOCATION: <one word location>]
               <Your actual reply text in ${session.lang}>
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [...chatHistory, { parts: [{ text: ctx.message.text }] }],
                config: { systemInstruction: systemPrompt, temperature: 0.9 }
            });

            const fullText = response.text || "Hmm... 😊";
            
            // Extract visual metadata from response
            const moodMatch = fullText.match(/\[MOOD: (.*?) \| LOCATION: (.*?)\]/);
            const emotion = moodMatch ? moodMatch[1] : "smiling";
            const location = moodMatch ? moodMatch[2] : "bedroom";
            const reply = fullText.replace(/\[MOOD:.*?\]/, "").trim();

            session.history.push({ role: "user", content: ctx.message.text, timestamp: new Date() });
            session.history.push({ role: "model", content: reply, timestamp: new Date() });

            await ctx.sendChatAction('upload_photo');
            const imgBuffer = await generateContextualImage(location, emotion, session);
            
            if (imgBuffer) {
                await ctx.replyWithPhoto({ source: imgBuffer }, { caption: reply });
            } else {
                await ctx.reply(reply);
            }

        } catch (e) { 
            console.error(e);
            await ctx.reply("Network problem baby... 😤"); 
        }
    });

    bot.launch().then(() => console.log(`Realistic Consistent Bot Engine Online`));
}

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
app.listen(PORT);
