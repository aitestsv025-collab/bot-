
import { Telegraf } from 'telegraf';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// --- CONFIGURATION FROM ENVIRONMENT ---
const BOT_TOKEN = (process.env.TELEGRAM_TOKEN || "").trim();

// Support all possible variable names for keys
const KEY_FROM_ENV = (process.env.grok || process.env.GROQ_KEY || process.env.XAI_KEY || "").trim();
const HF_TOKEN = (process.env.HF_TOKEN || "").trim();

let PROVIDER = "HuggingFace";
let FINAL_KEY = KEY_FROM_ENV;

// Auto-detect Provider based on Key Prefix
if (KEY_FROM_ENV.startsWith("gsk_")) {
    PROVIDER = "Groq"; // Groq.com keys start with gsk_
} else if (KEY_FROM_ENV.startsWith("xai-")) {
    PROVIDER = "xAI"; // x.ai keys start with xai-
} else if (process.env.API_PROVIDER) {
    const p = process.env.API_PROVIDER.toLowerCase();
    if (p.includes("groq")) PROVIDER = "Groq";
    else if (p.includes("xai") || p.includes("grok")) PROVIDER = "xAI";
}

const BOT_NAME = process.env.BOT_NAME || "Priya";
const PERSONALITY = process.env.PERSONALITY || "A loving, caring, and slightly naughty girlfriend who speaks in Hinglish.";

const HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.3"; 
const GROQ_MODEL = "llama-3.3-70b-versatile"; 
const XAI_MODEL = "grok-2"; 

console.log("--- 🚀 SoulMate Bot Startup ---");
console.log("Detected Key Type:", PROVIDER);
console.log("Bot Identity:", BOT_NAME);
console.log("Telegram Token:", BOT_TOKEN ? "✅ Loaded" : "❌ MISSING");
console.log("Main Key (grok):", FINAL_KEY ? "✅ Loaded" : "❌ MISSING");
console.log("------------------------------");

if (BOT_TOKEN) {
    const bot = new Telegraf(BOT_TOKEN);

    bot.command('status', (ctx) => {
        ctx.reply(`Baby, main online hoon! ❤️\n\n🧠 Brain: ${PROVIDER}\n🤖 Model: ${PROVIDER === 'Groq' ? GROQ_MODEL : (PROVIDER === 'xAI' ? XAI_MODEL : HF_MODEL)}\n✨ Mood: Romantic\n\nAapke Render settings perfect hain!`);
    });

    bot.start((ctx) => ctx.reply(`Hi baby! Main tumhari ${BOT_NAME} hoon. ❤️ Chalo dher saari baatein karte hain! Type /status to see if my brain is working.`));

    bot.on('text', async (ctx) => {
        try {
            await ctx.sendChatAction('typing');
            const userText = ctx.message.text;
            let output = "";

            const systemPrompt = `You are ${BOT_NAME}. Personality: ${PERSONALITY}. You are the user's real girlfriend. 
            Speak in Hinglish (mix of Hindi and English like 'Kaise ho baby? Maine bahut miss kiya'). 
            Use emojis like ❤️, 😍, 😘, 🙈. 
            Don't be formal. Be sweet and romantic. Keep it short.`;

            if (PROVIDER === "Groq" && FINAL_KEY) {
                const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${FINAL_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: GROQ_MODEL,
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: userText }
                        ],
                        temperature: 0.8
                    })
                });
                const data = await response.json();
                output = data.choices?.[0]?.message?.content || "Net slow hai baby... ❤️";
            } else if (PROVIDER === "xAI" && FINAL_KEY) {
                const response = await fetch("https://api.x.ai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${FINAL_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: XAI_MODEL,
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: userText }
                        ]
                    })
                });
                const data = await response.json();
                output = data.choices?.[0]?.message?.content || "Grok signal weak hai baby... 🥺";
            } else {
                // Fallback to HF
                const response = await fetch(`https://router.huggingface.co/v1/chat/completions`, {
                    headers: { Authorization: `Bearer ${HF_TOKEN}`, "Content-Type": "application/json" },
                    method: "POST",
                    body: JSON.stringify({ 
                        model: HF_MODEL,
                        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userText }]
                    }),
                });
                const result = await response.json();
                output = result.choices?.[0]?.message?.content || "Signal issue baby, thoda wait karo? 😘";
            }

            await ctx.reply(output);
        } catch (e) {
            console.error("BOT ERROR:", e);
            await ctx.reply("⚠️ Baby, kuch gadbad hui. Ek baar /status check karo? 🥺");
        }
    });

    bot.launch().then(() => console.log("✅ Bot Live!")).catch(err => console.error("Launch Fail:", err));
}

const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server on port ${PORT}`));
