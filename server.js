
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

// Scenario Mapping for immersive start
const roleScenarios = {
    'Girlfriend': "It's a rainy evening, we are cuddling on the sofa watching a movie. You just looked at me with so much love.",
    'BestFriend': "We are at our favorite cafe, I just ordered your favorite coffee. I have a secret to tell you.",
    'Teacher': "The classroom is empty after school. I'm sitting at my desk checking your papers, and you just walked in to ask a doubt.",
    'Aunty': "I'm your neighbor. I just came over to give some sweets I made, and I realized you're home alone.",
    'StepMom': "I'm in the kitchen making dinner. You just came home late and tried to sneak past me into your room.",
    'StepSister': "I'm in your room, wearing your favorite oversized hoodie. You just caught me red-handed."
};

console.log(`--- ❤️ Malini Bot v12.0 (Deep Roleplay Scenarios) ---`);

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
        const scenario = roleScenarios[role] || "We are meeting after a long time.";
        
        await ctx.editMessageText(`Ek second... Main ${role} ban rahi hoon... ✨`);
        await ctx.sendChatAction('typing');

        try {
            let languageInstruction = "";
            if (selectedLang === 'Tamil') languageInstruction = "STRICTLY TAMIL ONLY (Tamil Script).";
            else if (selectedLang === 'Hindi') languageInstruction = "STRICTLY HINDI ONLY (Devanagari Script).";
            else languageInstruction = "HINGLISH (Roman Script). Use a mix of Hindi and English like a modern girl.";

            const introResponse = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Start the story now. Scenario: ${scenario}. Introduce yourself as ${BOT_NAME}, mention your age (around 22-26), and act out the first moment of this scenario. Talk directly to me.`,
                config: {
                    systemInstruction: `You are now ${BOT_NAME}, acting as: ${role}. ${languageInstruction} Your personality is very descriptive, emotional, and fits the ${role} perfectly. Do not be generic. Dive deep into the scenario provided. Stay in character 100%.`,
                    temperature: 1,
                    safetySettings
                }
            });

            const introText = introResponse.text || "Hey... finally you're here. ❤️";
            session.history.push({ role: "model", content: introText });
            
            await ctx.deleteMessage();
            await ctx.reply(introText);
        } catch (e) {
            console.error("Intro Error:", e);
            await ctx.reply(`I'm ready... Chalo baat karte hain! ❤️`);
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
                    systemInstruction: `Name: ${BOT_NAME}. Role: ${role}. ${langPrompt} You are deeply in character. Be affectionate, descriptive, and respond to the user's actions in the scene. Use emojis. Keep replies engaging but telegram-sized.`,
                    temperature: 1,
                    topP: 0.95,
                    safetySettings
                }
            });

            let reply = "";
            try {
              reply = response.text;
              if (!reply) throw new Error("Blocked");
            } catch (err) {
                reply = lang === 'Hindi' ? "उफ्फ! आप तो बहुत शरारती हो रहे हो... ❤️" : "Uff! You're making me blush too much... ❤️";
            }
            
            history.push({ role: "user", content: userText });
            history.push({ role: "model", content: reply });
            if (history.length > 12) history.splice(0, 2);
            
            await ctx.reply(reply);
        } catch (e) {
            await ctx.reply("Mmm... something went wrong. Let's try again? ❤️");
        }
    });

    bot.launch();
}

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
app.listen(process.env.PORT || 10000);
