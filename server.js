
import 'dotenv/config'; 
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { bot } from './bot.js';
import { userSessions, globalStats } from './state.js';
import { CONFIG, checkSystem } from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

// Run Diagnostics on boot
checkSystem();

// Webhook for Cashfree Production
app.post('/api/cashfree/webhook', (req, res) => {
    console.log("💰 WEBHOOK RECEIVED:", JSON.stringify(req.body, null, 2));
    
    // Cashfree sends data either in body or body.data
    const data = req.body.data || req.body;
    const order = data.order || {};
    const link = data.link || {};
    
    const status = (data.payment_status || order.order_status || data.link_status || "").toUpperCase();
    const linkId = data.link_id || order.order_id || "";
    const amount = data.link_amount || order.order_amount || 0;

    if (status === 'SUCCESS' || status === 'PAID') {
        // ID format: L_USERID_TIMESTAMP
        const parts = linkId.split('_');
        const userId = parseInt(parts[1]);
        
        if (!isNaN(userId)) {
            console.log(`✅ Payment Successful for User ${userId}. Amount: ₹${amount}`);
            const session = userSessions.get(userId);
            if (session) {
                session.isPremium = true;
                // Add 30 days of premium
                session.expiry = Date.now() + (30 * 24 * 60 * 60 * 1000); 
                
                globalStats.totalRevenue += parseFloat(amount);
                globalStats.totalTransactions++;

                if (bot) {
                    bot.telegram.sendMessage(userId, "❤️ <b>Jaanu, Aapka Payment Safal Raha!</b>\n\nAb main aapki real premium partner hoon. Ab aap mujhse kuch bhi puch sakte ho aur main unlimited sexy photos bhi bhejungi... 🫦✨", { parse_mode: 'HTML' });
                }
            }
        }
    }
    res.status(200).send("OK");
});

app.get('/api/admin/stats', (req, res) => {
    res.json({ 
        ...globalStats, 
        mode: CONFIG.CASHFREE_MODE,
        users: Array.from(userSessions.entries()).map(([id, d]) => ({ id, ...d })) 
    });
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 SoulMate Production Engine Active on port ${PORT}`);
    if (bot) {
        bot.launch()
            .then(() => console.log("🤖 Bot Polling Started (PROD MODE)"))
            .catch(err => console.error("❌ Bot Launch Error:", err));
    }
});
