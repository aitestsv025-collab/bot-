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
    
    // Check if keys are missing globally to notify admin user
    if (!CONFIG.CASHFREE_APP_ID || !CONFIG.CASHFREE_SECRET) {
        return ctx.reply("❌ *ADMIN ERROR:* Cashfree Environment Variables missing! \n\nPlease check `CASHFREE_APP_ID` and `CASHFREE_SECRET` in your Render dashboard.", { parse_mode: 'Markdown' });
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
                "Oops! Payment gateway busy hai baby. 🥺 Thodi der baad try karo na? \n\n(Tip: Check if you are using PROD keys but mode is set to Sandbox)"
            );
        }
    } catch (err) {
        console.error("Payment Handler Error:", err);
        return ctx.reply("System error baby... 🥺 Main link nahi bana pa rahi.");
    }
}
