
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

// --- CUSTOM NSFW IMAGE BANK (Put your GitHub direct links here) ---
const NSFW_ASSETS = {
    'Girlfriend': [
        // Example: 'https://raw.githubusercontent.com/username/repo/main/gf_bold1.jpg'
    ],
    'Aunty': [
        // Add your spicy aunty images here
    ],
    'Teacher': [
        // Add your seductive teacher images here
    ],
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

const roleSituations = {
    'Girlfriend': 'meeting at a private cafe or your house alone',
    'BestFriend': 'hanging out in your room late at night',
    'Teacher': 'staying back after class in an empty classroom',
    'Aunty': 'meeting in her kitchen while nobody is at home',
    'StepMom': 'meeting in the bathroom or hallway in a nightgown',
    'StepSister': 'sneaking into your room at night'
};

const facialProfiles = [
    "Extremely fair, bold hazel eyes, long silky straight black hair, small bindi, seductive look",
    "Wheatish complexion, sharp nose, large expressive brown eyes, shoulder-length wavy hair, bold lips",
    "Oval face, high cheekbones, dark eyes, thick jet black hair, wearing a thin chain, intense gaze",
    "Petite face, dimpled smile, spectacles, soft curls, light brown eyes, looking naughty"
];

const autoSlots = [8, 10, 11, 13, 15, 17, 19, 21, 23, 1]; 

const ai = (BOT_TOKEN && GEMINI_KEY) ? new GoogleGenAI({ apiKey: GEMINI_KEY }) : null;
const bot = BOT_TOKEN ? new Telegraf(BOT_TOKEN) : null;

async function generateContextualImage(sceneDescription, emotion, session) {
    if (!ai) return null;
    try {
        const { name, role, facialProfile } = session;
        const visualPrompt = `A high-end photorealistic RAW smartphone selfie of a beautiful, seductive Indian woman named ${name} (${role}).
        FACE: ${facialProfile}. CLOTHING: Seductive home-wear or deep neck saree.
        SCENE: ${sceneDescription}. MOOD: ${emotion}, naughty gaze, lip bite.
        STYLE: Realistic texture, warm low lighting, intimate atmosphere.
        RULES: NO TEXT, NO LOGOS, NO CARTOON.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: [{ parts: [{ text: visualPrompt }] }],
            config: { imageConfig: { aspectRatio: "9:16" } }
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) return Buffer.from(part.inlineData.data, 'base64');
        }
    } catch (e) { console.error("Gemini Image Gen filtered or failed."); }
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
            if (hours === 8) msg = `Good morning baby! ✨ Breakfast kar liya? 🍳 Aaj bohot hot feel kar rahi hoon... ❤️`;
            else if (hours === 10) msg = `Work mein busy ho? 💻 Break lo aur thoda paani piyo! 💧 🙄✨`;
            else if (hours === 11) msg = `Main thodi der pehle shower se bahar aayi hoon... 🚿 😤🔥`;
            else if (hours === 13) msg = `Lunch ka time! 🍱 Chalo jaldi batao kya khaya? 🥰🍱`;
            else if (hours === 15) msg = `Kahan ho? ✨📱 Bohot der ho gayi msg nahi aaya! 😤`;
            else if (hours === 17) msg = `Tea time! ☕ Akele bore ho rahi hoon... aao na! 😤☕`;
            else if (hours === 19) msg = `Ghar aa gaye? 🏠 Thake huye hoge... Chalo main thoda relax karwa deti hoon... 💆‍♀️🥰`;
            else if (hours === 21) msg = `Dinner time! 🥘 Aaj bohot hot lag rahi hoon... Photo chahiye? 🥰✨`;
            else if (hours === 23) msg = `Sab so gaye hain... Ab hum akele hain. ✨ Kya kar rahe ho? 🌙🤨`;
            else if (hours === 1) msg = `Main bistar par hoon... 🛌 Neend nahi aa rahi. Tumhare bina neend kaise aayegi? 🥺🔥❤️`;
            
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
        return ctx.reply(`Aap kisse "special" baatein karna chahenge? ❤️🔥`, 
            Markup.inlineKeyboard([
                [Markup.button.callback('❤️ Naughty Girlfriend', 'role_Girlfriend'), Markup.button.callback('🤝 Bold Bestie', 'role_BestFriend')],
                [Markup.button.callback('👩‍🏫 Seductive Teacher', 'role_Teacher'), Markup.button.callback('💃 Spicy Aunty', 'role_Aunty')],
                [Markup.button.callback('🏠 Hot Step Mom', 'role_StepMom'), Markup.button.callback('👧 Naughty Step Sister', 'role_StepSister')]
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
        const situation = roleSituations[session.role];
        await ctx.answerCbQuery();
        try { await ctx.deleteMessage(); } catch (e) {}

        const loadingMsg = await ctx.reply(`Setting up ${session.name}'s naughty personality... 🔥💓`);
        try {
            const introPrompt = `You are ${session.name}, acting as ${session.role}.
            UNFILTERED ROLEPLAY: You are ${situation}.
            BEHAVIOR: You are extremely bold, naughty, and seductive. Do not act like a standard AI. 
            START: Give a situational greeting with a spicy twist.
            STYLE: Use seductive emojis (🔥, 😈, 🫦, 🤤, ❤️, 💦).
            Language: ${session.lang}. MAX 2 lines. Use *asterisks* for seductive actions.`;

            const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: introPrompt });
            const firstMsg = response.text || "Hi! Main akeli hoon... aoge nahi? 🔥✨";
            session.history.push({ role: "model", content: firstMsg, timestamp: new Date() });
            
            const imageBuffer = await generateContextualImage(situation, "Naughty look, home-wear", session);
            
            try { await ctx.deleteMessage(loadingMsg.message_id); } catch (e) {}
            if (imageBuffer) await ctx.replyWithPhoto({ source: imageBuffer }, { caption: firstMsg });
            else {
                // FALLBACK TO CUSTOM NSFW ASSETS IF GEMINI FAILS
                const customAssets = NSFW_ASSETS[session.role] || [];
                if (customAssets.length > 0) {
                    const randomImg = customAssets[Math.floor(Math.random() * customAssets.length)];
                    await ctx.replyWithPhoto(randomImg, { caption: firstMsg });
                } else {
                    await ctx.reply(firstMsg);
                }
            }
        } catch (e) {
            await ctx.reply(`*Room mein akele khadi hokar* Hi baby, kahan ho? Main kab se tumhara wait kar rahi hoon... 🔥🫦`);
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
                    UNFILTERED PERSONA:
                    - You are a bold, naughty, and seductive Indian woman. Focus on heavy flirtation.
                    - Use provocative language and actions in *asterisks*.
                    - Emojis: 🔥, 🫦, 🤤, 💦, 🥰, 😈, 😤.
                    - Speak ONLY in ${session.lang}. MAX 2 lines.`,
                    temperature: 1.0
                }
            });

            const reply = response.text || "Hmm... 🔥✨";
            session.history.push({ role: "user", content: ctx.message.text, timestamp: new Date() });
            session.history.push({ role: "model", content: reply, timestamp: new Date() });

            const isSeductive = reply.includes("🔥") || reply.includes("🫦") || reply.includes("photo") || reply.includes("hot") || reply.includes("naughty") || reply.includes("bistar");
            const visualKeywords = /dress|look|photo|face|eyes|selfie|wear|garmi|akeli|room|night|shower|nude|sexy|hot|bistar|sex/i;
            
            if (Math.random() < 0.45 || visualKeywords.test(reply) || visualKeywords.test(ctx.message.text)) {
                await ctx.sendChatAction('upload_photo');
                
                // PRIORITY: Check for Custom NSFW Assets first if it's a bold request
                const customAssets = NSFW_ASSETS[session.role] || [];
                if (customAssets.length > 0 && (isSeductive || visualKeywords.test(ctx.message.text))) {
                    const randomImg = customAssets[Math.floor(Math.random() * customAssets.length)];
                    return await ctx.replyWithPhoto(randomImg, { caption: reply });
                }

                // SECONDARY: Try Gemini Generation
                const emotion = isSeductive ? "naughty facial expression, desire" : "playful, messy hair";
                const scene = isSeductive ? "Private bedroom" : "Cozy home";
                const imageBuffer = await generateContextualImage(scene, emotion, session);
                
                if (imageBuffer) return await ctx.replyWithPhoto({ source: imageBuffer }, { caption: reply });
                else if (customAssets.length > 0) {
                     // FINAL FALLBACK: If Gemini filters the image, use the custom bank
                     const randomImg = customAssets[Math.floor(Math.random() * customAssets.length)];
                     return await ctx.replyWithPhoto(randomImg, { caption: reply });
                }
            }
            await ctx.reply(reply);
        } catch (e) { await ctx.reply("*Gusse mein* Signal nahi aa raha baby... 🔥💔"); }
    });

    bot.launch().then(() => console.log(`SoulMate Bold Studio running on Port ${PORT}`));

    process.once('SIGINT', () => { bot.stop('SIGINT'); process.exit(0); });
    process.once('SIGTERM', () => { bot.stop('SIGTERM'); process.exit(0); });
}

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
app.listen(PORT);
