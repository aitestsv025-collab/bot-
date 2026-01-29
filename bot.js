
import { Telegraf } from 'telegraf';
import { CONFIG } from './config.js';
import { userSessions, globalStats, isPremiumUser } from './state.js';
import { getPersistentMarkup, getLanguageKeyboard } from './utils/markups.js';
import { handleLanguageSelection } from './handlers/languageAction.js';
import { handleRoleSelection } from './handlers/roleAction.js';
import { handleShowRates, handlePaymentTrigger } from './handlers/premiumAction.js';
import { processIncomingMessage } from './handlers/messageProcessor.js';

export const bot = CONFIG.TELEGRAM_TOKEN ? new Telegraf(CONFIG.TELEGRAM_TOKEN) : null;

if (bot) {
    bot.start(async (ctx) => {
        const userId = ctx.chat.id;
        if (!userSessions.has(userId)) {
            globalStats.totalUsers++;
            userSessions.set(userId, { 
                userName: ctx.from.first_name || "Handsome", 
                isPremium: false,
                language: 'Hinglish',
                role: 'Romantic',
                messageCount: 0,
                imageCount: 0,
                awaitingCustomRole: false,
                customRoleName: ""
            });
        }
        return ctx.reply(
            `Hey ${ctx.from.first_name}! ❤️\n\nMain ${CONFIG.BOT_NAME}... tumhari digital SoulMate. 🫦\n\nLanguage chuno baby:`,
            getPersistentMarkup(userId, getLanguageKeyboard())
        );
    });

    bot.command('custom', (ctx) => {
        const userId = ctx.chat.id;
        const session = userSessions.get(userId);
        if (!isPremiumUser(userId)) return ctx.reply("❌ Custom Role premium feature hai baby! 🫦 Join karo na?", getPersistentMarkup(userId));
        
        if (session) session.awaitingCustomRole = true;
        return ctx.reply("💍 *CUSTOM ROLE* 💍\n\nType karo aaj main tumhare liye kya banoon? (Example: 'My strict boss', 'Childhood crush')\n\nMain aapki har fantasy puri karungi... 🫦", { parse_mode: 'Markdown' });
    });

    bot.action(/set_lang_(.+)/, handleLanguageSelection);
    bot.action(/set_role_(.+)/, handleRoleSelection);
    bot.action('show_rates', handleShowRates);
    bot.action(/pay_(.+)/, handlePaymentTrigger);

    bot.on('text', processIncomingMessage);
}
