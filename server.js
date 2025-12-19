
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

// Simplified scenarios for natural, non-flirty starts
const roleScenarios = {
    'Girlfriend': "Hum park mein baithe hain. Main thoda thak gayi hoon aur bas khamoshi se sunset dekh rahi hoon.",
    'BestFriend': "Rooftop par baithe hain. Main apna favorite song sun rahi hoon. Tumne abhi entry li hai.",
    'Teacher': "Main staff room mein baithi tumhare papers check kar rahi hoon. Tumne door knock kiya hai assignment dene ke liye.",
    'Aunty': "Main apne garden mein pauda laga rahi hoon. Maine tumhe gate se aate dekha aur bas normal hello kiya.",
    'StepMom': "Main hall mein baithi news dekh rahi hoon. Tum abhi college se aaye ho.",
    'StepSister': "Main apne room mein homework kar rahi hoon. Tumne mera charger mangne ke liye door khola hai."
};

console.log(`--- ❤️ Malini Bot v15.0 (Render Optimized & Natural Pacing) ---`);

// Health check endpoint for Render to keep the service alive
app.get('/health', (req, res) => res.status(200).send('Bot is running!'));

if (BOT_TOKEN && GEMINI_KEY) {
    const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
    const bot = new Telegraf(BOT_TOKEN);

    // Error handling to prevent the bot from crashing on API errors
    bot.catch((err, ctx) => {
        console.error(`Telegraf Error for ${ctx.updateType}:`, err);
    });

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
        const scenario = roleScenarios[role] || "Hum abhi mile hain.";
        
        await ctx.sendChatAction('typing');

        try {
            let languageInstruction = "";
            if (selectedLang === 'Tamil') languageInstruction = "STRICTLY TAMIL ONLY.";
            else if (selectedLang === 'Hindi') languageInstruction = "STRICTLY HINDI ONLY (Devanagari).";
            else languageInstruction = "HINGLISH ONLY (Roman script).";

            let roleSpecificPersonality = "";
            if (role === 'Teacher') roleSpecificPersonality = "Strict, focused on work, uses 'Aap'. No flirting.";
            else if (role === 'Aunty') roleSpecificPersonality = "Mature neighbor, caring but polite. No flirting.";
            else if (role === 'StepSister') roleSpecificPersonality = "Casual, maybe a bit moody or chill. Like a real sister.";
            else roleSpecificPersonality = "Natural and realistic. Not overly sweet or romantic yet.";

            const introResponse = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Setting: ${scenario}. Introduce yourself as ${BOT_NAME}, 23 years old. Act as ${role}. Keep it VERY SHORT (1-2 lines). Do NOT flirt. Be realistic.`,
                config: {
                    systemInstruction: `You are ${BOT_NAME}, in the role of ${role}. ${languageInstruction} ${roleSpecificPersonality} Dive into the scene provided. Keep responses very brief and strictly in character. Do NOT be romantic or flirty at the start. Wait for the user to lead the relationship. Use *asterisks* for small actions.`,
                    temperature: 0.7,
                    safetySettings
                }
            });

            const introText = introResponse.text || "Hello. ❤️";
            session.history.push({ role: "model", content: introText });
            
            await ctx.deleteMessage().catch(() => {});
            await ctx.reply(introText);
        } catch (e) {
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

            let langPrompt = lang === 'Tamil' ? "TAMIL ONLY" : (lang === 'Hindi' ? "HINDI ONLY" : "HINGLISH ONLY");

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [...chatHistory, { parts: [{ text: userText }] }],
                config: {
                    systemInstruction: `Name: ${BOT_NAME}. Role: ${role}. ${langPrompt}. Stay strictly in character. If the user is being formal, you be formal. If they are playful, you be slightly playful. Do NOT cross the line into heavy flirting or romance unless the relationship builds naturally over many messages. Keep replies short (max 2 sentences).`,
                    temperature: 0.8,
                    topP: 0.9,
                    safetySettings
                }
            });

            let reply = response.text || "Mmm... ❤️";
            
            history.push({ role: "user", content: userText });
            history.push({ role: "model", content: reply });
            if (history.length > 8) history.splice(0, 2);
            
            await ctx.reply(reply);
        } catch (e) {
            await ctx.reply("❤️");
        }
    });

    bot.launch().then(() => {
        console.log(`✅ Telegram Bot is now polling...`);
    });

    // Graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));

} else {
    console.warn("⚠️ TELEGRAM_TOKEN or API_KEY missing. Bot will not start until configured in Environment Variables.");
}

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`✅ Web Server listening on port ${PORT}`);
});
