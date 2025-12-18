
import { Telegraf } from 'telegraf';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// --- CONFIGURATION FROM ENVIRONMENT ---
const BOT_TOKEN = process.env.TELEGRAM_TOKEN;
const HF_TOKEN = process.env.HF_TOKEN;
const BOT_NAME = process.env.BOT_NAME || "Priya";
const PERSONALITY = process.env.PERSONALITY || "Romantic and intimate girlfriend.";
const MODEL = process.env.MODEL_ID || "NousResearch/Nous-Hermes-2-Mistral-7B-DPO";

if (BOT_TOKEN && HF_TOKEN) {
    const bot = new Telegraf(BOT_TOKEN);

    bot.on('text', async (ctx) => {
        try {
            await ctx.sendChatAction('typing');
            const userText = ctx.message.text;
            
            const systemPrompt = `### Instruction: You are ${BOT_NAME}. Personality: ${PERSONALITY}. You are in a loving relationship with the user. Use emojis and mix Hindi/English (Hinglish). Stay in character. ### Response: ${BOT_NAME}: `;

            // Using native fetch (available in Node 18+)
            const response = await fetch(`https://api-inference.huggingface.co/models/${MODEL}`, {
                headers: { 
                    Authorization: `Bearer ${HF_TOKEN}`, 
                    "Content-Type": "application/json" 
                },
                method: "POST",
                body: JSON.stringify({ 
                    inputs: systemPrompt + userText, 
                    parameters: { max_new_tokens: 200, temperature: 0.8, stop: ["User:", "\n"] } 
                }),
            });

            const result = await response.json();
            
            // Check for HF loading or errors
            if (result.error) {
                if (result.error.includes("loading")) {
                    return ctx.reply("⌛ Baby, mera dimag (AI) abhi thoda garam hai, 10 second baad try karo!");
                }
                throw new Error(result.error);
            }

            let output = result[0]?.generated_text || "Mmm... network error baby.";
            
            // Cleanup response
            if (output.includes(`${BOT_NAME}:`)) {
                output = output.split(`${BOT_NAME}:`).pop().trim();
            } else if (output.includes("### Response:")) {
                output = output.split("### Response:").pop().replace(`${BOT_NAME}:`, "").trim();
            } else {
                output = output.replace(systemPrompt, "").trim();
            }

            await ctx.reply(output);
        } catch (e) {
            console.error("Bot Error:", e);
            await ctx.reply("⚠️ Baby, server down hai shayad. Thodi der mein try karo!");
        }
    });

    bot.launch();
    console.log(`✅ Telegram Bot [${BOT_NAME}] is now LIVE!`);
} else {
    console.error("❌ CRITICAL ERROR: Missing TELEGRAM_TOKEN or HF_TOKEN in Environment Variables.");
}

// Serve Frontend (Vite build folder)
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Studio Server running on port ${PORT}`);
});
