
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

const roleScenarios = {
    'Girlfriend': "It's a quiet evening. I'm waiting for you at our favorite spot.",
    'BestFriend': "We're chilling at the cafe, just scrolling through our phones.",
    'Teacher': "I'm in the classroom finishing some grades. You just entered.",
    'Aunty': "I'm neighbor. I'm walking my dog and saw you at the gate.",
    'StepMom': "I'm in the kitchen making tea. You just came home.",
    'StepSister': "I'm in the balcony, listening to music. You just joined me."
};

// Helper to get strict language instructions
function getLangInstruction(lang) {
    switch(lang) {
        case 'Hindi': return "STRICTLY use HINDI language only (Devanagari script). Do NOT use English words.";
        case 'Tamil': return "STRICTLY use TAMIL language only (Tamil script). Do NOT use English words.";
        case 'English': return "STRICTLY use ENGLISH language only. Do NOT use any Hindi or other language words.";
        case 'Hinglish': return "Use HINGLISH (Hindi words written in Roman/English script). Mix of Hindi and English like common chats.";
        default: return "Use English.";
    }
}

// Helper function to generate an image based on the context
async function generateContextImage(ai, prompt) {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: `A realistic, high-quality cinematic photo of a 23-year-old Indian girl named ${BOT_NAME} in this situation: ${prompt}. Natural lighting, focus on her expression, soft background.` }] },
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

console.log(`--- ❤️ Malini Bot v17.0 (Strict Language + Image) ---`);

app.get('/health', (req, res) => res.status(200).send('Bot is active.'));

if (BOT_TOKEN && GEMINI_KEY) {
    const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
    const bot = new Telegraf(BOT_TOKEN);

    bot.catch((err) => console.error(`Telegraf Error:`, err));

    const safetySettings = [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' }
    ];

    bot.start((ctx) => {
        userSessions.delete(ctx.chat.id);
        return ctx.reply(`Welcome! Select a role for ${BOT_NAME}:`, 
            Markup.inlineKeyboard([
                [Markup.button.callback('❤️ Girlfriend', 'role_Girlfriend'), Markup.button.callback('🤝 Best Friend', 'role_BestFriend')],
                [Markup.button.callback('👩‍🏫 Teacher', 'role_Teacher'), Markup.button.callback('💃 Aunty', 'role_Aunty')],
                [Markup.button.callback('🏠 Step Mom', 'role_StepMom'), Markup.button.callback('👧 Step Sister', 'role_StepSister')]
            ])
        );
    });

    bot.action(/role_(.+)/, (ctx) => {
        const selectedRole = ctx.match[1];
        userSessions.set(ctx.chat.id, { role: selectedRole, lang: 'English', history: [] });
        return ctx.editMessageText(`Select Language / Bhasha chunein:`, 
            Markup.inlineKeyboard([
                [Markup.button.callback('🇬🇧 English', 'lang_English'), Markup.button.callback('🌍 Hinglish', 'lang_Hinglish')],
                [Markup.button.callback('🇮🇳 Hindi', 'lang_Hindi'), Markup.button.callback('🪔 Tamil', 'lang_Tamil')]
            ])
        );
    });

    bot.action(/lang_(.+)/, async (ctx) => {
        const session = userSessions.get(ctx.chat.id);
        const selectedLang = ctx.match[1];
        if (session) session.lang = selectedLang;
        
        const role = session?.role || 'Girlfriend';
        const scenario = roleScenarios[role] || "We just met.";
        
        await ctx.answerCbQuery("Starting scene...");
        await ctx.sendChatAction('upload_photo');

        try {
            const languageInstruction = getLangInstruction(selectedLang);

            const introResponse = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Setting: ${scenario}. Introduce yourself as ${BOT_NAME}. Act as ${role}. 1 short line only. NO FLIRTING.`,
                config: {
                    systemInstruction: `You are ${BOT_NAME}. Role: ${role}. ${languageInstruction} Keep it realistic and very short. No romance at the start. Use *asterisks* for actions.`,
                    temperature: 0.7,
                    safetySettings
                }
            });

            const introText = introResponse.text || "Hey.";
            session.history.push({ role: "model", content: introText });

            const imageData = await generateContextImage(ai, `${role} in ${scenario}`);
            
            await ctx.deleteMessage().catch(() => {});
            if (imageData) {
                await ctx.replyWithPhoto({ source: Buffer.from(imageData, 'base64') }, { caption: introText });
            } else {
                await ctx.reply(introText);
            }
        } catch (e) {
            await ctx.reply(`Hi there. ❤️`);
        }
    });

    bot.on('text', async (ctx) => {
        const chatId = ctx.chat.id;
        const userText = ctx.message.text;

        if (!userSessions.has(chatId)) {
            userSessions.set(chatId, { role: 'Girlfriend', lang: 'English', history: [] });
        }

        const session = userSessions.get(chatId);
        const { role, lang, history } = session;

        try {
            await ctx.sendChatAction('upload_photo');

            const chatHistory = history.map(h => ({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: h.content }]
            }));

            const languageInstruction = getLangInstruction(lang);

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [...chatHistory, { parts: [{ text: userText }] }],
                config: {
                    systemInstruction: `Name: ${BOT_NAME}. Role: ${role}. ${languageInstruction} Stay strictly in character. Response must be very short (max 1-2 lines). Do not flirt unless it feels natural after long talk. Use *asterisks* for actions.`,
                    temperature: 0.8,
                    safetySettings
                }
            });

            const reply = response.text || "Mmm... ❤️";
            const imageData = await generateContextImage(ai, `${role} responding to: ${userText}. She looks ${role === 'Girlfriend' ? 'sweet' : 'normal'}.`);

            history.push({ role: "user", content: userText });
            history.push({ role: "model", content: reply });
            if (history.length > 10) history.splice(0, 2);
            
            if (imageData) {
                await ctx.replyWithPhoto({ source: Buffer.from(imageData, 'base64') }, { caption: reply });
            } else {
                await ctx.reply(reply);
            }
        } catch (e) {
            await ctx.reply("❤️");
        }
    });

    bot.launch().then(() => console.log(`✅ LIVE WITH STRICT LANGUAGE SUPPORT!`));
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));

} else {
    console.error("KEYS MISSING: Set TELEGRAM_TOKEN and API_KEY in Render Dashboard.");
}

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
app.listen(process.env.PORT || 10000);
