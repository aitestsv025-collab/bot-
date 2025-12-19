
import { Telegraf, Markup } from 'telegraf';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from "@google/genai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// --- CONFIGURATION ---
// These MUST be set in Render Dashboard -> Environment
const BOT_TOKEN = (process.env.TELEGRAM_TOKEN || "").trim();
const GEMINI_KEY = (process.env.API_KEY || "").trim(); 
const PORT = process.env.PORT || 10000;

// Log initialization status for Render logs
console.log("--- BOT INITIALIZATION ---");
console.log(`TELEGRAM_TOKEN: ${BOT_TOKEN ? "FOUND ✅" : "MISSING ❌"}`);
console.log(`API_KEY: ${GEMINI_KEY ? "FOUND ✅" : "MISSING ❌"}`);
console.log("--------------------------");

const userSessions = new Map();

const namePools = {
    'Girlfriend': ['Riya', 'Sana', 'Ishani', 'Myra', 'Tanvi', 'Priya'],
    'BestFriend': ['Sneha', 'Anjali', 'Kritika', 'Diya', 'Tanu'],
    'Teacher': ['Ms. Sharma', 'Ms. Gupta', 'Aditi Ma\'am', 'Ms. Deshmukh', 'Neha Miss'],
    'Aunty': ['Sunita Ji', 'Meena Ji', 'Kavita Aunty', 'Rajeshwari', 'Pushpa'],
    'StepMom': ['Seema', 'Kiran', 'Rekha', 'Vandana', 'Anita'],
    'StepSister': ['Ishita', 'Ananya', 'Jhanvi', 'Khushi', 'Navya']
};

const roleScenarios = {
    'Girlfriend': "It's a quiet evening. I'm waiting for you at our favorite spot.",
    'BestFriend': "We're chilling at the cafe, just scrolling through our phones.",
    'Teacher': "I'm in the classroom finishing some grades. You just entered.",
    'Aunty': "I'm neighbor. I'm walking my dog and saw you at the gate.",
    'StepMom': "I'm in the kitchen making tea. You just came home.",
    'StepSister': "I'm in the balcony, listening to music. You just joined me."
};

const roleAppearance = {
    'Girlfriend': "a beautiful 18-19 year old Indian girl, wearing trendy casual clothes",
    'BestFriend': "a cute 18-19 year old Indian girl, wearing simple college clothes",
    'Teacher': "a professional 25 year old Indian woman, wearing a formal elegant saree and glasses, intellectual look",
    'Aunty': "a mature 35-40 year old Indian woman, wearing a traditional heavy saree, graceful and homely look",
    'StepMom': "a graceful 32-35 year old Indian woman, wearing elegant house clothes or a simple salwar kameez",
    'StepSister': "a modern 20 year old Indian girl, wearing cool stylish western clothes"
};

function getLangInstruction(lang) {
    const emojiRules = " Use dher saare expressive emojis (❤️, ✨, 😊, 🌸, 🥰, 🥺, 😋).";
    switch(lang) {
        case 'Hindi': return "STRICTLY use HINDI language only (Devanagari script). No English." + emojiRules;
        case 'Tamil': return "STRICTLY use TAMIL language only. No English." + emojiRules;
        case 'English': return "STRICTLY use ENGLISH language only." + emojiRules;
        case 'Hinglish': return "Use HINGLISH (Hindi mixed with English in Roman script). Natural chat style." + emojiRules;
        default: return "Use English." + emojiRules;
    }
}

async function generateContextImage(ai, visualDescription, role, characterName) {
    try {
        const appearance = roleAppearance[role] || "a beautiful Indian girl";
        const prompt = `A realistic high-quality cinematic photo of an Indian woman named ${characterName}. She is ${appearance}. Scene: ${visualDescription}. Natural lighting, detailed facial features, emotional expression, 4k resolution, bokeh background.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: "1:1" } }
        });
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) return part.inlineData.data;
        }
    } catch (e) {
        console.error("Image Gen Error:", e);
    }
    return null;
}

// Health check for Render / UptimeRobot
app.get('/health', (req, res) => {
    res.status(200).send("Bot is alive and kicking! ❤️");
});

if (BOT_TOKEN && GEMINI_KEY) {
    const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
    const bot = new Telegraf(BOT_TOKEN);

    bot.catch((err) => console.error(`Telegraf Error:`, err));

    bot.start((ctx) => {
        const userName = ctx.from.first_name || "User";
        userSessions.delete(ctx.chat.id);
        userSessions.set(ctx.chat.id, { userName: userName, step: 'role_selection' });

        return ctx.reply(`Namaste ${userName}! Welcome to SoulMate Studio! ❤️\n\nKaun sa character choose karna chahenge?`, 
            Markup.inlineKeyboard([
                [Markup.button.callback('❤️ Girlfriend', 'role_Girlfriend'), Markup.button.callback('🤝 Best Friend', 'role_BestFriend')],
                [Markup.button.callback('👩‍🏫 Teacher', 'role_Teacher'), Markup.button.callback('💃 Aunty', 'role_Aunty')],
                [Markup.button.callback('🏠 Step Mom', 'role_StepMom'), Markup.button.callback('👧 Step Sister', 'role_StepSister')]
            ])
        );
    });

    bot.action(/role_(.+)/, (ctx) => {
        const selectedRole = ctx.match[1];
        const session = userSessions.get(ctx.chat.id);
        const userName = session?.userName || ctx.from.first_name || "User";
        const names = namePools[selectedRole];
        const assignedName = names[Math.floor(Math.random() * names.length)];
        
        userSessions.set(ctx.chat.id, { 
            role: selectedRole, 
            name: assignedName,
            userName: userName,
            lang: 'Hinglish', 
            history: [] 
        });

        return ctx.editMessageText(`${userName}, aapne ${assignedName} (${selectedRole}) ko choose kiya hai. ✨\n\nAb humari bhasha chunein:`, 
            Markup.inlineKeyboard([
                [Markup.button.callback('🇬🇧 English', 'lang_English'), Markup.button.callback('🌍 Hinglish', 'lang_Hinglish')],
                [Markup.button.callback('🇮🇳 Hindi', 'lang_Hindi'), Markup.button.callback('🪔 Tamil', 'lang_Tamil')]
            ])
        );
    });

    bot.action(/lang_(.+)/, async (ctx) => {
        const session = userSessions.get(ctx.chat.id);
        if (!session) return ctx.reply("Please use /start again.");
        const selectedLang = ctx.match[1];
        session.lang = selectedLang;
        const { role, name, lang, userName } = session;
        const scenario = roleScenarios[role] || "We just met.";
        
        await ctx.answerCbQuery(`${name} is typing...`);
        await ctx.sendChatAction('upload_photo');

        try {
            const languageInstruction = getLangInstruction(lang);
            const introResponse = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Setting: ${scenario}. Introduce yourself as ${name} to ${userName}. Act as ${role}. 1 short line. Call them by their name.`,
                config: {
                    systemInstruction: `You are ${name}. Role: ${role}. Talking to user named ${userName}. ${languageInstruction} Never mention you are AI. Use *asterisks* for actions.`,
                    temperature: 0.8
                }
            });

            const introText = introResponse.text || `Hello ${userName}! I am ${name}. ❤️`;
            session.history.push({ role: "model", content: introText });
            const imageData = await generateContextImage(ai, `Intro: ${scenario}`, role, name);
            if (imageData) await ctx.replyWithPhoto({ source: Buffer.from(imageData, 'base64') }, { caption: introText });
            else await ctx.reply(introText);
        } catch (e) {
            await ctx.reply(`Hey ${userName}! I am ${name}. ❤️`);
        }
    });

    bot.on('text', async (ctx) => {
        const chatId = ctx.chat.id;
        const userText = ctx.message.text;
        if (!userSessions.has(chatId)) return ctx.reply("Please use /start ❤️");

        const session = userSessions.get(chatId);
        const { role, name, lang, history, userName } = session;

        try {
            await ctx.sendChatAction('upload_photo');
            const chatHistoryForAI = history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] }));
            const languageInstruction = getLangInstruction(lang);

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [...chatHistoryForAI, { parts: [{ text: userText }] }],
                config: {
                    systemInstruction: `Name: ${name}. Role: ${role}. Talking to ${userName}. ${languageInstruction} Address them by name occasionally. Max 2 lines. Use *asterisks* for actions.`,
                    temperature: 0.9
                }
            });

            const reply = response.text || "Mmm... ❤️";
            const visualPromptResponse = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Context: ${reply}. 8 word photo description of ${name}.`,
            });
            const imageData = await generateContextImage(ai, visualPromptResponse.text, role, name);

            history.push({ role: "user", content: userText });
            history.push({ role: "model", content: reply });
            if (history.length > 40) history.splice(0, 2);
            
            if (imageData) await ctx.replyWithPhoto({ source: Buffer.from(imageData, 'base64') }, { caption: reply });
            else await ctx.reply(reply);
        } catch (e) {
            await ctx.reply("Something went wrong... ❤️");
        }
    });

    bot.launch();
}

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
app.listen(PORT, () => console.log(`🚀 Server running on Port ${PORT}`));
