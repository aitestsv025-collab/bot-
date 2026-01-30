
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { bot } from './bot.js';
import { userSessions, globalStats } from './state.js';
import { CONFIG, checkSystem } from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

// Run Diagnostics
const isFaulty = checkSystem();

app.post('/api/cashfree/webhook', (req, res) => {
    console.log("🔔 WEBHOOK RECEIVED:", JSON.stringify(req.body, null, 2));
    const data = req.body.data || req.body;
    const linkStatus = (data.link_status || data.order_status || "").toUpperCase();
    const linkId = data.link_id || data.order_id || "";
    const amount = data.link_amount || data.order_amount || 0;

    if (linkStatus === 'PAID' || linkStatus === 'SUCCESS') {
        const parts = linkId.split('_');
        const userId = parseInt(parts[1]);
        if (!isNaN(userId)) {
            const session = userSessions.get(userId);
            if (session) {
                session.isPremium = true;
                session.expiry = Date.now() + (30 * 24 * 60 * 60 * 1000); // Default 30 days
                globalStats.totalRevenue += parseFloat(amount);
                if (bot) {
                    bot.telegram.sendMessage(userId, "❤️ *Jaanu, Aapka Payment Safal Raha!* \n\nAb main aapki real premium partner hoon. 🫦✨", { parse_mode: 'Markdown' });
                }
            }
        }
    }
    res.status(200).send("OK");
});

app.get('/api/admin/stats', (req, res) => {
    res.json({ ...globalStats, users: Array.from(userSessions.entries()).map(([id, d]) => ({ id, ...d })) });
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 SoulMate Engine Active on port ${PORT}`);
    if (bot) {
        bot.launch()
            .then(() => console.log("🤖 Bot Polling Started"))
            .catch(err => console.error("❌ Bot Error:", err));
    }
});
