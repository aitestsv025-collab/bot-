
import { Markup } from 'telegraf';
import { createPaymentLink } from '../services/payment.js';

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
            let errorMsg = `<b>❌ Payment Issue!</b>\n\n<code>${result.error}</code>\n\n`;
            
            if (result.error_type === 'FEATURE_DISABLED') {
                errorMsg += "⚠️ <b>ACTION REQUIRED:</b> Aapke Cashfree account mein 'Payment Links' feature abhi disabled hai. Cashfree Dashboard > Activation mein jaakar use enable karein.";
            }

            return ctx.telegram.editMessageText(
                userId,
                statusMsg.message_id,
                null,
                errorMsg,
                { 
                    parse_mode: 'HTML',
                    ...Markup.inlineKeyboard([
                        [Markup.button.url('Dashboard Check Karo', 'https://merchant.cashfree.com/merchant/pg')],
                        [Markup.button.callback('Retry', 'show_rates')]
                    ])
                }
            ).catch(e => console.error(e));
        }
    } catch (err) {
        return ctx.reply("Technical issue Jaanu... 🥺 Link nahi ban pa raha.");
    }
}
