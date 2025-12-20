
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
            Pichli baatein: ${session.history.slice(-2).map(h => h.content).join(' | ')}.
            Send a short, sweet 'thinking about you' message in the selected language.`;
            
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
        if (!session.name) return; // Wait for full setup
        
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
        
        return ctx.reply(`Aap kisse baat karna chahenge? (Who would you like to talk to?)`, 
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
        
        return ctx.reply(`Great! Ab apni language select karein (Select language):`, 
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
        await ctx.reply(`Initializing ${session.name} (${session.role})... 💓`);

        try {
            // Generate unique intro story/first message using Gemini
            const introPrompt = `You are ${session.name}, acting as a ${session.role}. 
            Preferred Language: ${session.lang}.
            The user just started a chat. Generate a very romantic/engaging first message or a small 'story-like' opening (2-3 lines) to start the conversation. 
            Keep it sweet, natural, and immersive. Don't mention you are an AI. 
            If language is Tamil, respond ONLY in Tamil. If language is Hinglish, use Roman script with Hindi words.`;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: introPrompt,
            });

            const firstMsg = response.text || "Hi! I'm finally here... ❤️";
            session.history.push({ role: "model", content: firstMsg, timestamp: new Date() });
            return ctx.reply(firstMsg);
        } catch (e) {
            let fallback = `Hi! I'm ${session.name}. ❤️ I've been waiting for you.`;
            if (session.lang === 'Hindi') fallback = `Hi! Main hoon ${session.name}. ❤️ Kabse tumhara wait kar rahi thi.`;
            if (session.lang === 'Tamil') fallback = `வணக்கம்! நான் ${session.name}. ❤️ உங்களுக்காக காத்திருந்தேன்.`;
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
                    systemInstruction: `You are ${session.name}, a caring ${session.role}. 
                    STRICTLY respond ONLY in ${session.lang} language. 
                    Be deeply personal, use emojis, and act as a real human partner. 
                    If language is Hinglish, use Roman script with Hindi words.
                    If language is Tamil, use proper Tamil script.`,
                    temperature: 0.9
                }
            });

            const reply = response.text || "Hmm... ❤️";
            session.history.push({ role: "user", content: ctx.message.text, timestamp: new Date() });
            session.history.push({ role: "model", content: reply, timestamp: new Date() });
            await ctx.reply(reply);
        } catch (e) { 
            console.error(e);
            await ctx.reply("I'm feeling a bit shy right now... *blushes* ❤️");
        }
    });

    bot.launch();
}

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
app.listen(PORT, () => console.log(`Server running on Port ${PORT}`));
