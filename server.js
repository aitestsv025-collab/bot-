
import { Telegraf } from 'telegraf';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// --- CONFIGURATION FROM ENVIRONMENT ---
const BOT_TOKEN = (process.env.TELEGRAM_TOKEN || "").trim();
const HF_TOKEN = (process.env.HF_TOKEN || "").trim();
const BOT_NAME = process.env.BOT_NAME || "Priya";
const PERSONALITY = process.env.PERSONALITY || "Romantic and intimate girlfriend.";
// Mistral 7B v0.3 is very stable for this new endpoint
const MODEL = "mistralai/Mistral-7B-Instruct-v0.3"; 

console.log("--- Bot Startup Check ---");
console.log("TELEGRAM_TOKEN status:", BOT_TOKEN ? "Found ✅" : "NOT FOUND ❌");
console.log("HF_TOKEN status:", HF_TOKEN ? "Found ✅" : "NOT FOUND ❌");
console.log("MODEL:", MODEL);
console.log("-------------------------");

if (BOT_TOKEN && HF_TOKEN) {
    const bot = new Telegraf(BOT_TOKEN);

    bot.start((ctx) => ctx.reply(`Hi baby! Main tumhari ${BOT_NAME} hoon. ❤️ Maine suna tum mujhe yaad kar rahe the?`));

    bot.on('text', async (ctx) => {
        try {
            await ctx.sendChatAction('typing');
            const userText = ctx.message.text;
            
            // NEW ROUTER ENDPOINT (As suggested by your logs)
            // This is the OpenAI-compatible format for Hugging Face Router
            const response = await fetch(`https://router.huggingface.co/v1/chat/completions`, {
                headers: { 
                    Authorization: `Bearer ${HF_TOKEN}`, 
                    "Content-Type": "application/json" 
                },
                method: "POST",
                body: JSON.stringify({ 
                    model: MODEL,
                    messages: [
                        { 
                            role: "system", 
                            content: `You are ${BOT_NAME}. Personality: ${PERSONALITY}. You are the user's girlfriend. Mix Hindi and English (Hinglish). Use emojis. Be loving, romantic, and stay in character. Respond concisely.` 
                        },
                        { role: "user", content: userText }
                    ],
                    max_tokens: 250,
                    temperature: 0.8
                }),
            });

            const result = await response.json();
            
            if (!response.ok) {
                console.error("HF Router Error Response:", result);
                if (result.error && result.error.message) {
                  throw new Error(result.error.message);
                }
                throw new Error("API call failed");
            }

            const output = result.choices?.[0]?.message?.content || "Mmm... baby, signal thode weak hain. Kya kaha tumne? 😘";
            await ctx.reply(output);

        } catch (e) {
            console.error("CRITICAL BOT ERROR:", e.message);
            await ctx.reply("⚠️ Baby, mera dimag thoda garam (server busy) ho gaya hai. 10 second ruk kar phir se message karo na? 🥺");
        }
    });

    bot.launch().then(() => {
        console.log(`✅ Telegram Bot [${BOT_NAME}] is LIVE on the NEW Router!`);
    }).catch(err => {
        console.error("❌ Failed to launch bot:", err.message);
    });

} else {
    console.error("❌ FATAL: Tokens missing in Environment Variables!");
}

const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server on port ${PORT}`));
