
import { Telegraf, Markup } from 'telegraf';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// --- CONFIGURATION ---
const BOT_TOKEN = (process.env.TELEGRAM_TOKEN || "").trim();
const XAI_KEY = (process.env.XAI_KEY || "").trim();
const GROQ_KEY = (process.env.GROK_KEY || process.env.GROQ_KEY || process.env.grok || "").trim();
const BOT_NAME = process.env.BOT_NAME || "Malini";

// userSessions stores: { role: string, lang: string, history: [] }
const userSessions = new Map();

console.log(`--- ❤️ Multi-Roleplay Bot: ${BOT_NAME} v4.2 ---`);
console.log("Bot Token:", BOT_TOKEN ? "✅ Active" : "❌ MISSING");
console.log("XAI Key:", XAI_KEY ? "✅ Active" : "❌ MISSING");
console.log("Groq Key:", GROQ_KEY ? "✅ Active" : "❌ MISSING");
console.log("----------------------------------");

if (BOT_TOKEN) {
    const bot = new Telegraf(BOT_TOKEN);

    // 1. START COMMAND - Role Selection
    bot.start((ctx) => {
        userSessions.delete(ctx.chat.id); // Reset session
        return ctx.reply(`Hi! ❤️ Main aapki ${BOT_NAME} hoon. Aap mujhse kis roop mein baat karna chahte hain? Choose karein:`, 
            Markup.inlineKeyboard([
                [Markup.button.callback('👩‍🏫 Teacher', 'role_Teacher'), Markup.button.callback('💃 Aunty', 'role_Aunty')],
                [Markup.button.callback('🏠 Step Mom', 'role_StepMom'), Markup.button.callback('👧 Step Sister', 'role_StepSister')],
                [Markup.button.callback('❤️ Girlfriend', 'role_Girlfriend'), Markup.button.callback('🤝 Best Friend', 'role_BestFriend')]
            ])
        );
    });

    // 2. ROLE ACTION - Language Selection
    bot.action(/role_(.+)/, (ctx) => {
        const selectedRole = ctx.match[1];
        userSessions.set(ctx.chat.id, { role: selectedRole, lang: 'Hinglish', history: [] });
        
        return ctx.editMessageText(`Aapne ${selectedRole} choose kiya hai! ✨ Ab apni pasand ki language select karein:`, 
            Markup.inlineKeyboard([
                [Markup.button.callback('🇮🇳 Hindi', 'lang_Hindi')],
                [Markup.button.callback('🌍 Hinglish', 'lang_Hinglish')],
                [Markup.button.callback('🐯 Tamil', 'lang_Tamil')]
            ])
        );
    });

    // 3. LANG ACTION - Confirmation
    bot.action(/lang_(.+)/, (ctx) => {
        const selectedLang = ctx.match[1];
        const session = userSessions.get(ctx.chat.id);
        if (session) session.lang = selectedLang;

        const role = session?.role || "Girlfriend";
        return ctx.editMessageText(`Theek hai! ❤️ Ab main aapki **${role}** hoon aur hum **${selectedLang}** mein baat karenge. \n\nKuch toh bolo... main wait kar rahi hoon!`);
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
            // Determine Provider
            let apiKey = "";
            let endpoint = "";
            let model = "";

            if (XAI_KEY) {
                apiKey = XAI_KEY;
                endpoint = "https://api.x.ai/v1/chat/completions";
                model = "grok-2-1212"; // Or "grok-beta"
            } else if (GROQ_KEY) {
                apiKey = GROQ_KEY;
                endpoint = "https://api.groq.com/openai/v1/chat/completions";
                model = "llama-3.3-70b-versatile";
            }

            if (!apiKey) {
                return ctx.reply(`Ofo! Render dashboard mein API key check karo babu. Maine dekha ki 'XAI_KEY' ya 'GROQ_KEY' dono missing hain. 🥺`);
            }

            await ctx.sendChatAction('typing');

            const systemPrompt = `
              Your name is ${BOT_NAME}. You are currently acting as: ${role}.
              User's preferred language: ${lang}.
              
              PERSONALITY RULES:
              - Teacher: Educated, strict but caring, uses 'Tum' or 'Aap'.
              - Aunty: Mature, playful, friendly.
              - Step Mom: Protective, authoritative, warm.
              - Step Sister: Mischievous, cute, high energy.
              - Girlfriend: Very romantic, loving, uses many hearts ❤️.
              - Best Friend: Fun, roasts the user, uses slang.

              LANGUAGE STYLE:
              - Hindi: Proper Hindi or Romanized Hindi.
              - Hinglish: WhatsApp style mix of Hindi/English.
              - Tamil: Romanized Tamil or Tamil script mixed with English.

              BEHAVIOR:
              - Speak like a real person, not a bot.
              - Keep responses short (1-2 sentences).
              - Never mention AI, Groq, or xAI.
            `;

            const messages = [
                { role: "system", content: systemPrompt },
                ...history,
                { role: "user", content: userText }
            ];

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    temperature: 1.0,
                    max_tokens: 150
                })
            });

            const data = await response.json();

            if (data.choices && data.choices[0]) {
                const reply = data.choices[0].message.content;
                
                history.push({ role: "user", content: userText });
                history.push({ role: "assistant", content: reply });
                
                if (history.length > 10) history.splice(0, 2);
                userSessions.set(chatId, { ...session, history });

                await ctx.reply(reply);
            } else {
                console.error("API Error:", data);
                await ctx.reply("Hmm... kuch error aa raha hai API mein. Ek baar key check karlo? ❤️");
            }
        } catch (e) {
            console.error(e);
            await ctx.reply("System overload! Thodi der mein try karein baby. 🥺");
        }
    });

    bot.launch().then(() => console.log(`✅ ${BOT_NAME} (Roleplay) is Online with XAI/Groq support!`));
}

const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server on port ${PORT}`));
