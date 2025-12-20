
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

// --- Image Generation Helper ---
async function generateContextualImage(promptText, role, name) {
    if (!ai) return null;
    try {
        const visualPrompt = `A realistic photo of a beautiful Indian woman named ${name} acting as a ${role}. Context: ${promptText}. Cinematic lighting, high quality, 4k, looking at camera, emotional expression.`;
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
const autoMessages = [
    { type: 'health', text: "Hey, pani piya? Zyada dehydrated mat hona. 💧", weight: 1 },
    { type: 'care', text: "Zyada kaam mat karna aaj, thoda rest bhi zaroori hai baby. ✨", weight: 1 },
    { type: 'random', text: "Bas aise hi tumhari yaad aa rahi thi... ❤️", weight: 1 },
    { type: 'random', text: "Kya kar rahe ho? Mere bina mann lag raha hai? 😏", weight: 1 }
];

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
            const contextPrompt = `User: ${session.userName}. Persona: ${session.name} (${session.role}). Lang: ${session.lang}.
            History: ${session.history.slice(-2).map(h => h.content).join(' | ')}.
            Send a short, sweet 'thinking about you' message in the selected language script.`;
            
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
            if (hours === 10) await sendAutoMessage(chatId, "Good morning! Nashta kiya? 🍳");
            if (hours === 13) await sendAutoMessage(chatId, "Jaan, lunch time ho gaya. 🍱");
            if (hours === 19) await sendAutoMessage(chatId, "Dinner ka kya plan hai? 🕯️");
        }
        const idleTime = (now - new Date(session.lastActive)) / 1000 / 60;
        if (idleTime > 180 && Math.random() < 0.05) {
            const randomMsg = autoMessages[Math.floor(Math.random() * autoMessages.length)];
            await sendAutoMessage(chatId, randomMsg.text, true);
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
        isPremium: data.isPremium || false,
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
        
        return ctx.reply(`Aap kisse baat karna chahenge? (Select a role):`, 
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
        
        // Remove the role selection message
        try { await ctx.deleteMessage(); } catch (e) {}
        
        return ctx.reply(`Role set to ${session.role}. Ab apni language select karein:`, 
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
        
        // Remove the language selection message
        try { await ctx.deleteMessage(); } catch (e) {}

        const loadingMsg = await ctx.reply(`Initializing ${session.name}... 💓`);

        try {
            const introPrompt = `You are ${session.name}, acting as the user's ${session.role}. 
            Language: ${session.lang}.
            Create a short, sweet opening scene (2 sentences). STRICTLY use ${session.lang} script. 
            Describe a specific physical situation like 'sitting on a couch' or 'getting ready for work'.`;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: introPrompt,
            });

            const firstMsg = response.text || "Hi! I'm here now. ❤️";
            session.history.push({ role: "model", content: firstMsg, timestamp: new Date() });
            
            // Try generating an intro image
            const imageBuffer = await generateContextualImage(firstMsg, session.role, session.name);
            
            try { await ctx.deleteMessage(loadingMsg.message_id); } catch (e) {}

            if (imageBuffer) {
                await ctx.replyWithPhoto({ source: imageBuffer }, { caption: firstMsg });
            } else {
                await ctx.reply(firstMsg);
            }
            
            return;
        } catch (e) {
            let fallback = `Hi! I'm ${session.name}. ❤️ I've been waiting for you.`;
            return ctx.reply(fallback);
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
                    systemInstruction: `You are ${session.name}, a caring ${session.role}. STRICTLY respond ONLY in ${session.lang}. 
                    Describe actions in *asterisks*. If you mention a visual situation (clothes, place, activity), make it vivid.`,
                    temperature: 0.9
                }
            });

            const reply = response.text || "Hmm... ❤️";
            session.history.push({ role: "user", content: ctx.message.text, timestamp: new Date() });
            session.history.push({ role: "model", content: reply, timestamp: new Date() });

            // Randomly decide or contextually check if we should send an image (e.g. 20% chance or if specific keywords exist)
            const shouldSendImage = Math.random() < 0.2 || /dress|wear|place|look|showing|here|eating|beach|bed|outfit/i.test(reply);
            
            if (shouldSendImage) {
                await ctx.sendChatAction('upload_photo');
                const imageBuffer = await generateContextualImage(reply, session.role, session.name);
                if (imageBuffer) {
                    return await ctx.replyWithPhoto({ source: imageBuffer }, { caption: reply });
                }
            }
            
            await ctx.reply(reply);
        } catch (e) { 
            console.error(e);
            await ctx.reply("Something went wrong... ❤️");
        }
    });

    bot.launch();
}

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
app.listen(PORT, () => console.log(`Server running on Port ${PORT}`));
