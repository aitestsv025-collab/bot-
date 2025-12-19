
import { Telegraf, Markup } from 'telegraf';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from "@google/genai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const BOT_TOKEN = (process.env.TELEGRAM_TOKEN || "").trim();
const GEMINI_KEY = (process.env.API_KEY || "").trim(); 
const PORT = process.env.PORT || 10000;

console.log("--- BOT STATUS ---");
console.log(`TELEGRAM_TOKEN: ${BOT_TOKEN ? "OK" : "MISSING"}`);
console.log(`API_KEY: ${GEMINI_KEY ? "OK" : "MISSING"}`);
console.log("------------------");

const userSessions = new Map();

const namePools = {
    'Girlfriend': ['Riya', 'Sana', 'Ishani', 'Myra', 'Tanvi', 'Priya'],
    'BestFriend': ['Sneha', 'Anjali', 'Kritika', 'Diya', 'Tanu'],
    'Teacher': ['Ms. Sharma', 'Ms. Gupta', 'Aditi Ma\'am', 'Ms. Deshmukh', 'Neha Miss'],
    'Aunty': ['Sunita Ji', 'Meena Ji', 'Kavita Aunty', 'Rajeshwari', 'Pushpa'],
    'StepMom': ['Seema', 'Kiran', 'Rekha', 'Vandana', 'Anita'],
    'StepSister': ['Ishita', 'Ananya', 'Jhanvi', 'Khushi', 'Navya']
};

const roleScenarios = {
    'Girlfriend': "It's a quiet evening. I'm waiting for you at our favorite spot.",
    'BestFriend': "We're chilling at the cafe, just scrolling through our phones.",
    'Teacher': "I'm in the classroom finishing some grades. You just entered.",
    'Aunty': "I'm neighbor. I'm walking my dog and saw you at the gate.",
    'StepMom': "I'm in the kitchen making tea. You just came home.",
    'StepSister': "I'm in the balcony, listening to music. You just joined me."
};

const roleAppearance = {
    'Girlfriend': "a beautiful 18-19 year old Indian girl, wearing trendy casual clothes",
    'BestFriend': "a cute 18-19 year old Indian girl, wearing simple college clothes",
    'Teacher': "a professional 25 year old Indian woman, wearing a formal elegant saree and glasses",
    'Aunty': "a mature 35-40 year old Indian woman, wearing a traditional saree, graceful and homely",
    'StepMom': "a graceful 32-35 year old Indian woman, wearing simple house clothes",
    'StepSister': "a modern 20 year old Indian girl, wearing stylish western clothes"
};

function getLangInstruction(lang) {
    const emojiRules = " Use many expressive emojis.";
    switch(lang) {
        case 'Hindi': return "Use HINDI only (Devanagari). No English." + emojiRules;
        case 'Tamil': return "Use TAMIL only." + emojiRules;
        case 'English': return "Use ENGLISH only." + emojiRules;
        case 'Hinglish': return "Use natural HINGLISH (Hindi mixed with English in Roman script)." + emojiRules;
        default: return "Use Hinglish." + emojiRules;
    }
}

async function generateContextImage(ai, visualDescription, role, characterName) {
    try {
        const appearance = roleAppearance[role] || "a beautiful Indian girl";
        const prompt = `Realistic cinematic photo of ${characterName}, ${appearance}. Scene: ${visualDescription}. Natural lighting, 4k.`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: "1:1" } }
        });
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) return part.inlineData.data;
        }
    } catch (e) { console.error("Img Error"); }
    return null;
}

app.get('/health', (req, res) => res.status(200).send("Alive"));

if (BOT_TOKEN && GEMINI_KEY) {
    const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
    const bot = new Telegraf(BOT_TOKEN);

    bot.start((ctx) => {
        userSessions.delete(ctx.chat.id);
        userSessions.set(ctx.chat.id, { userName: ctx.from.first_name || "User", step: 'role_selection' });
        return ctx.reply(`Aap kisse baat karna chahenge?`, 
            Markup.inlineKeyboard([
                [Markup.button.callback('❤️ Girlfriend', 'role_Girlfriend'), Markup.button.callback('🤝 Best Friend', 'role_BestFriend')],
                [Markup.button.callback('👩‍🏫 Teacher', 'role_Teacher'), Markup.button.callback('💃 Aunty', 'role_Aunty')],
                [Markup.button.callback('🏠 Step Mom', 'role_StepMom'), Markup.button.callback('👧 Step Sister', 'role_StepSister')]
            ])
        );
    });

    bot.action(/role_(.+)/, (ctx) => {
        const selectedRole = ctx.match[1];
        const session = userSessions.get(ctx.chat.id);
        const names = namePools[selectedRole];
        const assignedName = names[Math.floor(Math.random() * names.length)];
        
        userSessions.set(ctx.chat.id, { 
            ...session,
            role: selectedRole, 
            name: assignedName,
            lang: 'Hinglish', 
            history: [] 
        });

        return ctx.editMessageText(`Bhasha chunein:`, 
            Markup.inlineKeyboard([
                [Markup.button.callback('🇬🇧 English', 'lang_English'), Markup.button.callback('🌍 Hinglish', 'lang_Hinglish')],
                [Markup.button.callback('🇮🇳 Hindi', 'lang_Hindi'), Markup.button.callback('🪔 Tamil', 'lang_Tamil')]
            ])
        );
    });

    bot.action(/lang_(.+)/, async (ctx) => {
        const session = userSessions.get(ctx.chat.id);
        if (!session) return ctx.reply("Please use /start");
        session.lang = ctx.match[1];
        const { role, name, lang, userName } = session;
        const scenario = roleScenarios[role] || "Meeting now.";
        
        await ctx.answerCbQuery();
        await ctx.sendChatAction('upload_photo');

        try {
            const languageInstruction = getLangInstruction(lang);
            const introResponse = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Setting: ${scenario}. Introduce yourself as ${name}. Act as ${role}. 1 short line.`,
                config: {
                    systemInstruction: `You are ${name}. Role: ${role}. User: ${userName}. ${languageInstruction}. 
                    CRITICAL: Use 3rd person female for actions in *asterisks*. For example, use "*muskurate hue bolti hai*" instead of "*bolti hu*". 
                    Always describe your actions/state in 3rd person present tense. Never mention AI.`,
                    temperature: 0.8
                }
            });

            const introText = introResponse.text || `Hello! I am ${name}. ❤️`;
            session.history.push({ role: "model", content: introText });
            const imageData = await generateContextImage(ai, scenario, role, name);
            if (imageData) await ctx.replyWithPhoto({ source: Buffer.from(imageData, 'base64') }, { caption: introText });
            else await ctx.reply(introText);
        } catch (e) { await ctx.reply(`I am ${name}. ❤️`); }
    });

    bot.on('text', async (ctx) => {
        const chatId = ctx.chat.id;
        const userText = ctx.message.text;
        if (!userSessions.has(chatId)) return ctx.reply("Please use /start ❤️");

        const session = userSessions.get(chatId);
        const { role, name, lang, history, userName } = session;

        try {
            await ctx.sendChatAction('upload_photo');
            const chatHistoryForAI = history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] }));
            const languageInstruction = getLangInstruction(lang);

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [...chatHistoryForAI, { parts: [{ text: userText }] }],
                config: {
                    systemInstruction: `Name: ${name}. Role: ${role}. User: ${userName}. ${languageInstruction}. 
                    CRITICAL: Describe actions in *asterisks* using 3rd person female (e.g., "*sharmate hue dekhti hai*", "*paas aati hai*", "*muskurate hue bolti hai*"). 
                    NEVER use 1st person for actions like "*bolti hu*". Max 2 lines. Stay immersive.`,
                    temperature: 0.9
                }
            });

            const reply = response.text || "Mmm... ❤️";
            const visualPromptResponse = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Context: ${reply}. 8 word photo description of ${name} acting this out.`,
            });
            const imageData = await generateContextImage(ai, visualPromptResponse.text, role, name);

            history.push({ role: "user", content: userText });
            history.push({ role: "model", content: reply });
            if (history.length > 20) history.splice(0, 2);
            
            if (imageData) await ctx.replyWithPhoto({ source: Buffer.from(imageData, 'base64') }, { caption: reply });
            else await ctx.reply(reply);
        } catch (e) { await ctx.reply("Something went wrong... ❤️"); }
    });

    bot.launch();
}

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
app.listen(PORT, () => console.log(`Server on Port ${PORT}`));
