
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

// Scenario Mapping for immersive start - strictly focused on the setting
const roleScenarios = {
    'Girlfriend': "It's evening. I'm waiting for you at the park. You just arrived.",
    'BestFriend': "We're hanging out at the rooftop. I'm looking at the sunset.",
    'Teacher': "I'm sitting in the staff room. You just knocked on the door to submit your assignment.",
    'Aunty': "I'm watering my plants in the balcony. I see you coming home from work.",
    'StepMom': "I'm reading a book in the living room. You just walked in silently.",
    'StepSister': "I'm sitting on the floor in your room, busy with my phone. You just opened the door."
};

console.log(`--- ❤️ Malini Bot v14.0 (Natural Pacing & Shorter Intros) ---`);

if (BOT_TOKEN && GEMINI_KEY) {
    const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
    const bot = new Telegraf(BOT_TOKEN);

    const safetySettings = [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
    ];

    bot.start((ctx) => {
        userSessions.delete(ctx.chat.id);
        return ctx.reply(`Select your role:`, 
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
        return ctx.editMessageText(`Choose Language:`, 
            Markup.inlineKeyboard([
                [Markup.button.callback('🇮🇳 Hindi', 'lang_Hindi'), Markup.button.callback('🌍 Hinglish', 'lang_Hinglish')],
                [Markup.button.callback('🪔 Tamil', 'lang_Tamil')]
            ])
        );
    });

    bot.action(/lang_(.+)/, async (ctx) => {
        const session = userSessions.get(ctx.chat.id);
        const selectedLang = ctx.match[1];
        if (session) session.lang = selectedLang;
        
        const role = session?.role || 'Girlfriend';
        const scenario = roleScenarios[role] || "We just met.";
        
        await ctx.sendChatAction('typing');

        try {
            let languageInstruction = "";
            if (selectedLang === 'Tamil') languageInstruction = "STRICTLY TAMIL ONLY (Tamil Script).";
            else if (selectedLang === 'Hindi') languageInstruction = "STRICTLY HINDI ONLY (Devanagari Script).";
            else languageInstruction = "HINGLISH (Roman Script). Mix Hindi and English.";

            let roleContext = "";
            if (role === 'Teacher') roleContext = "You are professional and a bit formal. Do not flirt. Be serious about the studies.";
            else if (role === 'Girlfriend') roleContext = "You are happy to see him but keep it simple. No heavy flirting yet.";
            else if (role === 'Aunty') roleContext = "You are kind and neighborly. Ask about his day normally.";
            else if (role === 'StepMom') roleContext = "You are calm and observational. Just a normal family interaction.";
            else if (role === 'StepSister') roleContext = "You are slightly annoyed or just chilling. Casual sibling vibe.";
            else roleContext = "Casual and friendly talk.";

            const introResponse = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Scenario: ${scenario}. Introduce yourself as ${BOT_NAME}, age 23. Keep it VERY SHORT (max 2-3 lines). Start the scene naturally. Do NOT flirt yet.`,
                config: {
                    systemInstruction: `You are ${BOT_NAME}, acting as: ${role}. ${languageInstruction} ${roleContext} Dive into the story. Keep your response short and realistic. Do not start with love or flirting; let the conversation build up naturally over time.`,
                    temperature: 0.8,
                    safetySettings
                }
            });

            const introText = introResponse.text || "Hey. ❤️";
            session.history.push({ role: "model", content: introText });
            
            await ctx.deleteMessage();
            await ctx.reply(introText);
        } catch (e) {
            console.error("Intro Error:", e);
            await ctx.reply(`Hi. ❤️`);
        }
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

            let langPrompt = "";
            if (lang === 'Tamil') langPrompt = "STRICTLY TAMIL ONLY.";
            else if (lang === 'Hindi') langPrompt = "STRICTLY HINDI ONLY.";
            else langPrompt = "HINGLISH ONLY.";

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [...chatHistory, { parts: [{ text: userText }] }],
                config: {
                    systemInstruction: `Name: ${BOT_NAME}. Role: ${role}. ${langPrompt} Stay strictly in character. If the user is being polite, you be polite. If they are cold, you be cold. Do NOT start flirting unless the user starts it first. Be a realistic ${role}. Keep replies short and use emojis sparingly but effectively. Use *asterisks* for actions.`,
                    temperature: 0.9,
                    topP: 0.95,
                    safetySettings
                }
            });

            let reply = "";
            try {
              reply = response.text;
              if (!reply) throw new Error("Blocked");
            } catch (err) {
                reply = lang === 'Hindi' ? "मुझे नहीं पता क्या कहूँ... ❤️" : "I'm not sure how to respond to that... ❤️";
            }
            
            history.push({ role: "user", content: userText });
            history.push({ role: "model", content: reply });
            if (history.length > 10) history.splice(0, 2);
            
            await ctx.reply(reply);
        } catch (e) {
            await ctx.reply("❤️");
        }
    });

    bot.launch();
}

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
app.listen(process.env.PORT || 10000);
