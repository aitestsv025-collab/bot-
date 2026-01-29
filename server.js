
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { bot } from './bot.js';
import { userSessions, globalStats } from './state.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;

// Webhook for Cashfree (MUST match notify_url in pay.js)
app.post('/api/cashfree/webhook', (req, res) => {
    console.log("📥 Cashfree Webhook Received:", req.body);
    const { link_id, link_status, link_amount } = req.body;
    
    if (link_status === 'PAID') {
        try {
            const userId = parseInt(link_id.split('_')[1]);
            const session = userSessions.get(userId);
            if (session) {
                let days = link_amount >= 299 ? 30 : (link_amount >= 149 ? 7 : 1);
                session.isPremium = true;
                session.expiry = Date.now() + (days * 24 * 60 * 60 * 1000);
                globalStats.totalRevenue += parseFloat(link_amount);
                
                if (bot) {
                    bot.telegram.sendMessage(userId, "❤️ *Jaanu, payment mil gayi!* \n\nAb main tumhari premium partner hoon! Mere saare bold photos ab tumhare liye open hain... *mwah* 🫦🫦", { parse_mode: 'Markdown' });
                }
                console.log(`✅ User ${userId} upgraded to Premium!`);
            }
        } catch (e) { 
            console.error("❌ Webhook Process Error:", e); 
        }
    }
    res.send("OK");
});

// Admin Stats API
app.get('/api/admin/stats', (req, res) => {
    res.json({ 
        ...globalStats,
        users: Array.from(userSessions.entries()).slice(0, 50).map(([id, d]) => ({ id, ...d }))
    });
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

app.listen(PORT, () => {
    console.log(`🚀 SoulMate Engine Active on Port ${PORT}`);
    if (bot) {
        bot.launch()
            .then(() => console.log("✅ Telegram Bot Launched Successfully"))
            .catch(err => console.error("❌ Bot Launch Failed:", err.message));
    }
});
