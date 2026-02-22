
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

// Endpoint to manually make a user premium from dashboard
app.post('/api/admin/make-premium', (req, res) => {
    const { userId } = req.body;
    const session = userSessions.get(parseInt(userId));
    
    if (session) {
        session.isPremium = true;
        session.expiry = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days
        addLog(`Manual Approval: User ${userId} is now Premium.`, "success");
        
        if (bot) {
            bot.telegram.sendMessage(userId, "<b>🎉 CONGRATULATIONS BABY!</b>\n\nAapka payment approve ho gaya hai. Ab aap mere saare premium features aur bold photos access kar sakte ho! 🫦🔥", { parse_mode: 'HTML' })
                .catch(e => console.log("Notify Error:", e.message));
        }
        return res.json({ success: true });
    }
    res.status(404).json({ success: false, error: "User not found" });
});

app.get('/api/admin/verify-cashfree', async (req, res) => {
    addLog("Manual Verification triggered...", "warning");
    const result = await createPaymentLink(999, 1, "Manual Diagnosis");
    if (result.success) {
        globalStats.isCashfreeApproved = true;
        res.json({ active: true });
    } else {
        res.json({ active: false, error: result.error, details: result.details });
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
    const envStatus = {
        telegram: !!CONFIG.TELEGRAM_TOKEN,
        gemini: !!CONFIG.GEMINI_KEY,
        cf_id: CONFIG.CASHFREE_APP_ID || "missing",
        cf_secret: CONFIG.CASHFREE_SECRET || "missing"
    };

    res.json({ 
        ...globalStats, 
        mode: CONFIG.CASHFREE_MODE,
        envStatus,
        users: Array.from(userSessions.entries()).map(([id, d]) => ({ 
            id, 
            userName: d.userName,
            isPremium: d.isPremium,
            msgCount: d.messageCount,
            lastSeen: new Date().toLocaleTimeString() // Simplified for demo
        })) 
    });
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
    });
    app.use(vite.middlewares);
} else {
    app.use(express.static(path.join(__dirname, 'dist')));
}

app.get('*', (req, res) => {
    if (process.env.NODE_ENV !== "production") {
        // In dev mode, Vite handles the index.html
        res.status(404).send("Vite is handling this route");
    } else {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    }
});

const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server Running on port ${PORT}`);
    console.log(`🔗 Dashboard: ${CONFIG.HOST}`);
    
    if (bot) {
        console.log("🤖 Attempting to launch Telegram Bot...");
        bot.launch()
            .then(() => console.log("✅ Bot launched successfully!"))
            .catch(err => {
                console.error("❌ Bot Launch Failed:", err.message);
                if (err.message.includes("401")) {
                    console.error("👉 Hint: Your TELEGRAM_TOKEN might be invalid.");
                }
            });
    } else {
        console.warn("⚠️ Bot instance is null. Check if TELEGRAM_TOKEN is set in environment.");
    }
});
