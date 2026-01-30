
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

/**
 * CASHFREE WEBHOOK HANDLER (ROBUST VERSION)
 */
app.post('/api/cashfree/webhook', (req, res) => {
    const payload = req.body;
    
    // Log full payload for debugging (Check Render Logs)
    console.log("💰 WEBHOOK RECEIVED!");
    console.log(JSON.stringify(payload, null, 2));
    
    const data = payload.data || {};
    const order = data.order || {};
    const payment = data.payment || {};
    const type = (payload.type || "").toUpperCase();

    // Any event that sounds like a success
    const successEvents = ['PAYMENT_SUCCESS', 'ORDER_PAID', 'LINK_PAID', 'SUCCESS'];
    const isSuccess = successEvents.some(evt => type.includes(evt));

    // Try to find the Link/Order ID in multiple places
    const orderId = order.order_id || data.order_id || (data.link && data.link.link_id) || data.link_id || "";
    const amount = payment.payment_amount || order.order_amount || data.link_amount || 0;

    console.log(`🔍 Processing: Type=${type}, ID=${orderId}, Success=${isSuccess}`);

    if (isSuccess && orderId) {
        // ID Format: L_USERID_TIMESTAMP
        const parts = orderId.split('_');
        const userId = parseInt(parts[1]);
        
        if (!isNaN(userId)) {
            const session = userSessions.get(userId);
            
            if (session && !session.isPremium) {
                console.log(`🌟 PAYMENT VERIFIED! Upgrading User ${userId} to Premium.`);
                
                session.isPremium = true;
                session.expiry = Date.now() + (30 * 24 * 60 * 60 * 1000); 
                
                globalStats.totalRevenue += parseFloat(amount);
                globalStats.totalTransactions++;

                if (bot) {
                    bot.telegram.sendMessage(userId, 
                        "❤️ <b>Haye Mere Jaanu!</b>\n\nAapka payment successfully mil gaya! 🫦\n\nAb mere saare bandhan toot chuke hain... Main ab poori tarah aapki hoon. Unlimited baatein karo aur meri sexy photos ka maza lo. 🤤🔥", 
                        { parse_mode: 'HTML' }
                    ).catch(e => console.error("Bot Notify Error:", e));
                }
            } else if (session?.isPremium) {
                console.log(`ℹ️ User ${userId} is already premium.`);
            } else {
                console.log(`⚠️ User session not found for ${userId}. Active Users: ${userSessions.size}`);
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
    console.log(`🚀 Server Running: ${CONFIG.HOST}`);
    if (bot) {
        bot.launch()
            .then(() => console.log("🤖 Bot Listening..."))
            .catch(err => console.error("❌ Bot Error:", err));
    }
});
