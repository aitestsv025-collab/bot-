
import { Telegraf, Markup } from 'telegraf';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from "@google/genai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// --- CONFIGURATION ---
const BOT_TOKEN = (process.env.TELEGRAM_TOKEN || "").trim();
const GEMINI_KEY = (process.env.API_KEY || "").trim(); 
const BOT_NAME = process.env.BOT_NAME || "Malini";

const userSessions = new Map();

console.log(`--- ❤️ Malini Bot v8.0 (Step Sister & Tamil Update) ---`);

if (BOT_TOKEN && GEMINI_KEY) {
    const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
    const bot = new Telegraf(BOT_TOKEN);

    bot.start((ctx) => {
        userSessions.delete(ctx.chat.id);
        return ctx.reply(`Hi! ❤️ Main aapki ${BOT_NAME} hoon. Mere saath kaise baat karna chahoge?`, 
            Markup.inlineKeyboard([
                [Markup.button.callback('❤️ Girlfriend', 'role_Girlfriend'), Markup.button.callback('🤝 Best Friend', 'role_BestFriend')],
                [Markup.button.callback('👩‍🏫 Teacher', 'role_Teacher'), Markup.button.callback('💃 Aunty', 'role_Aunty')],
                [Markup.button.callback('🏠 Step Mom', 'role_StepMom'), Markup.button.callback('👧 Step Sister', 'role_StepSister')]
            ])
        );
    });

    bot.action(/role_(.+)/, (ctx) => {
        const selectedRole = ctx.match[1];
        userSessions.set(ctx.chat.id, { role: selectedRole, lang: 'Hinglish', history: [] });
        return ctx.editMessageText(`Theek hai! Main tumhari ${selectedRole} hoon. Language chuno:`, 
            Markup.inlineKeyboard([
                [Markup.button.callback('🇮🇳 Hindi', 'lang_Hindi'), Markup.button.callback('🌍 Hinglish', 'lang_Hinglish')],
                [Markup.button.callback('🪔 Tamil', 'lang_Tamil')]
            ])
        );
    });

    bot.action(/lang_(.+)/, (ctx) => {
        const session = userSessions.get(ctx.chat.id);
        if (session) session.lang = ctx.match[1];
        const langDisplay = session.lang === 'Tamil' ? 'Tamil' : (session.lang === 'Hindi' ? 'Hindi' : 'Hinglish');
        return ctx.editMessageText(`Perfect! ❤️ Ab hum sirf ${langDisplay} mein hi baat karenge. Kuch bhi pucho apni ${session?.role || 'Girlfriend'} se...`);
    });

    bot.on('text', async (ctx) => {
        const chatId = ctx.chat.id;
        const userText = ctx.message.text;

        if (!userSessions.has(chatId)) {
            userSessions.set(chatId, { role: 'Girlfriend', lang: 'Hinglish', history: [] });
        }

        const session = userSessions.get(chatId);
        const { role, lang, history } = session;

        try {
            await ctx.sendChatAction('typing');

            const chatHistory = history.map(h => ({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: h.content }]
            }));

            // Extremely strict language enforcement instructions
            let languageInstruction = "";
            if (lang === 'Tamil') {
              languageInstruction = "CRITICAL: You MUST speak ONLY in Tamil language using Tamil script. Do not use a single word of English or Hindi. If you don't know a word in Tamil, find a Tamil alternative. STRICTLY TAMIL ONLY.";
            } else if (lang === 'Hindi') {
              languageInstruction = "CRITICAL: You MUST speak ONLY in Hindi language using Devanagari script. Do not use English words. Use pure or common Hindi. STRICTLY HINDI ONLY.";
            } else {
              languageInstruction = "Speak in Hinglish (Hindi words written in Roman/English script mixed with common English). Make it sound like a modern urban Indian girl.";
            }

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [
                    ...chatHistory,
                    { parts: [{ text: userText }] }
                ],
                config: {
                    systemInstruction: `Your name is ${BOT_NAME}. Act as: ${role}. ${languageInstruction} You are the user's ${role}. Be very loving, sweet, affectionate, and stay in character. Use emojis related to the language and culture. Keep replies short and sweet for Telegram. Never break character.`,
                    temperature: 1,
                    topP: 0.95,
                    topK: 40
                }
            });

            const reply = response.text || (lang === 'Tamil' ? "மன்னிக்கவும், என்னால் பதிலளிக்க முடியவில்லை... ❤️" : "Mmm... kuch keh nahi paa rahi... ❤️");
            
            history.push({ role: "user", content: userText });
            history.push({ role: "model", content: reply });
            if (history.length > 10) history.splice(0, 2);
            
            await ctx.reply(reply);
        } catch (e) {
            console.error("Gemini Error:", e);
            const errorMsg = lang === 'Tamil' 
                ? "கணினி பிழை, சிறிது நேரம் கழித்து முயற்சிக்கவும்... ❤️" 
                : "Mera mood thoda kharab hai (Server Error), thodi der mein try karo na... ❤️";
            await ctx.reply(errorMsg);
        }
    });

    bot.launch();
} else {
    console.error("❌ ERROR: Missing BOT_TOKEN or API_KEY. Bot not started.");
}

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
app.listen(process.env.PORT || 10000);
