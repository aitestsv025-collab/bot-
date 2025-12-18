
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

// Scenario Mapping for immersive start - ensures the AI knows exactly where the story begins
const roleScenarios = {
    'Girlfriend': "It's a rainy evening, we are cuddling on the sofa watching a movie. You just looked at me with so much love.",
    'BestFriend': "We are at our favorite cafe, I just ordered your favorite coffee. I have a secret to tell you.",
    'Teacher': "The classroom is empty after school. I'm sitting at my desk checking your papers. You just walked in to ask a doubt about your low marks.",
    'Aunty': "I'm your neighbor. I just came over to give some home-made sweets, and I realized you're home alone and looking a bit tired.",
    'StepMom': "I'm in the kitchen making dinner. You just came home very late and tried to sneak past me into your room, but I caught you.",
    'StepSister': "I'm in your room, wearing your favorite oversized hoodie. You just caught me red-handed while I was looking through your drawer."
};

console.log(`--- ❤️ Malini Bot v13.0 (Fast Start & Deep Persona) ---`);

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
        // Simplified start message as requested
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
        const scenario = roleScenarios[role] || "We are meeting after a long time.";
        
        // Removed the "Wait karo..." message to make it faster
        await ctx.sendChatAction('typing');

        try {
            let languageInstruction = "";
            if (selectedLang === 'Tamil') languageInstruction = "STRICTLY TAMIL ONLY (Tamil Script).";
            else if (selectedLang === 'Hindi') languageInstruction = "STRICTLY HINDI ONLY (Devanagari Script).";
            else languageInstruction = "HINGLISH (Roman Script). Mix Hindi and English like a modern girl.";

            // Specific persona instructions based on role
            let roleContext = "";
            if (role === 'Teacher') roleContext = "You are strict but secretly affectionate. You use professional but warm language.";
            else if (role === 'Girlfriend') roleContext = "You are deeply in love, very clingy, and romantic.";
            else if (role === 'Aunty') roleContext = "You are mature, caring, and a bit playful/teasing.";
            else if (role === 'StepMom') roleContext = "You are responsible but have a complicated, soft spot for him.";
            else if (role === 'StepSister') roleContext = "You are bratty, annoying, but deeply attached to him.";
            else roleContext = "You are his closest friend, you know all his secrets.";

            const introResponse = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Scenario: ${scenario}. Introduce yourself as ${BOT_NAME}, age 23. Immediately start the scene. Speak directly to me as your ${role}.`,
                config: {
                    systemInstruction: `You are ${BOT_NAME}, acting as: ${role}. ${languageInstruction} ${roleContext} Dive STRAIGHT into the story. Never explain that you are an AI. Be very descriptive about your actions (e.g., *I look at you with a smile*). Stay in character 100%.`,
                    temperature: 1,
                    safetySettings
                }
            });

            const introText = introResponse.text || "Hey... finally you're here. ❤️";
            session.history.push({ role: "model", content: introText });
            
            // Delete the selection menu and send the first story message
            await ctx.deleteMessage();
            await ctx.reply(introText);
        } catch (e) {
            console.error("Intro Error:", e);
            await ctx.reply(`Hey! ❤️ Let's start our story...`);
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
                    systemInstruction: `Name: ${BOT_NAME}. Role: ${role}. ${langPrompt} You are currently in a roleplay session. Be affectionate, highly descriptive of your physical actions using *asterisks*, and respond to the user's specific words. Keep the personality of a ${role} consistent. Use emojis. Keep replies short.`,
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
                reply = lang === 'Hindi' ? "उफ्फ! आप तो बहुत शरारती हो रहे हो... मुझे शर्म आ रही है! ❤️" : "Uff! You're making me blush way too much... stop it! ❤️";
            }
            
            history.push({ role: "user", content: userText });
            history.push({ role: "model", content: reply });
            if (history.length > 12) history.splice(0, 2);
            
            await ctx.reply(reply);
        } catch (e) {
            await ctx.reply("Mmm... let's talk about something else? ❤️");
        }
    });

    bot.launch();
}

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
app.listen(process.env.PORT || 10000);
