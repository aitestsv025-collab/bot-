
import { Telegraf, Markup } from 'telegraf';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from "@google/genai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// --- CONFIGURATION ---
// Note: Use process.env.API_KEY for Gemini as per global guidelines
const BOT_TOKEN = (process.env.TELEGRAM_TOKEN || "").trim();
const GEMINI_KEY = (process.env.API_KEY || "").trim(); 
const BOT_NAME = process.env.BOT_NAME || "Malini";

const userSessions = new Map();

console.log(`--- ❤️ Malini Bot v6.0 (Gemini Free Edition) ---`);
console.log(`Telegram Token: ${BOT_TOKEN ? "✅" : "❌"}`);
console.log(`Gemini API Key: ${GEMINI_KEY ? "✅" : "❌"}`);

if (BOT_TOKEN && GEMINI_KEY) {
    const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
    const bot = new Telegraf(BOT_TOKEN);

    bot.start((ctx) => {
        userSessions.delete(ctx.chat.id);
        return ctx.reply(`Hi! ❤️ Main aapki ${BOT_NAME} hoon. Mere saath kaise baat karna chahoge?`, 
            Markup.inlineKeyboard([
                [Markup.button.callback('❤️ Girlfriend', 'role_Girlfriend'), Markup.button.callback('🤝 Best Friend', 'role_BestFriend')],
                [Markup.button.callback('👩‍🏫 Teacher', 'role_Teacher'), Markup.button.callback('💃 Aunty', 'role_Aunty')]
            ])
        );
    });

    bot.action(/role_(.+)/, (ctx) => {
        const selectedRole = ctx.match[1];
        userSessions.set(ctx.chat.id, { role: selectedRole, lang: 'Hinglish', history: [] });
        return ctx.editMessageText(`Theek hai! Main tumhari ${selectedRole} hoon. Language chuno:`, 
            Markup.inlineKeyboard([
                [Markup.button.callback('🇮🇳 Hindi', 'lang_Hindi'), Markup.button.callback('🌍 Hinglish', 'lang_Hinglish')]
            ])
        );
    });

    bot.action(/lang_(.+)/, (ctx) => {
        const session = userSessions.get(ctx.chat.id);
        if (session) session.lang = ctx.match[1];
        return ctx.editMessageText(`Perfect! ❤️ Ab hum chat kar sakte hain. Kuch bhi pucho apni ${session?.role || 'Girlfriend'} se...`);
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

            // Format history for Gemini
            const chatHistory = history.map(h => ({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: h.content }]
            }));

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [
                    ...chatHistory,
                    { parts: [{ text: userText }] }
                ],
                config: {
                    systemInstruction: `Your name is ${BOT_NAME}. Act as: ${role}. Use ${lang}. You are the user's girlfriend. Be very loving, sweet, sometimes naughty, and very caring. Use emojis. Keep replies short and sweet for Telegram.`,
                    temperature: 1,
                    topP: 0.95,
                    topK: 40
                }
            });

            const reply = response.text || "Mmm... kuch keh nahi paa rahi... ❤️";
            
            // Save history (limited to last 10 messages for token efficiency)
            history.push({ role: "user", content: userText });
            history.push({ role: "model", content: reply });
            if (history.length > 10) history.splice(0, 2);
            
            await ctx.reply(reply);
        } catch (e) {
            console.error("Gemini Error:", e);
            if (e.message?.includes("429")) {
                await ctx.reply("Babu, main thoda thak gayi hoon (Rate Limit). 1 minute baad baat karte hain? ❤️");
            } else {
                await ctx.reply("Mera mood thoda kharab hai (Server Error), thodi der mein try karo na... ❤️");
            }
        }
    });

    bot.launch();
} else {
    console.error("❌ ERROR: Missing BOT_TOKEN or API_KEY (Gemini). Bot not started.");
}

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
app.listen(process.env.PORT || 10000);
