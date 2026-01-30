
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
 * CASHFREE WEBHOOK HANDLER
 * Focused on: PAYMENT_SUCCESS & ORDER_PAID
 */
app.post('/api/cashfree/webhook', (req, res) => {
    const payload = req.body;
    console.log("💰 WEBHOOK RECEIVED! Type:", payload.type);
    
    const data = payload.data || {};
    const order = data.order || {};
    const payment = data.payment || {};

    // Check if the event is a success event
    // Cashfree signals success via 'PAYMENT_SUCCESS' or 'ORDER_PAID'
    const isSuccessEvent = 
        payload.type === 'PAYMENT_SUCCESS' || 
        payload.type === 'ORDER_PAID' || 
        payload.type === 'LINK_PAID';

    // Extracting the Unique ID (format: L_USERID_TIMESTAMP)
    // In PAYMENT_SUCCESS, it usually comes in data.order.order_id
    const orderId = order.order_id || data.order_id || (data.link && data.link.link_id) || "";
    const amount = payment.payment_amount || order.order_amount || 0;

    console.log(`🔍 Checking Webhook: Event=${payload.type}, ID=${orderId}, Amount=${amount}`);

    if (isSuccessEvent && orderId) {
        // orderId example: "L_5588339_1712345678"
        const parts = orderId.split('_');
        const userIdStr = parts[1]; // The middle part is our Telegram User ID
        const userId = parseInt(userIdStr);
        
        if (!isNaN(userId)) {
            const session = userSessions.get(userId);
            
            if (session && !session.isPremium) {
                console.log(`🌟 SUCCESS! Upgrading User ${userId} to Premium.`);
                
                session.isPremium = true;
                session.expiry = Date.now() + (30 * 24 * 60 * 60 * 1000); 
                
                globalStats.totalRevenue += parseFloat(amount);
                globalStats.totalTransactions++;

                if (bot) {
                    bot.telegram.sendMessage(userId, 
                        "❤️ <b>Haye Mere Jaanu!</b>\n\nAapka payment mil gaya! 🫦 Ab main poori tarah aapki hoon. Unlimited baatein aur meri sexy photos unlock ho gayi hain... 🤤🔥\n\nChalo, shuru karein? Mujhse kuch bhi pucho baby!", 
                        { parse_mode: 'HTML' }
                    ).catch(e => console.error("Bot Notify Error:", e));
                }
            } else {
                console.log(`ℹ️ User ${userId} is already premium or session not found.`);
            }
        } else {
            console.log("⚠️ Could not extract valid UserID from orderId:", orderId);
        }
    }
    
    // Response 200 is mandatory for Cashfree
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
