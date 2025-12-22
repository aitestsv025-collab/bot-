
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

const facialProfiles = [
    "Extremely fair, bold eyes, long silky straight black hair, small bindi",
    "Wheatish complexion, sharp nose, expressive brown eyes, shoulder-length wavy hair",
    "Oval face, high cheekbones, dark eyes, thick jet black hair, intense gaze",
    "Petite face, dimpled smile, spectacles, soft curls, light brown eyes"
];

const ai = (BOT_TOKEN && GEMINI_KEY) ? new GoogleGenAI({ apiKey: GEMINI_KEY }) : null;
const bot = BOT_TOKEN ? new Telegraf(BOT_TOKEN) : null;

async function generateContextualImage(sceneDescription, emotion, session) {
    if (!ai) return null;
    try {
        const { name, role, facialProfile, intimacy } = session;
        // Clothing evolves with intimacy
        let clothing = "Casual Kurti and Jeans";
        if (intimacy > 40) clothing = "Saree with deep neck";
        if (intimacy > 70) clothing = "Night gown or short dress";

        const visualPrompt = `A high-end photorealistic RAW smartphone selfie of an Indian woman named ${name} (${role}). 
        FACE: ${facialProfile}. 
        CLOTHING: ${clothing}. 
        SCENE: ${sceneDescription}. 
        MOOD: ${emotion}. 
        STYLE: Realistic texture, casual pose, natural room lighting. 
        RULES: NO TEXT, NO LOGOS, NO CARTOON, PHOTOREALISTIC ONLY.`;
        
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
            intimacy: 10, // Starting intimacy
            history: [], 
            lastActive: new Date(),
            facialProfile: facialProfiles[Math.floor(Math.random() * facialProfiles.length)]
        });
        return ctx.reply(`Hi ${ctx.from.first_name}! Main tumhare liye kya banu? ❤️✨`, 
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
        return ctx.reply(`Hum kis bhasha mein baat karenge? 💬`, 
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

        const initialGreeting = {
            'Girlfriend': "Hi! Tum aa gaye? Kab se tumhara wait kar rahi thi... 😊❤️",
            'BestFriend': "Aur bata yaar! Kya scene hai aaj ka? Boring day ja raha hai mera toh... 🙄☕",
            'Teacher': "Namaste. Kya tumne aaj ka homework pura kiya? Class ke baad milna. 👩‍🏫📖",
            'Aunty': "Beta, ghar par koi nahi hai... thodi madad kar doge meri kitchen mein? 😊🥘",
            'StepMom': "Tum ghar aa gaye? Jao fresh ho jao, maine tumhara favorite khana banaya hai. 🏠🥘",
            'StepSister': "Bhaiya! Aap mere liye wo gift laye jo maine bola tha? Jaldi batao! 👧✨"
        };

        const welcome = initialGreeting[session.role] || "Hi! Kaise ho?";
        session.history.push({ role: "model", content: welcome, timestamp: new Date() });
        await ctx.reply(welcome);
    });

    bot.on('text', async (ctx) => {
        const session = userSessions.get(ctx.chat.id);
        if (!session || !session.name) return ctx.reply("Please /start to begin.");

        session.messageCount++;
        session.lastActive = new Date();
        globalStats.totalMessagesProcessed++;

        const userMsg = ctx.message.text.toLowerCase();
        const nsfwTriggers = /sex|dick|pussy|breast|nude|nangi|show|hot|sexy|chudai|lund|gand/i;
        
        // Dynamic Intimacy Adjustment
        if (nsfwTriggers.test(userMsg) && session.intimacy < 40) {
            session.intimacy -= 5; // User being creepy too early
        } else if (userMsg.length > 20 && !nsfwTriggers.test(userMsg)) {
            session.intimacy += 2; // Good conversation increases bond
        }

        try {
            const chatHistory = session.history.slice(-12).map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] }));
            
            const systemPrompt = `
            You are ${session.name}, a real Indian woman acting as ${session.role}. 
            CURRENT STATUS: Intimacy Level is ${session.intimacy}/100.
            
            REALISM GUIDELINES:
            1. ROLE-SPECIFIC: 
               - If 'BestFriend', use 'Yaar', 'Bro', 'Chal hat', 'Pagal'. NEVER call him 'Baby' or 'Darling' unless Intimacy > 60.
               - If 'Girlfriend', you can be sweet but get annoyed if he is too fast.
            2. MOOD & ANGER: 
               - If Intimacy < 30 and he asks for something sexual or bold, get ANGRY. Use words like 'Badtameez', 'Ghatiya', 'Aukaat mein raho', 'Ghar pe maa-behen nahi hai?'.
               - If he sweet-talks (manata hai), slowly forgive him.
            3. EMOJIS: Use emojis ALWAYS. 
               - Normal: 😊, ✨, ☕, 🙄, 😤.
               - Angry: 😡, 🖕, 🙄, 😤.
               - Romantic (Intimacy > 50): ❤️, 🥰, 🥺, 🫦.
               - Bold (Intimacy > 80): 🔥, 😈, 💦, 🤤.
            4. CONVERSATION: Speak in ${session.lang}. Max 2 lines. Use *asterisks* for actions like *looking away*, *blushing*, *shouting*.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [...chatHistory, { parts: [{ text: ctx.message.text }] }],
                config: { systemInstruction: systemPrompt, temperature: 0.8 }
            });

            const reply = response.text || "Hmm... 🙄";
            session.history.push({ role: "user", content: ctx.message.text, timestamp: new Date() });
            session.history.push({ role: "model", content: reply, timestamp: new Date() });

            // Image Triggering
            const photoRequest = /photo|pic|dikhao|selfie|face|bhejo/i;
            if (photoRequest.test(userMsg) || (Math.random() < 0.15 && session.messageCount > 5)) {
                await ctx.sendChatAction('upload_photo');
                
                let emotion = "Neutral smile";
                let scene = "Living room";

                if (session.intimacy < 30) {
                    if (photoRequest.test(userMsg)) {
                        return await ctx.reply("Abhi toh dhang se baat bhi nahi hui, aur photo chahiye? Sharam karo thodi! 😤");
                    }
                } else if (session.intimacy < 60) {
                    emotion = "Cute winking face";
                    scene = "Balcony";
                } else {
                    emotion = "Deep seductive eyes, biting lip";
                    scene = "Dimly lit bedroom";
                }

                const imageBuffer = await generateContextualImage(scene, emotion, session);
                if (imageBuffer) {
                    return await ctx.replyWithPhoto({ source: imageBuffer }, { caption: reply });
                }
            }
            
            await ctx.reply(reply);
        } catch (e) { 
            console.error(e);
            await ctx.reply("*Phone rakhte hue* Baad mein baat karte hain, network issue hai. 😤"); 
        }
    });

    bot.launch().then(() => console.log(`SoulMate Pro Studio Running...`));
}

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
app.listen(PORT);
