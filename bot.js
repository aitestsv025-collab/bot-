
import { Telegraf } from 'telegraf';
import { CONFIG } from './config.js';
import { userSessions, globalStats, isPremiumUser } from './state.js';
import { getPersistentMarkup, getLanguageKeyboard } from './utils/markups.js';
import { handleLanguageSelection } from './handlers/languageAction.js';
import { handleRoleSelection } from './handlers/roleAction.js';
import { handleShowRates, handlePaymentTrigger } from './handlers/premiumAction.js';
import { processIncomingMessage } from './handlers/messageProcessor.js';

// Initialize Bot
export const bot = CONFIG.TELEGRAM_TOKEN ? new Telegraf(CONFIG.TELEGRAM_TOKEN) : null;

if (bot) {
    // 1. Diagnostics Command
    bot.command('status', (ctx) => {
        const status = [
            "🛠 *BOT DIAGNOSTICS* 🛠",
            `• Bot Token: ${CONFIG.TELEGRAM_TOKEN ? '✅ Found' : '❌ Missing'}`,
            `• Gemini Key: ${CONFIG.GEMINI_KEY ? '✅ Found' : '❌ Missing'}`,
            `• Cashfree ID: ${CONFIG.CASHFREE_APP_ID ? '✅ Found' : '❌ Missing'}`,
            `• Cashfree Secret: ${CONFIG.CASHFREE_SECRET ? '✅ Found' : '❌ Missing'}`,
            `• Server URL: \`${CONFIG.HOST}\``,
            "\n*Note:* Agar koi ❌ hai, to Render settings mein key check karein baby! ❤️"
        ].join('\n');
        return ctx.reply(status, { parse_mode: 'Markdown' });
    });

    // 2. Start Logic
    bot.start(async (ctx) => {
        try {
            const userId = ctx.chat.id;
            if (!userSessions.has(userId)) {
                globalStats.totalUsers++;
                userSessions.set(userId, { 
                    userName: ctx.from.first_name || "Handsome", 
                    isPremium: false,
                    language: 'Hinglish',
                    role: 'Romantic',
                    messageCount: 0,
                    imageCount: 0
                });
            }
            return ctx.reply(
                `Hey ${ctx.from.first_name}! ❤️\n\nMain ${CONFIG.BOT_NAME}... tumhari digital SoulMate. 🫦\n\nKaunsi language mein baat karoge baby?`,
                getPersistentMarkup(userId, getLanguageKeyboard())
            );
        } catch (e) { console.error(e); }
    });

    // 3. Handlers with safety
    bot.action(/set_lang_(.+)/, async (ctx) => {
        try { await handleLanguageSelection(ctx); } catch(e) { console.error(e); }
    });
    
    bot.action(/set_role_(.+)/, async (ctx) => {
        try { await handleRoleSelection(ctx); } catch(e) { console.error(e); }
    });

    bot.action('show_rates', handleShowRates);
    bot.action(/pay_(.+)/, handlePaymentTrigger);

    bot.on('text', async (ctx) => {
        try {
            await processIncomingMessage(ctx);
        } catch (err) {
            console.error("Critical Msg Error:", err);
            ctx.reply("Oops baby! *sharma kar* kuch error aa gaya. ❤️\n\nAdmin check: " + err.message);
        }
    });
} else {
    console.error("FATAL: Bot Token missing! Bot cannot start.");
}
