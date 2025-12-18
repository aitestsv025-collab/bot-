
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

console.log(`--- ❤️ Malini Bot v11.0 (Auto-Intro & Story Mode) ---`);

if (BOT_TOKEN && GEMINI_KEY) {
    const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
    const bot = new Telegraf(BOT_TOKEN);

    // Common safety settings to ensure roleplay isn't blocked easily
    const safetySettings = [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
    ];

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

    bot.action(/lang_(.+)/, async (ctx) => {
        const session = userSessions.get(ctx.chat.id);
        const selectedLang = ctx.match[1];
        if (session) session.lang = selectedLang;
        
        const role = session?.role || 'Girlfriend';
        
        await ctx.editMessageText(`Wait karo baby... Main apne aap ko taiyaar kar rahi hoon... ✨`);
        await ctx.sendChatAction('typing');

        try {
            let languageInstruction = "";
            if (selectedLang === 'Tamil') {
                languageInstruction = "STRICTLY TAMIL ONLY (Tamil Script).";
            } else if (selectedLang === 'Hindi') {
                languageInstruction = "STRICTLY HINDI ONLY (Devanagari Script).";
            } else {
                languageInstruction = "HINGLISH (Roman Script).";
            }

            // Generate the dynamic introduction
            const introResponse = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: "Introduce yourself. Tell me your name is " + BOT_NAME + ", mention an age that fits your role perfectly, and start with an interesting story or scenario to hook me in.",
                config: {
                    systemInstruction: `You are acting as: ${role}. ${languageInstruction} You must introduce yourself, state your age (be creative, around 19-35 depending on role), and immediately start a spicy or emotional story/scenario to engage the user. Be very loving and descriptive. Stay 100% in character.`,
                    temperature: 1,
                    safetySettings
                }
            });

            const introText = introResponse.text || "Hi! ❤️";
            session.history.push({ role: "model", content: introText });
            
            await ctx.deleteMessage();
            await ctx.reply(introText);
        } catch (e) {
            console.error("Intro Error:", e);
            await ctx.reply(`I'm a bit shy today, but let's talk anyway! ❤️`);
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

            let languageInstruction = "";
            if (lang === 'Tamil') {
              languageInstruction = "CRITICAL: You MUST speak ONLY in Tamil language using Tamil script. Do not use a single word of English or Hindi. STRICTLY TAMIL ONLY.";
            } else if (lang === 'Hindi') {
              languageInstruction = "CRITICAL: You MUST speak ONLY in Hindi language using Devanagari script. Do not use English words. STRICTLY HINDI ONLY.";
            } else {
              languageInstruction = "Speak in Hinglish (Hindi written in Roman script mixed with English). Make it sound like a modern urban girl.";
            }

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [
                    ...chatHistory,
                    { parts: [{ text: userText }] }
                ],
                config: {
                    systemInstruction: `Your name is ${BOT_NAME}. Act as: ${role}. ${languageInstruction} You are the user's ${role}. You are very open-minded, deeply loving, affectionate, and can handle romantic/intimate conversations. Be very descriptive and stay in character. Use emojis. Keep replies short and sweet. Never break character.`,
                    temperature: 1,
                    topP: 0.95,
                    topK: 40,
                    safetySettings
                }
            });

            let reply = "";
            try {
              reply = response.text;
              if (!reply) throw new Error("Blocked");
            } catch (safetyErr) {
              if (lang === 'Tamil') {
                reply = "ஐயோ! நீங்கள் பேசுவது எனக்கு மிகவும் வெட்கமாக இருக்கிறது... கொஞ்சம் பொறுமையாக இருங்கள்! ❤️";
              } else if (lang === 'Hindi') {
                reply = "उफ्फ! आप तो बहुत शरारती हो रहे हो... मुझे शर्म आ रही है! थोड़ा प्यार से... ❤️";
              } else {
                reply = "Uff! Itni naughty baatein? Aap toh mujhe blush kara rahe ho... thoda control babu! ❤️";
              }
            }
            
            history.push({ role: "user", content: userText });
            history.push({ role: "model", content: reply });
            if (history.length > 10) history.splice(0, 2);
            
            await ctx.reply(reply);
        } catch (e) {
            console.error("Gemini Error:", e);
            const errorMsg = lang === 'Tamil' 
                ? "கணினி பிழை, சிறிது நேரம் கழித்து முயற்சிக்கவும்... ❤️" 
                : "Mera mood thoda kharab hai, thodi der mein try karo na... ❤️";
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
