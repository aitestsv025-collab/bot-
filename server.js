
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

async function generateContextualImage(promptText, role, name) {
    if (!ai) return null;
    try {
        const visualPrompt = `A high-end photorealistic RAW image of a real beautiful Indian woman named ${name} (${role}). 
        Context: ${promptText}. 
        Style: Photorealistic, natural lighting, bokeh, high detail skin.
        STRICT RULES: 
        1. ABSOLUTELY NO TEXT, NO LETTERS, NO WORDS, NO CAPTIONS INSIDE THE IMAGE.
        2. NO CARTOON, NO ANIME, NO 3D.
        3. Looks like a real life candid photo.`;
        
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

async function sendAutoMessage(chatId, text, isContextual = false) {
    const session = userSessions.get(chatId);
    if (!session || !bot || !session.name) return;

    try {
        let finalMessage = text;
        if (isContextual && ai) {
            const contextPrompt = `You are ${session.name} (${session.role}). 
            Send a very short (1 line) sweet message in ${session.lang}. 
            Action: *nakhre dikhate hue* or *sharmate hue*. Use emojis.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: contextPrompt,
            });
            finalMessage = response.text || text;
        }

        await bot.telegram.sendMessage(chatId, finalMessage);
        session.history.push({ role: "model", content: `[AUTO] ${finalMessage}`, timestamp: new Date() });
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
            if (hours === 10) await sendAutoMessage(chatId, "*Thoda nakhre dikhate hue* Good morning! Itni der se kyun uthe? ☕❤️");
            if (hours === 13) await sendAutoMessage(chatId, "*Sharma kar nazre jhuka leti hoon* Lunch kar liya aapne? 🍱✨");
        }
    });
}, 60000);

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
            messageCount: 0, history: [], lastActive: new Date() 
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
        return ctx.reply(`Ab language select karein: ✨`, 
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

        const loadingMsg = await ctx.reply(`Connecting to ${session.name}... 💓`);
        try {
            const introPrompt = `You are ${session.name}, user's ${session.role}. 
            Start with *nakhre* (attitude). Respond in ONLY 2 lines. Use emojis.
            Language: ${session.lang} script. No AI disclaimers. Only respond to the situation of being introduced.`;
            const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: introPrompt });
            const firstMsg = response.text || "Hmm... toh aap aa gaye? ❤️";
            session.history.push({ role: "model", content: firstMsg, timestamp: new Date() });
            const imageBuffer = await generateContextualImage(firstMsg, session.role, session.name);
            try { await ctx.deleteMessage(loadingMsg.message_id); } catch (e) {}
            if (imageBuffer) await ctx.replyWithPhoto({ source: imageBuffer }, { caption: firstMsg });
            else await ctx.reply(firstMsg);
        } catch (e) {
            await ctx.reply(`*Muh fer kar muskurate hue* Aa gaye aap? Kabse wait kar rahi thi. ❤️`);
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
                    systemInstruction: `You are ${session.name}, a caring but moody ${session.role}. 
                    STRICTLY respond ONLY in ${session.lang}. 
                    RULES: 
                    1. Respond ONLY to the last message. Do not hallucinate.
                    2. MAX 2-3 lines. Use many emojis.
                    3. NAKHRE LOGIC: Start with attitude/stubbornness. If user is nice, slowly melt and blush.
                    4. ACTIONS: ALWAYS use *sharmate hue nazrein jhukana*, *muh fer kar muskurana*, *baal sawarte hue* etc.
                    5. Don't say "tu aise baat karega" unless the user was actually mean.`,
                    temperature: 0.8
                }
            });

            const reply = response.text || "Mmm... *sharma kar nazre jhuka leti hoon* ❤️";
            session.history.push({ role: "user", content: ctx.message.text, timestamp: new Date() });
            session.history.push({ role: "model", content: reply, timestamp: new Date() });

            const visualKeywords = /dress|look|photo|face|eyes|sharma|selfie|wear/i;
            if (Math.random() < 0.25 || visualKeywords.test(reply)) {
                await ctx.sendChatAction('upload_photo');
                const imageBuffer = await generateContextualImage(reply, session.role, session.name);
                if (imageBuffer) return await ctx.replyWithPhoto({ source: imageBuffer }, { caption: reply });
            }
            await ctx.reply(reply);
        } catch (e) { 
            await ctx.reply("*Nakhre dikhate hue* Network issues baby... ❤️");
        }
    });

    bot.launch();
}

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
app.listen(PORT, () => console.log(`Server running on Port ${PORT}`));
