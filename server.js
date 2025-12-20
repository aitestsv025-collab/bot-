
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

const roleAppearance = {
    'Girlfriend': "a beautiful 18-19 year old Indian girl, slim and attractive",
    'BestFriend': "a cute 18-19 year old Indian girl, casual vibe",
    'Teacher': "a professional 25 year old Indian woman, wearing a formal elegant saree and glasses",
    'Aunty': "a mature 35-40 year old Indian woman, curvy and graceful",
    'StepMom': "a graceful 32-35 year old Indian woman, wearing home clothes",
    'StepSister': "a modern 20 year old Indian girl, stylish and bold"
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
    if (!session || !bot) return;

    // Daily limit check
    const today = new Date().toDateString();
    if (session.lastAutoDate !== today) {
        session.autoCount = 0;
        session.lastAutoDate = today;
    }

    if (session.autoCount >= 10) return;

    try {
        let finalMessage = text;
        if (isContextual && ai) {
            // Generate message based on pichli chat
            const contextPrompt = `User's name is ${session.userName}. You are acting as ${session.name} (${session.role}). 
            Pichli baatein: ${session.history.slice(-3).map(h => h.content).join(' | ')}.
            Send a short, sweet 'I am thinking about you' type message in Hinglish (max 1 line).`;
            
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

// Global clock for scheduling
setInterval(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    userSessions.forEach(async (session, chatId) => {
        // 1. Fixed Schedule Messages (10 AM, 1 PM, 7 PM)
        if (minutes === 0) {
            if (hours === 10) await sendAutoMessage(chatId, "Good morning! Nashta kiya aapne? 🍳");
            if (hours === 13) await sendAutoMessage(chatId, "Jaan, lunch time ho gaya. Kya khaya aaj? 🍱");
            if (hours === 19) await sendAutoMessage(chatId, "Dinner ka kya plan hai? Main toh kab se wait kar rahi hoon... 🕯️");
        }

        // 2. Random Pings (Every 2-3 hours if no activity)
        const idleTime = (now - new Date(session.lastActive)) / 1000 / 60; // in minutes
        if (idleTime > 120 && Math.random() < 0.1) {
            const randomMsg = autoMessages[Math.floor(Math.random() * autoMessages.length)];
            await sendAutoMessage(chatId, randomMsg.text, Math.random() > 0.5);
        }
    });
}, 60000); // Check every minute

// Admin API
app.get('/api/admin/stats', (req, res) => {
    const users = Array.from(userSessions.entries()).map(([id, data]) => ({
        id,
        userName: data.userName,
        role: data.role || 'Not Selected',
        intimacy: data.intimacyLevel || 0,
        messageCount: data.messageCount || 0,
        autoCount: data.autoCount || 0,
        isPremium: data.isPremium || false,
        lastActive: data.lastActive || new Date(),
        chatHistory: data.history || []
    }));
    
    res.json({
        totalUsers: userSessions.size,
        totalMessages: globalStats.totalMessagesProcessed,
        uptime: Math.floor((new Date() - globalStats.startTime) / 1000 / 60),
        users
    });
});

if (bot && ai) {
    bot.start(async (ctx) => {
        const chatId = ctx.chat.id;
        if (!userSessions.has(chatId)) {
            userSessions.set(chatId, { 
                userName: ctx.from.first_name || "User", 
                intimacyLevel: 0,
                messageCount: 0,
                autoCount: 0,
                lastAutoDate: new Date().toDateString(),
                firstSeen: new Date(),
                lastActive: new Date(),
                isPremium: false,
                history: []
            });
        }
        return ctx.reply(`Aap kisse baat karna chahenge?`, 
            Markup.inlineKeyboard([
                [Markup.button.callback('❤️ Girlfriend', 'role_Girlfriend'), Markup.button.callback('🤝 Best Friend', 'role_BestFriend')],
                [Markup.button.callback('👩‍🏫 Teacher', 'role_Teacher'), Markup.button.callback('💃 Aunty', 'role_Aunty')],
                [Markup.button.callback('🏠 Step Mom', 'role_StepMom'), Markup.button.callback('👧 Step Sister', 'role_StepSister')]
            ])
        );
    });

    bot.action(/role_(.+)/, async (ctx) => {
        const session = userSessions.get(ctx.chat.id);
        if (!session) return;
        const names = namePools[ctx.match[1]];
        session.role = ctx.match[1];
        session.name = names[Math.floor(Math.random() * names.length)];
        session.lang = 'Hinglish';
        await ctx.answerCbQuery();
        return ctx.reply(`Hi! Main hoon ${session.name}. ❤️ Mujhse kya baatein karna chahte ho?`);
    });

    bot.on('text', async (ctx) => {
        const session = userSessions.get(ctx.chat.id);
        if (!session) return ctx.reply("Please /start");

        session.messageCount++;
        session.lastActive = new Date();
        globalStats.totalMessagesProcessed++;

        try {
            const chatHistoryForAI = session.history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] }));
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [...chatHistoryForAI, { parts: [{ text: ctx.message.text }] }],
                config: {
                    systemInstruction: `Name: ${session.name}. Role: ${session.role}. Respond in Hinglish. Be caring.`,
                    temperature: 0.9
                }
            });

            const reply = response.text || "Hmm... ❤️";
            session.history.push({ role: "user", content: ctx.message.text, timestamp: new Date() });
            session.history.push({ role: "model", content: reply, timestamp: new Date() });
            await ctx.reply(reply);
        } catch (e) { console.error(e); }
    });

    bot.launch();
}

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
app.listen(PORT, () => console.log(`Server running on Port ${PORT}`));
