
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

const ai = (BOT_TOKEN && GEMINI_KEY) ? new GoogleGenAI({ apiKey: GEMINI_KEY }) : null;
const bot = BOT_TOKEN ? new Telegraf(BOT_TOKEN) : null;

// --- Enhanced Realistic Image Generation Helper ---
async function generateContextualImage(promptText, role, name) {
    if (!ai) return null;
    try {
        // Strict prompt for photorealism and ABSOLUTELY NO TEXT in the image
        const visualPrompt = `A high-end photorealistic RAW image of a beautiful young Indian woman named ${name} (${role}). 
        Context: ${promptText}. 
        Style: Photorealistic, cinematic lighting, f/1.8, bokeh, detailed skin.
        STRICT RULES: 
        1. NO TEXT, NO LETTERS, NO NUMBERS, NO WORDS, NO CAPTIONS, NO LOGOS, NO WATERMARKS INSIDE THE IMAGE.
        2. NO CARTOON, NO ANIME, NO 3D RENDER.
        3. The woman should look like a real person in a real-life setting.`;
        
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

// --- Auto-Engagement Engine ---
async function sendAutoMessage(chatId, text, isContextual = false) {
    const session = userSessions.get(chatId);
    if (!session || !bot || !session.name) return;

    const today = new Date().toDateString();
    if (session.lastAutoDate !== today) {
        session.autoCount = 0;
        session.lastAutoDate = today;
    }
    if (session.autoCount >= 10) return;

    try {
        let finalMessage = text;
        if (isContextual && ai) {
            const contextPrompt = `You are ${session.name} (${session.role}). 
            Send a very short (1 line) sweet 'thinking about you' message in ${session.lang}. 
            Include a small shy action like *blushing* or *twirling hair*. Use emojis.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: contextPrompt,
            });
            finalMessage = response.text || text;
        }

        await bot.telegram.sendMessage(chatId, finalMessage);
        session.history.push({ role: "model", content: `[AUTO] ${finalMessage}`, timestamp: new Date() });
        session.autoCount++;
        session.lastActive = new Date();
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
            if (hours === 10) await sendAutoMessage(chatId, "*Sote hue angdayi lete hue* Good morning baby! Nashta kiya? ☕❤️");
            if (hours === 13) await sendAutoMessage(chatId, "*Apne baal sahi karte hue* Lunch time! Tumhari bahut yaad aa rahi hai. 🍱✨");
            if (hours === 22) await sendAutoMessage(chatId, "*Apne bed par let kar* Good night jaan. Sapno mein zaroor aana. 🌙💖");
        }
    });
}, 60000);

app.get('/api/admin/stats', (req, res) => {
    const users = Array.from(userSessions.entries()).map(([id, data]) => ({
        id,
        userName: data.userName,
        role: data.role || 'Selecting...',
        intimacy: data.intimacyLevel || 0,
        messageCount: data.messageCount || 0,
        autoCount: data.autoCount || 0,
        lastActive: data.lastActive || new Date(),
        chatHistory: data.history || []
    }));
    res.json({ totalUsers: userSessions.size, totalMessages: globalStats.totalMessagesProcessed, uptime: Math.floor((new Date() - globalStats.startTime) / 1000 / 60), users });
});

if (bot && ai) {
    bot.start(async (ctx) => {
        const chatId = ctx.chat.id;
        userSessions.set(chatId, { 
            userName: ctx.from.first_name || "User", 
            intimacyLevel: 0, messageCount: 0, autoCount: 0, 
            lastAutoDate: new Date().toDateString(), lastActive: new Date(), 
            history: [] 
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
        
        return ctx.reply(`Ab apni language select karein: ✨`, 
            Markup.inlineKeyboard([
                [Markup.button.callback('🇮🇳 Hindi', 'lang_Hindi'), Markup.button.callback('🅰️ English', 'lang_English')],
                [Markup.button.callback('💬 Hinglish', 'lang_Hinglish'), Markup.button.callback('🕉️ Tamil', 'lang_Tamil')]
            ])
        );
    });

    bot.action(/lang_(.+)/, async (ctx) => {
        const session = userSessions.get(ctx.chat.id);
        if (!session || !session.role) return ctx.reply("Please /start again.");
        
        session.lang = ctx.match[1];
        const names = namePools[session.role];
        session.name = names[Math.floor(Math.random() * names.length)];
        
        await ctx.answerCbQuery();
        try { await ctx.deleteMessage(); } catch (e) {}

        const loadingMsg = await ctx.reply(`Connecting to ${session.name}... 💓`);

        try {
            const introPrompt = `You are ${session.name}, acting as the user's ${session.role}. 
            Language: ${session.lang}.
            Rule: Respond in ONLY 2 lines. Use lots of emojis. Describe a small shy action like *niche dekh kar sharma rahi hoon*.
            STRICTLY use ${session.lang} script.`;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: introPrompt,
            });

            const firstMsg = response.text || "Hi! Main aa gayi. ❤️";
            session.history.push({ role: "model", content: firstMsg, timestamp: new Date() });
            
            const imageBuffer = await generateContextualImage(firstMsg, session.role, session.name);
            try { await ctx.deleteMessage(loadingMsg.message_id); } catch (e) {}

            if (imageBuffer) {
                await ctx.replyWithPhoto({ source: imageBuffer }, { caption: firstMsg });
            } else {
                await ctx.reply(firstMsg);
            }
        } catch (e) {
            await ctx.reply(`Hi! Main hoon ${session.name}. ❤️ *Dheere se muskurate hue* Kabse tumhara wait kar rahi thi.`);
        }
    });

    bot.on('text', async (ctx) => {
        const session = userSessions.get(ctx.chat.id);
        if (!session || !session.name) return ctx.reply("Please use /start to set up your partner.");

        session.messageCount++;
        session.lastActive = new Date();
        globalStats.totalMessagesProcessed++;

        try {
            const chatHistoryForAI = session.history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] }));
            
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [...chatHistoryForAI, { parts: [{ text: ctx.message.text }] }],
                config: {
                    systemInstruction: `You are ${session.name}, a caring ${session.role}. 
                    STRICTLY respond ONLY in ${session.lang}. 
                    MANDATORY RULES: 
                    1. STRICTLY MAX 2-3 lines per response.
                    2. Use many emojis (🥰, ❤️, ✨, 😊).
                    3. ALWAYS include a small story-like action in *asterisks* (e.g., *sharma kar nazre jhuka leti hoon*, *apne dupatta theek karte hue*, *baal kaan ke piche karte hue*).
                    4. Act shyer or closer based on the conversation flow.`,
                    temperature: 0.9
                }
            });

            const reply = response.text || "Hmm... ❤️";
            session.history.push({ role: "user", content: ctx.message.text, timestamp: new Date() });
            session.history.push({ role: "model", content: reply, timestamp: new Date() });

            // Random chance (30%) or visual trigger
            const visualKeywords = /dress|wear|clothes|look|showing|photo|selfie|eyes|face/i;
            const shouldSendImage = Math.random() < 0.3 || visualKeywords.test(reply);
            
            if (shouldSendImage) {
                await ctx.sendChatAction('upload_photo');
                const imageBuffer = await generateContextualImage(reply, session.role, session.name);
                if (imageBuffer) {
                    return await ctx.replyWithPhoto({ source: imageBuffer }, { caption: reply });
                }
            }
            
            await ctx.reply(reply);
        } catch (e) { 
            await ctx.reply("Kuch issue ho gaya jaan... ❤️");
        }
    });

    bot.launch();
}

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
app.listen(PORT, () => console.log(`Server running on Port ${PORT}`));
