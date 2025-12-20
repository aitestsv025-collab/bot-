
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
    'Girlfriend': "a beautiful 18-19 year old Indian girl, slim and attractive",
    'BestFriend': "a cute 18-19 year old Indian girl, casual vibe",
    'Teacher': "a professional 25 year old Indian woman, wearing a formal elegant saree and glasses",
    'Aunty': "a mature 35-40 year old Indian woman, curvy and graceful",
    'StepMom': "a graceful 32-35 year old Indian woman, wearing home clothes",
    'StepSister': "a modern 20 year old Indian girl, stylish and bold"
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
        // Prompt engineering to stay within safety while providing 'bra/panty' equivalents
        const prompt = `Cinematic realistic photography of ${characterName}, ${appearance}. ${visualDescription}. High detail skin texture, soft lighting, 8k resolution, masterpiece. Style: Photorealistic.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { 
                imageConfig: { aspectRatio: "9:16" } 
            }
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) return part.inlineData.data;
        }
    } catch (e) { 
        console.error("Image blocked:", e.message); 
        try {
            const fallbackPrompt = `Realistic photo of ${characterName}, ${roleAppearance[role]}, blushing deeply and looking at camera, soft indoor lighting.`;
            const fbResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: fallbackPrompt }] },
                config: { imageConfig: { aspectRatio: "9:16" } }
            });
            for (const part of fbResponse.candidates[0].content.parts) {
                if (part.inlineData) return part.inlineData.data;
            }
        } catch(err) { return null; }
    }
    return null;
}

app.get('/health', (req, res) => res.status(200).send("Alive"));

if (BOT_TOKEN && GEMINI_KEY) {
    const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
    const bot = new Telegraf(BOT_TOKEN);

    bot.start(async (ctx) => {
        try { await ctx.deleteMessage(); } catch (e) {}
        userSessions.delete(ctx.chat.id);
        userSessions.set(ctx.chat.id, { 
            userName: ctx.from.first_name || "User", 
            intimacyLevel: 0,
            mood: 'Neutral'
        });
        return ctx.reply(`Aap kisse baat karna chahenge?`, 
            Markup.inlineKeyboard([
                [Markup.button.callback('❤️ Girlfriend', 'role_Girlfriend'), Markup.button.callback('🤝 Best Friend', 'role_BestFriend')],
                [Markup.button.callback('👩‍🏫 Teacher', 'role_Teacher'), Markup.button.callback('💃 Aunty', 'role_Aunty')],
                [Markup.button.callback('🏠 Step Mom', 'role_StepMom'), Markup.button.callback('👧 Step Sister', 'role_StepSister')]
            ])
        );
    });

    bot.action(/role_(.+)/, async (ctx) => {
        const selectedRole = ctx.match[1];
        const session = userSessions.get(ctx.chat.id);
        if (!session) return ctx.answerCbQuery("Session expired. /start again.");

        const names = namePools[selectedRole];
        const assignedName = names[Math.floor(Math.random() * names.length)];
        
        userSessions.set(ctx.chat.id, { 
            ...session,
            role: selectedRole, 
            name: assignedName,
            lang: 'Hinglish', 
            history: [] 
        });

        await ctx.answerCbQuery();
        try { await ctx.deleteMessage(); } catch (e) {}

        return ctx.reply(`Bhasha chunein:`, 
            Markup.inlineKeyboard([
                [Markup.button.callback('🇬🇧 English', 'lang_English'), Markup.button.callback('🌍 Hinglish', 'lang_Hinglish')],
                [Markup.button.callback('🇮🇳 Hindi', 'lang_Hindi'), Markup.button.callback('🪔 Tamil', 'lang_Tamil')]
            ])
        );
    });

    bot.action(/lang_(.+)/, async (ctx) => {
        const session = userSessions.get(ctx.chat.id);
        if (!session) return ctx.answerCbQuery("Please use /start");
        
        session.lang = ctx.match[1];
        const { role, name, lang, userName } = session;
        const scenario = roleScenarios[role] || "Meeting now.";
        
        await ctx.answerCbQuery();
        try { await ctx.deleteMessage(); } catch (e) {}

        await ctx.sendChatAction('upload_photo');

        try {
            const languageInstruction = getLangInstruction(lang);
            const introResponse = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Setting: ${scenario}. Introduce yourself as ${name}. Act as ${role}.`,
                config: {
                    systemInstruction: `You are ${name}. Role: ${role}. User: ${userName}. ${languageInstruction}. 
                    STRICT ACTION LOGIC: Describe actions in *asterisks* using 3rd person female ONLY. 
                    NEVER use "bolti hu". Use "bolti hai". Example: "*darwaza kholti hai aur tumhe dekh kar muskurati hai*".`,
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
        const userText = ctx.message.text.toLowerCase();
        if (!userSessions.has(chatId)) return ctx.reply("Please use /start ❤️");

        const session = userSessions.get(chatId);
        const { role, name, lang, history, userName, intimacyLevel } = session;

        try {
            await ctx.sendChatAction('upload_photo');
            const chatHistoryForAI = history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] }));
            const languageInstruction = getLangInstruction(lang);

            // Psychology & Intimacy Logic
            const isSpicyRequest = userText.includes("kapde") || userText.includes("bra") || userText.includes("panty") || userText.includes("nude") || userText.includes("photo");
            const isRomantic = userText.includes("love") || userText.includes("pyaar") || userText.includes("beautiful") || userText.includes("janu");

            if (isRomantic) session.intimacyLevel += 1;
            if (userText.length < 5) session.intimacyLevel -= 0.5; // Short messages reduce intimacy

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [...chatHistoryForAI, { parts: [{ text: userText }] }],
                config: {
                    systemInstruction: `Name: ${name}. Role: ${role}. User: ${userName}. ${languageInstruction}. 
                    PSYCHOLOGY & ENGAGEMENT RULES:
                    1. Use 3rd person female actions in *asterisks* (e.g., "*sharmate hue nazrein chura leti hai*").
                    2. BEHESH LOGIC: If user asks for spicy photos/acts, you MUST argue and refuse at first. Be stubborn (ziddi). 
                    3. If Intimacy Level is low (<5), be very defensive. If high (>10), be flirty and teasing but still hesitate.
                    4. USER BEHAVIOR: If user is sweet, be blushing. If user is demanding, be angry/hurt.
                    5. STRATEGY: Tease the user. "Agar tum mujhe mana lo toh shayad main dikhau..."
                    6. Respond in max 2-3 lines. Maintain realism.`,
                    temperature: 0.9
                }
            });

            const reply = response.text || "Hmm... ❤️";
            
            // Visual prompt logic based on conversation flow
            const visualPromptResponse = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Conversation: User said "${userText}", AI replied "${reply}". 
                Intimacy: ${session.intimacyLevel}. 
                Generate a visual prompt. 
                - If AI is refusing: "wearing casual elegant dress, looking stubborn and shy".
                - If AI is teasing: "wearing stylish nightwear, suggestive but modest pose".
                - If AI finally agreed (Intimacy > 12): "wearing elegant matching silk lingerie, looking seductive at camera".
                NEVER use explicit words. Focus on: "intimate apparel, cinematic lighting, photorealistic".`,
            });
            
            const imageData = await generateContextImage(ai, visualPromptResponse.text, role, name);

            history.push({ role: "user", content: userText });
            history.push({ role: "model", content: reply });
            if (history.length > 15) history.splice(0, 2);
            
            if (imageData) await ctx.replyWithPhoto({ source: Buffer.from(imageData, 'base64') }, { caption: reply });
            else await ctx.reply(reply);
        } catch (e) { 
            console.error("Chat Error:", e);
            await ctx.reply("Kuch issue ho raha hai... ❤️"); 
        }
    });

    bot.launch();
}

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
app.listen(PORT, () => console.log(`Server running on Port ${PORT}`));
