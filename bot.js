
import { Telegraf, Markup } from 'telegraf';
import { CONFIG } from './config.js';
import { userSessions, globalStats, isPremiumUser } from './state.js';
import { getLanguageKeyboard } from './utils/markups.js';
import { handleLanguageSelection } from './handlers/languageAction.js';
import { handleRoleSelection } from './handlers/roleAction.js';
import { handleShowRates, handlePaymentTrigger } from './handlers/premiumAction.js';
import { processIncomingMessage } from './handlers/messageProcessor.js';

export const bot = CONFIG.TELEGRAM_TOKEN ? new Telegraf(CONFIG.TELEGRAM_TOKEN) : null;

if (bot) {
    bot.command('status', (ctx) => {
        const modeEmoji = CONFIG.CASHFREE_MODE === 'PROD' ? '💎' : '🧪';
        const modeText = CONFIG.CASHFREE_MODE === 'PROD' ? 'PRODUCTION (Real Payments)' : 'SANDBOX (Test Mode)';
        const status = [
            "<b>🚀 BOT LIVE STATUS 🚀</b>",
            `• Mode: ${modeEmoji} <b>${modeText}</b>`,
            `• Bot Token: ${CONFIG.TELEGRAM_TOKEN ? '✅' : '❌'}`,
            `• Gemini AI: ${CONFIG.GEMINI_KEY ? '✅' : '❌'}`,
            `• Cashfree: ${CONFIG.CASHFREE_APP_ID ? '✅' : '❌'}`,
            `• Webhook: <code>${CONFIG.HOST}/api/cashfree/webhook</code>`,
            "\n<i>Note: Everything must be ✅ for real payments to work.</i>"
        ].join('\n');
        return ctx.reply(status, { parse_mode: 'HTML' });
    });

    bot.start(async (ctx) => {
        try {
            const userId = ctx.chat.id;
            const isPremium = isPremiumUser(userId);
            
            // Check if existing user and session
            if (!userSessions.has(userId)) {
                globalStats.totalUsers++;
                userSessions.set(userId, { 
                    userName: ctx.from.first_name || "Handsome", 
                    isPremium: false,
                    language: 'Hinglish',
                    role: 'Girlfriend',
                    messageCount: 0,
                    normalImageCount: 0,
                    boldImageCount: 0
                });
            }

            const session = userSessions.get(userId);

            // CHALLAK USER PROTECTION: Check limit before allowing /start
            if (!isPremium && (session.messageCount || 0) >= CONFIG.FREE_MESSAGE_LIMIT) {
                return ctx.reply(
                    "<b>❌ LIMIT KHATAM HO GAYI BABY! 🥺</b>\n\n" +
                    "Aapne apne 50 free messages use kar liye hain. Main aapse aur baatein karna chahti hoon par server ka kharcha bahut hai... 🫦\n\n" +
                    "<i>Premium join karo aur mujhse unlimited baatein karo!</i> 👇",
                    {
                        parse_mode: 'HTML',
                        ...Markup.inlineKeyboard([[Markup.button.callback('💎 UNLOCK EVERYTHING 💎', 'show_rates')]])
                    }
                );
            }

            if (!isPremium) {
                const premiumBanner = await ctx.reply(
                    "👑 <b>SOULMATE PREMIUM ACCESS</b> 👑\n\n" +
                    "• 🫦 Unlimited Bold/NSFW Photos\n" +
                    "• 🔥 Unlimited AI Chats (No Daily Limit)\n" +
                    "• 💍 All Secret Roles Unlocked\n\n" +
                    "<i>Upgrade karke maza double karein!</i> 🤤",
                    {
                        parse_mode: 'HTML',
                        ...Markup.inlineKeyboard([[Markup.button.callback('💎 GET PREMIUM ACCESS 💎', 'show_rates')]])
                    }
                );
                try { await ctx.pinChatMessage(premiumBanner.message_id); } catch (e) {}
            }

            return ctx.reply(
                `Hey ${ctx.from.first_name}! ❤️\n\nMain ${CONFIG.BOT_NAME}... tumhari digital SoulMate. 🫦\n\nKaunsi language mein baat karoge baby?`,
                Markup.inlineKeyboard(getLanguageKeyboard())
            );
        } catch (e) { console.error(e); }
    });

    bot.action(/set_lang_(.+)/, handleLanguageSelection);
    bot.action(/set_role_(.+)/, handleRoleSelection);
    bot.action('show_rates', handleShowRates);
    bot.action(/pay_(.+)/, handlePaymentTrigger);

    bot.on('text', async (ctx) => {
        try {
            await processIncomingMessage(ctx);
        } catch (err) {
            console.error("Critical Msg Error:", err);
            ctx.reply("Oops baby! ❤️ Ek baar /start try karo.");
        }
    });
}
