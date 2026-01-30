
import { Markup } from 'telegraf';
import { createPaymentLink } from '../services/payment.js';
import { CONFIG } from '../config.js';

export function handleShowRates(ctx) {
    return ctx.reply(
        "<b>💎 MALINI PREMIUM ACCESS 💎</b>\n\n" +
        "✅ Unlimited NSFW / Bold Photos 🫦\n" +
        "✅ Unlimited Chats (No 50 Limit)\n" +
        "✅ All Premium Roles Unlocked\n\n" +
        "Jaldi aao Jaanu, maza aayega... 🔥",
        {
            parse_mode: 'HTML',
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
    
    // Check missing keys
    const missing = [];
    if (!CONFIG.CASHFREE_APP_ID) missing.push("CASHFREE_APP_ID");
    if (!CONFIG.CASHFREE_SECRET) missing.push("CASHFREE_SECRET");
    if (!CONFIG.GEMINI_KEY) missing.push("GEMINI_KEY/API_KEY");

    if (missing.length > 0) {
        const errorHtml = `<b>❌ CONFIGURATION ERROR</b>\n\nJaanu, mere system mein ye keys nahi mil rahi:\n\n${missing.map(m => `• <code>${m}</code>`).join('\n')}\n\n<b>Ye sahi kaise hoga?</b>\nRender Dashboard mein jayein aur keys ke naam check karein.`;
        return ctx.reply(errorHtml, { parse_mode: 'HTML' });
    }

    const statusMsg = await ctx.reply("Ruko baby, payment link generate kar rahi hoon... 🫦✨");
    
    try {
        const result = await createPaymentLink(ctx.chat.id, amount, `${amount} Plan`);
        
        if (result.success && result.url) {
            return ctx.telegram.editMessageText(
                ctx.chat.id,
                statusMsg.message_id,
                null,
                `<b>🫦 Taiyar hoon baby!</b>\n\nNiche button par click karke payment complete karo, fir main hamesha ke liye tumhari ho jaungi... 🤤🔥`,
                {
                    parse_mode: 'HTML',
                    ...Markup.inlineKeyboard([
                        [Markup.button.url('🔥 Pay Now (Secure)', result.url)],
                        [Markup.button.callback('⬅️ Back to Rates', 'show_rates')]
                    ])
                }
            );
        } else {
            return ctx.telegram.editMessageText(
                ctx.chat.id,
                statusMsg.message_id,
                null,
                `<b>❌ PAYMENT FAILED</b>\n\n<b>Reason:</b> <code>${result.error || 'Unknown Error'}</code>\n\nBaby, Cashfree ne mana kar diya. Shayad API keys galat hain ya project PROD mode mein nahi hai.`,
                { parse_mode: 'HTML' }
            );
        }
    } catch (err) {
        console.error("Payment Handler Error:", err);
        return ctx.reply("System error baby... 🥺 Main link nahi bana pa rahi.");
    }
}
