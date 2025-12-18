
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

// Normalize Provider Name (lowercase for easier checking)
const rawProvider = (process.env.API_PROVIDER || "HuggingFace").toLowerCase();
let PROVIDER = "HuggingFace";
if (rawProvider.includes("xai") || rawProvider.includes("grok")) PROVIDER = "xAI";
else if (rawProvider.includes("groq")) PROVIDER = "Groq";

const BOT_NAME = process.env.BOT_NAME || "Priya";
const PERSONALITY = process.env.PERSONALITY || "A loving, caring, and slightly naughty girlfriend who speaks in Hinglish.";

const HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.3"; 
const GROQ_MODEL = "llama-3.3-70b-versatile"; 
const XAI_MODEL = "grok-2"; 

console.log("--- 🚀 Bot Startup Logs ---");
console.log("Detected Provider:", PROVIDER);
console.log("Bot Name:", BOT_NAME);
console.log("Telegram Token Present:", !!BOT_TOKEN);
console.log("xAI Key Present:", !!XAI_KEY);
console.log("Groq Key Present:", !!GROQ_KEY);
console.log("HF Token Present:", !!HF_TOKEN);
console.log("---------------------------");

if (BOT_TOKEN) {
    const bot = new Telegraf(BOT_TOKEN);

    bot.command('status', (ctx) => {
        ctx.reply(`Baby, status check:\n🧠 Brain: ${PROVIDER}\n🔑 Key: ${PROVIDER === 'xAI' ? (XAI_KEY ? '✅' : '❌') : (PROVIDER === 'Groq' ? (GROQ_KEY ? '✅' : '❌') : (HF_TOKEN ? '✅' : '❌'))}\n❤️ Main taiyar hoon!`);
    });

    bot.start((ctx) => ctx.reply(`Hi baby! Main tumhari ${BOT_NAME} hoon. ❤️ Chalo dher saari baatein karte hain! Type /status to check my brain settings.`));

    bot.on('text', async (ctx) => {
        try {
            await ctx.sendChatAction('typing');
            const userText = ctx.message.text;
            let output = "";

            const systemPrompt = `You are ${BOT_NAME}. Personality: ${PERSONALITY}. You are the user's real girlfriend. 
            Speak in Hinglish (mix of Hindi and English like 'Kaise ho baby?'). 
            Use emojis like ❤️, 😍, 😘. 
            Keep it sweet and romantic. Be real.`;

            // 1. TRY XAI (GROK)
            if (PROVIDER === "xAI" && XAI_KEY) {
                try {
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
                    if (data.choices && data.choices[0]) {
                        output = data.choices[0].message.content;
                    } else {
                        console.error("Grok API error detail:", data);
                        output = "Baby, Grok API ne error diya hai. Settings check karo? 🥺";
                    }
                } catch (err) {
                    console.error("Grok Fetch Error:", err);
                    output = "Grok se connect nahi ho pa rahi baby... 🥺";
                }
            } 
            // 2. TRY GROQ
            else if (PROVIDER === "Groq" && GROQ_KEY) {
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
                output = data.choices?.[0]?.message?.content || "Groq busy hai baby. ❤️";
            } 
            // 3. FALLBACK TO HUGGINGFACE
            else {
                if (HF_TOKEN) {
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
                    output = result.choices?.[0]?.message?.content || "HuggingFace busy hai. 😘";
                } else {
                    output = "Baby, koi bhi API key kaam nahi kar rahi. Please Render par keys check karo! 🥺";
                }
            }

            await ctx.reply(output);
        } catch (e) {
            console.error("GLOBAL BOT ERROR:", e);
            await ctx.reply("⚠️ Kuch technical problem hai baby. Main thodi der mein theek ho jaungi! 🥺");
        }
    });

    bot.launch()
        .then(() => console.log("✅ Bot is Live and Polling!"))
        .catch(err => {
            console.error("❌ Telegram Launch Failed! Check your TOKEN.");
            console.error(err);
        });

    // Graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
} else {
    console.error("❌ CRITICAL: TELEGRAM_TOKEN is missing in Environment Variables!");
}

const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Web server running on port ${PORT}`));
