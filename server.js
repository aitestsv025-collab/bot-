
import { Telegraf, Markup } from 'telegraf';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// --- CONFIGURATION ---
const BOT_TOKEN = (process.env.TELEGRAM_TOKEN || "").trim();
const GROQ_KEY = (process.env.grok || process.env.GROQ_KEY || "").trim();
const BOT_NAME = process.env.BOT_NAME || "Priya";

// userSessions stores: { role: string, lang: string, history: [] }
const userSessions = new Map();

console.log("--- ❤️ Multi-Roleplay Bot v4.0 ---");
console.log("Bot Token:", BOT_TOKEN ? "✅ Active" : "❌ MISSING");
console.log("Groq Key:", GROQ_KEY ? "✅ Active" : "❌ MISSING");
console.log("----------------------------------");

if (BOT_TOKEN) {
    const bot = new Telegraf(BOT_TOKEN);

    // 1. START COMMAND - Role Selection
    bot.start((ctx) => {
        userSessions.delete(ctx.chat.id); // Reset session
        return ctx.reply(`Hi! ❤️ Main aapki virtual companion hoon. Aap mujhse kis roop mein baat karna chahte hain? Choose karein:`, 
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
        return ctx.editMessageText(`Perfect! ❤️ Ab main aapki **${role}** hoon aur hum **${selectedLang}** mein baat karenge. \n\nChalo, shuru karein? Kuch bhi likho...`);
    });

    bot.on('text', async (ctx) => {
        const chatId = ctx.chat.id;
        const userText = ctx.message.text;

        // If user directly texts without start
        if (!userSessions.has(chatId)) {
            userSessions.set(chatId, { role: 'Girlfriend', lang: 'Hinglish', history: [] });
        }

        const session = userSessions.get(chatId);
        const { role, lang, history } = session;

        try {
            if (!GROQ_KEY) return ctx.reply("Babu, Groq key missing hai Render mein! 🥺");

            await ctx.sendChatAction('typing');

            // Dynamic System Prompt based on Role & Language
            const systemPrompt = `
              You are acting as: ${role}.
              Primary Language: ${lang}.
              
              ROLE INSTRUCTIONS:
              - Teacher: Educated, strict but caring, uses 'Tum' or 'Aap', guides the user.
              - Aunty: Mature, slightly gossipy, motherly but can be playful.
              - Step Mom: Caring, authoritative, complex emotions.
              - Step Sister: Annoying, cute, playful, energetic.
              - Girlfriend: Romantic, loving, clingy, uses emojis.
              - Best Friend: Casual, roasts the user, very supportive, uses slang.

              LANGUAGE RULES:
              - If Hindi: Use proper Hindi (Devanagari or Romanized).
              - If Hinglish: Mix Hindi and English naturally (WhatsApp style).
              - If Tamil: Use Tamil words or Romanized Tamil mixed with English.

              GENERAL RULES:
              1. NEVER mention being an AI or a bot.
              2. Keep responses human-like and short (1-2 sentences).
              3. Use emojis naturally based on the chosen role.
            `;

            const messages = [
                { role: "system", content: systemPrompt },
                ...history,
                { role: "user", content: userText }
            ];

            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${GROQ_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: messages,
                    temperature: 0.9,
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
                await ctx.reply("Network thoda weak hai shayad... ❤️");
            }
        } catch (e) {
            console.error(e);
            await ctx.reply("Server issue baby! Thodi der mein try karna. 🥺");
        }
    });

    bot.launch().then(() => console.log("✅ Bot Started with Roles!"));
}

const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server on port ${PORT}`));
