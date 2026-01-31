
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

// Auto-check function
async function runAutoVerification() {
    if (globalStats.isCashfreeApproved) return;
    
    console.log("🔄 Background Check: Checking Cashfree status...");
    const result = await createPaymentLink(999, 1, "Background Check");
    if (result.success) {
        globalStats.isCashfreeApproved = true;
        addLog("🎉 EXCELLENT! Cashfree is now FULLY ENABLED. Bot is taking payments!", "success");
    } else {
        console.log(`Still waiting... Reason: ${result.error}`);
    }
}

// Run check every 30 minutes
setInterval(runAutoVerification, 30 * 60 * 1000);

app.get('/api/admin/verify-cashfree', async (req, res) => {
    addLog("Manual Verification triggered...", "warning");
    const result = await createPaymentLink(999, 1, "Manual Status Check");
    if (result.success) {
        globalStats.isCashfreeApproved = true;
        addLog("✅ Manual Check: Cashfree is ACTIVE!", "success");
        res.json({ active: true });
    } else {
        addLog(`❌ Manual Check: Still inactive (${result.error})`, "error");
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
    if (successEvents.some(evt => type.includes(evt))) {
        const orderId = order.order_id || data.order_id || (data.link && data.link.link_id) || data.link_id || "";
        const amount = payment.payment_amount || order.order_amount || data.link_amount || 0;
        
        if (orderId) {
            const userId = parseInt(orderId.split('_')[1]);
            if (!isNaN(userId)) {
                const session = userSessions.get(userId);
                if (session && !session.isPremium) {
                    addLog(`💰 PAYMENT SUCCESS! User ${userId} is now Premium.`, "success");
                    session.isPremium = true;
                    session.expiry = Date.now() + (30 * 24 * 60 * 60 * 1000); 
                    globalStats.totalRevenue += parseFloat(amount);
                    globalStats.totalTransactions++;
                    if (bot) bot.telegram.sendMessage(userId, "❤️ Aapka payment mil gaya Jaanu! 🫦 enjoy premium content!", { parse_mode: 'HTML' }).catch(() => {});
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
            .then(() => addLog("🤖 Bot is Online", "success"))
            .catch(err => addLog(`Bot Launch Failed: ${err.message}`, "error"));
    }
});
