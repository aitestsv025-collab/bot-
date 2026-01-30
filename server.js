
import 'dotenv/config'; 
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { bot } from './bot.js';
import { userSessions, globalStats, addLog } from './state.js';
import { CONFIG, checkSystem } from './config.js';
import { createPaymentLink } from './services/payment.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

checkSystem();

// Endpoint to verify Cashfree Status manually
app.get('/api/admin/verify-cashfree', async (req, res) => {
    addLog("Checking Cashfree activation status...", "warning");
    // Attempt to create a 1 INR test link
    const result = await createPaymentLink(999, 1, "Status Check");
    if (result.success) {
        addLog("✅ Cashfree is now FULLY ACTIVE!", "success");
        res.json({ active: true });
    } else {
        addLog(`❌ Still inactive: ${result.error}`, "error");
        res.json({ active: false, error: result.error });
    }
});

app.post('/api/cashfree/webhook', (req, res) => {
    const payload = req.body;
    addLog(`Webhook received: ${payload.type}`, "info");
    
    const data = payload.data || {};
    const order = data.order || {};
    const payment = data.payment || {};
    const type = (payload.type || "").toUpperCase();

    const successEvents = ['PAYMENT_SUCCESS', 'ORDER_PAID', 'LINK_PAID', 'SUCCESS'];
    const isSuccess = successEvents.some(evt => type.includes(evt));

    const orderId = order.order_id || data.order_id || (data.link && data.link.link_id) || data.link_id || "";
    const amount = payment.payment_amount || order.order_amount || data.link_amount || 0;

    if (isSuccess && orderId) {
        const parts = orderId.split('_');
        const userId = parseInt(parts[1]);
        
        if (!isNaN(userId)) {
            const session = userSessions.get(userId);
            if (session && !session.isPremium) {
                addLog(`💰 Payment Verified! User ${userId} upgraded.`, "success");
                session.isPremium = true;
                session.expiry = Date.now() + (30 * 24 * 60 * 60 * 1000); 
                globalStats.totalRevenue += parseFloat(amount);
                globalStats.totalTransactions++;

                if (bot) {
                    bot.telegram.sendMessage(userId, 
                        "❤️ <b>Haye Mere Jaanu!</b>\n\nAapka payment mil gaya! 🫦 Ab main poori tarah aapki hoon. Maza lo! 🔥", 
                        { parse_mode: 'HTML' }
                    ).catch(e => console.error("Bot Notify Error:", e));
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
    console.log(`🚀 Server Running: ${CONFIG.HOST}`);
    addLog(`Server started on ${CONFIG.HOST}`, "info");
    if (bot) {
        bot.launch()
            .then(() => addLog("🤖 Bot is Online & Listening", "success"))
            .catch(err => addLog(`Bot Launch Failed: ${err.message}`, "error"));
    }
});
