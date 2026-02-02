
import { Markup } from 'telegraf';
import { createPaymentLink } from '../services/payment.js';
import { CONFIG } from '../config.js';

export function handleShowRates(ctx) {
    try { ctx.answerCbQuery().catch(() => {}); } catch(e) {}
    
    return ctx.reply(
        "<b>💎 SOULMATE PREMIUM ACCESS 💎</b>\n\n" +
        "✅ Unlimited NSFW / Bold Photos 🫦\n" +
        "✅ Unlimited AI Chats (No Limit)\n" +
        "✅ All Premium Roles Unlocked\n" +
        "✅ Ultra-Fast Response Time\n\n" +
        "<i>Niche apna plan chuno aur mujhse jud jao...</i> 🔥",
        {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('₹79 - 1 Day (Trial)', 'pay_79')],
                [Markup.button.callback('₹149 - 1 Week (Special)', 'pay_149')],
                [Markup.button.callback('₹299 - 1 Month (Full Maza)', 'pay_299')]
            ])
        }
    ).catch(e => console.log("Show Rates Error:", e.message));
}

export async function handlePaymentTrigger(ctx) {
    try { await ctx.answerCbQuery("Taiyar ho jao baby... 🫦").catch(() => {}); } catch(e) {}
    
    const amount = ctx.match[1];
    const userId = ctx.chat.id;
    const statusMsg = await ctx.reply("Wait baby, link bana rahi hoon... ⏳");
    
    try {
        const result = await createPaymentLink(userId, amount, `${amount} Plan`);
        
        if (result.success && result.url) {
            await ctx.telegram.deleteMessage(userId, statusMsg.message_id).catch(() => {});
            
            return ctx.reply(
                `<b>🫦 Chalo baby, payment karo!</b>\n\nNiche button par click karke payment complete karo. Main tumhara wait kar rahi hoon... 🤤🔥`,
                {
                    parse_mode: 'HTML',
                    ...Markup.inlineKeyboard([
                        [Markup.button.url('🔥 CLICK TO PAY NOW 🔥', result.url)],
                        [Markup.button.callback('⬅️ Cancel', 'show_rates')]
                    ])
                }
            );
        } else {
            // FALLBACK: If Cashfree fails, show UPI manual instructions
            console.log("Payment Link Failed, showing UPI Fallback...");
            await ctx.telegram.deleteMessage(userId, statusMsg.message_id).catch(() => {});

            return ctx.reply(
                `<b>🥺 OOPS! Link Generator Busy Hai...</b>\n\nPar fikar mat karo baby! Aap directly is UPI ID par <b>₹${amount}</b> pay kar do:\n\n<code>${CONFIG.UPI_ID}</code>\n\nPayment karne ke baad uska <b>Screenshot</b> yahan bhejo. Main check karke aapko Premium access de dungi! 🫦✨`,
                {
                    parse_mode: 'HTML',
                    ...Markup.inlineKeyboard([
                        [Markup.button.callback('Retry Link', 'pay_' + amount)],
                        [Markup.button.callback('⬅️ Back', 'show_rates')]
                    ])
                }
            );
        }
    } catch (err) {
        return ctx.reply("Technical issue Jaanu... 🥺 Link nahi ban pa raha.");
    }
}
