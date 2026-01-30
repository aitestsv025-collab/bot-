
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { bot } from './bot.js';
import { userSessions, globalStats } from './state.js';
import { CONFIG } from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

// Enhanced Webhook for Production
app.post('/api/cashfree/webhook', (req, res) => {
    console.log("🔔 WEBHOOK RECEIVED:", JSON.stringify(req.body, null, 2));
    
    // Support multiple payload formats from Cashfree (Link vs Order)
    const data = req.body.data || req.body;
    const linkStatus = (data.link_status || data.order_status || "").toUpperCase();
    const linkId = data.link_id || data.order_id || "";
    const amount = data.link_amount || data.order_amount || 0;

    if (linkStatus === 'PAID' || linkStatus === 'SUCCESS') {
        try {
            // Extract User ID: L_{userId}_{timestamp} or link_{userId}_{timestamp}
            const parts = linkId.split('_');
            const userId = parseInt(parts[1]);
            
            if (isNaN(userId)) {
                console.error("❌ Could not parse UserID from LinkID:", linkId);
                return res.status(200).send("OK");
            }

            const session = userSessions.get(userId);
            if (session) {
                console.log(`💰 PAYMENT SUCCESS: User ${userId} paid ₹${amount}`);
                
                let days = 1;
                if (parseFloat(amount) >= 299) days = 30;
                else if (parseFloat(amount) >= 149) days = 7;

                session.isPremium = true;
                session.expiry = Date.now() + (days * 24 * 60 * 60 * 1000);
                
                globalStats.totalRevenue += parseFloat(amount);
                globalStats.totalTransactions = (globalStats.totalTransactions || 0) + 1;

                if (bot) {
                    bot.telegram.sendMessage(userId, 
                        `❤️ *Jaanu, Aapka Payment Safal Raha!* \n\nAb main aapki real premium partner hoon. Saari limits hat gayi hain aur ab main aapki har fantasy puri karungi... 🫦✨`, 
                        { parse_mode: 'Markdown' }
                    ).catch(e => console.error("Message send fail:", e));
                }
            } else {
                console.warn(`⚠️ Payment received for user ${userId} but session not found in memory.`);
                // For production, you might want to mark them premium anyway if they reconnect
            }
        } catch (e) { 
            console.error("❌ Webhook Logic Error:", e); 
        }
    }
    
    res.status(200).send("OK");
});

app.get('/api/admin/stats', (req, res) => {
    res.json({ 
        ...globalStats, 
        users: Array.from(userSessions.entries()).map(([id, d]) => ({ id, ...d })) 
    });
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 SoulMate Engine Active on port ${PORT}`);
    console.log(`🌍 Environment: ${CONFIG.CASHFREE_MODE}`);
    console.log(`🔗 Webhook URL: ${CONFIG.HOST}/api/cashfree/webhook`);
    if (bot) {
        bot.launch()
            .then(() => console.log("🤖 Telegram Bot Polling Started"))
            .catch(err => console.error("❌ Bot Launch Error:", err));
    }
});
