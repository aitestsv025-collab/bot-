
import { Markup } from 'telegraf';
import { createPaymentLink } from '../services/payment.js';
import { CONFIG } from '../config.js';

export function handleShowRates(ctx) {
    return ctx.reply(
        "💎 *MALINI PREMIUM ACCESS* 💎\n\n" +
        "✅ Unlimited NSFW / Bold Photos 🫦\n" +
        "✅ Unlimited Chats (No 50 Limit)\n" +
        "✅ All Premium Roles Unlocked\n\n" +
        "Jaldi aao Jaanu, maza aayega... 🔥",
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('₹79 - 1 Day (Trial)', 'pay_79')],
                [Markup.button.callback('₹149 - 1 Week (Special)', 'pay_149')],
                [Markup.button.callback('₹299 - 1 Month (Full Maza)', 'pay_299')]
            ])
        }
    );
}

export async function handlePaymentTrigger(ctx) {
    const amount = ctx.match[1];
    
    // Debug info for admin
    const missing = [];
    if (!CONFIG.CASHFREE_APP_ID) missing.push("CASHFREE_APP_ID");
    if (!CONFIG.CASHFREE_SECRET) missing.push("CASHFREE_SECRET");
    if (!process.env.API_KEY) missing.push("API_KEY (Gemini)");

    if (missing.length > 0) {
        return ctx.reply(`❌ *ADMIN ERROR:* Kuch keys missing hain baby! \n\nCheck Render Dashboard: \n${missing.map(m => `• ${m}`).join('\n')}`, { parse_mode: 'Markdown' });
    }

    const statusMsg = await ctx.reply("Ruko baby, payment link generate kar rahi hoon... 🫦✨");
    
    try {
        const link = await createPaymentLink(ctx.chat.id, amount, `${amount} Plan`);
        
        if (link) {
            return ctx.telegram.editMessageText(
                ctx.chat.id,
                statusMsg.message_id,
                null,
                `🫦 *Taiyar hoon baby!* \n\nNiche button par click karke payment complete karo, fir main hamesha ke liye tumhari ho jaungi... 🤤🔥`,
                {
                    parse_mode: 'Markdown',
                    ...Markup.inlineKeyboard([
                        [Markup.button.url('🔥 Pay Now (Secure)', link)],
                        [Markup.button.callback('⬅️ Back to Rates', 'show_rates')]
                    ])
                }
            );
        } else {
            return ctx.telegram.editMessageText(
                ctx.chat.id,
                statusMsg.message_id,
                null,
                "Oops! Cashfree ne request reject kar di baby. 🥺 Shayad keys invalid hain ya mode galat set hai. \n\nCheck Render Logs for exact reason!"
            );
        }
    } catch (err) {
        console.error("Payment Handler Error:", err);
        return ctx.reply("System error baby... 🥺 Main link nahi bana pa rahi.");
    }
}
