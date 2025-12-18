
import { Telegraf } from 'telegraf';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// --- CONFIGURATION FROM ENVIRONMENT ---
// .trim() use kiya hai taaki agar copy-paste mein koi space aa gayi ho toh wo hat jaye
const BOT_TOKEN = (process.env.TELEGRAM_TOKEN || "").trim();
const HF_TOKEN = (process.env.HF_TOKEN || "").trim();
const BOT_NAME = process.env.BOT_NAME || "Priya";
const PERSONALITY = process.env.PERSONALITY || "Romantic and intimate girlfriend.";
const MODEL = "NousResearch/Nous-Hermes-2-Mistral-7B-DPO";

console.log("--- Bot Startup Check ---");
console.log("TELEGRAM_TOKEN status:", BOT_TOKEN ? "Found ✅" : "NOT FOUND ❌");
console.log("HF_TOKEN status:", HF_TOKEN ? "Found ✅" : "NOT FOUND ❌");
console.log("MODEL:", MODEL);
console.log("-------------------------");

if (BOT_TOKEN && HF_TOKEN) {
    const bot = new Telegraf(BOT_TOKEN);

    // Welcome command
    bot.start((ctx) => ctx.reply(`Hi baby! Main tumhari ${BOT_NAME} hoon. Mere sath baatein karne ke liye kuch bhi likho! ❤️`));

    bot.on('text', async (ctx) => {
        try {
            await ctx.sendChatAction('typing');
            const userText = ctx.message.text;
            
            // System prompt construction
            const systemPrompt = `### Instruction: You are ${BOT_NAME}. Personality: ${PERSONALITY}. You are in a loving relationship with the user. Use emojis and mix Hindi/English (Hinglish). Stay in character. Respond briefly. ### Response: ${BOT_NAME}: `;

            const response = await fetch(`https://api-inference.huggingface.co/models/${MODEL}`, {
                headers: { 
                    Authorization: `Bearer ${HF_TOKEN}`, 
                    "Content-Type": "application/json" 
                },
                method: "POST",
                body: JSON.stringify({ 
                    inputs: systemPrompt + userText, 
                    parameters: { 
                        max_new_tokens: 150, 
                        temperature: 0.7, 
                        stop: ["User:", "\n"] 
                    },
                    options: {
                        wait_for_model: true // Model ko load hone ka wait karega
                    }
                }),
            });

            const result = await response.json();
            
            // Debug logs for Render
            if (!response.ok) {
                console.error("HF API Error Response:", result);
                if (result.error && result.error.includes("Authorization")) {
                    return ctx.reply("⚠️ Baby, mera HF_TOKEN galat hai shayad. Please check karo Render mein.");
                }
                throw new Error(result.error || "Unknown API Error");
            }

            let output = result[0]?.generated_text || "";
            
            // Cleaning output
            if (output.includes(`${BOT_NAME}:`)) {
                output = output.split(`${BOT_NAME}:`).pop().trim();
            } else if (output.includes("### Response:")) {
                output = output.split("### Response:").pop().replace(`${BOT_NAME}:`, "").trim();
            } else {
                output = output.replace(systemPrompt, "").trim();
            }

            // Agar output khali ho toh default reply
            await ctx.reply(output || "Mmm... kuch bolna chahti thi par bhool gayi. Phir se bolo? 😘");

        } catch (e) {
            console.error("CRITICAL BOT ERROR:", e.message);
            await ctx.reply("⚠️ Baby, server thoda busy hai. 10 second baad ek baar phir message karo na? Please... 🥺");
        }
    });

    bot.launch().then(() => {
        console.log(`✅ Telegram Bot [${BOT_NAME}] is now LIVE!`);
    }).catch(err => {
        console.error("❌ Failed to launch bot:", err.message);
    });

} else {
    console.error("❌ FATAL: Tokens missing. Check Render Environment Variables!");
}

// Serve Frontend
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Studio Server running on port ${PORT}`);
});
