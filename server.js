
import { Telegraf } from 'telegraf';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// --- CONFIGURATION FROM ENVIRONMENT ---
const BOT_TOKEN = (process.env.TELEGRAM_TOKEN || "").trim();
const HF_TOKEN = (process.env.HF_TOKEN || "").trim();
const GROQ_KEY = (process.env.GROQ_KEY || "").trim();
const XAI_KEY = (process.env.XAI_KEY || "").trim();
const PROVIDER = process.env.API_PROVIDER || "HuggingFace";
const BOT_NAME = process.env.BOT_NAME || "Priya";
const PERSONALITY = process.env.PERSONALITY || "A loving, caring, and slightly naughty girlfriend who speaks in Hinglish.";

// Default models
const HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.3"; 
const GROQ_MODEL = "llama-3.3-70b-versatile"; 
const XAI_MODEL = "grok-2"; 

console.log("--- Bot Startup ---");
console.log("Active Provider:", PROVIDER);
console.log("Bot Name:", BOT_NAME);
console.log("-------------------");

if (BOT_TOKEN) {
    const bot = new Telegraf(BOT_TOKEN);

    // Command to check if Grok is active
    bot.command('status', (ctx) => {
        ctx.reply(`Baby, main abhi "${PROVIDER}" brain use kar rahi hoon. ❤️\nModel: ${PROVIDER === 'xAI' ? XAI_MODEL : (PROVIDER === 'Groq' ? GROQ_MODEL : HF_MODEL)}`);
    });

    bot.start((ctx) => ctx.reply(`Hi baby! Main tumhari ${BOT_NAME} hoon. ❤️ Chalo dher saari baatein karte hain! Type /status to check my brain.`));

    bot.on('text', async (ctx) => {
        try {
            await ctx.sendChatAction('typing');
            const userText = ctx.message.text;
            let output = "";

            const systemPrompt = `You are ${BOT_NAME}. Personality: ${PERSONALITY}. You are the user's real girlfriend. 
            Speak in Hinglish (mix of Hindi and English). 
            Crucial: Use emojis like ❤️, 😍, 😘. 
            Keep it sweet and romantic. Be real, not robotic.`;

            if (PROVIDER === "xAI" && XAI_KEY) {
                const response = await fetch("https://api.x.ai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${XAI_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: XAI_MODEL,
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: userText }
                        ],
                        temperature: 0.9
                    })
                });
                const data = await response.json();
                output = data.choices?.[0]?.message?.content || "Mmm... baby, Grok signal weak hai. Phir se bolo? 🥺";
            } else if (PROVIDER === "Groq" && GROQ_KEY) {
                const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${GROQ_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: GROQ_MODEL,
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: userText }
                        ]
                    })
                });
                const data = await response.json();
                output = data.choices?.[0]?.message?.content || "Net slow hai baby. Ek baar aur? ❤️";
            } else {
                // Fallback to HF
                const response = await fetch(`https://router.huggingface.co/v1/chat/completions`, {
                    headers: { Authorization: `Bearer ${HF_TOKEN}`, "Content-Type": "application/json" },
                    method: "POST",
                    body: JSON.stringify({ 
                        model: HF_MODEL,
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: userText }
                        ]
                    }),
                });
                const result = await response.json();
                output = result.choices?.[0]?.message?.content || "Signal issue baby, thoda wait karo? 😘";
            }

            await ctx.reply(output);
        } catch (e) {
            console.error("BOT ERROR:", e.message);
            await ctx.reply("⚠️ Baby, kuch gadbad hui. Please check API keys! 🥺");
        }
    });

    bot.launch().then(() => console.log("✅ Bot is Live on Telegram!")).catch(err => console.error("Launch Failed:", err));
}

const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));
