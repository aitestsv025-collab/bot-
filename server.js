
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { bot } from './bot.js';
import { userSessions, globalStats } from './state.js';
import { CONFIG } from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

// Cashfree Webhook Handler
app.post('/api/cashfree/webhook', (req, res) => {
    console.log("🔔 [Webhook] Received from Cashfree:", JSON.stringify(req.body));
    
    // In Cashfree Link API v3, data is often inside a 'data' object
    const payload = req.body.data || req.body;
    const { link_id, link_status, link_amount } = payload;

    if (link_status === 'PAID') {
        try {
            // link_id format is "link_{userId}_{timestamp}"
            const parts = link_id.split('_');
            const userId = parseInt(parts[1]);
            
            console.log(`💰 [Payment] Verified! User ${userId} paid ₹${link_amount}`);

            const session = userSessions.get(userId);
            if (session) {
                // Determine subscription length based on amount
                let days = 1;
                if (parseFloat(link_amount) >= 299) days = 30;
                else if (parseFloat(link_amount) >= 149) days = 7;

                session.isPremium = true;
                session.expiry = Date.now() + (days * 24 * 60 * 60 * 1000);
                
                globalStats.totalRevenue += parseFloat(link_amount);
                globalStats.totalTransactions = (globalStats.totalTransactions || 0) + 1;

                if (bot) {
                    bot.telegram.sendMessage(userId, 
                        `❤️ *Jaanu, payment mil gayi!* \n\nAb main tumhari premium partner hoon! Tumne ₹${link_amount} ka plan liya hai, ab main tumhare liye kuch bhi karungi... *mwah* 🫦`, 
                        { parse_mode: 'Markdown' }
                    ).catch(e => console.error("Bot failed to send success message:", e));
                }
            } else {
                console.error(`❌ Session not found for UserID ${userId}`);
            }
        } catch (e) { 
            console.error("❌ Webhook processing error:", e); 
        }
    } else {
        console.log(`ℹ️ [Webhook] Link status for ${link_id} is ${link_status}`);
    }
    
    // Always return 200 OK to acknowledge receipt
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
    console.log(`🔗 Webhook URL: ${CONFIG.HOST}/api/cashfree/webhook`);
    if (bot) {
        bot.launch()
            .then(() => console.log("🤖 Telegram Bot Polling Started"))
            .catch(err => console.error("❌ Bot Launch Error:", err));
    }
});
