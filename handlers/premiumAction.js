
import { Markup } from 'telegraf';
import { createPaymentLink } from '../services/payment.js';

export function handleShowRates(ctx) {
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
    );
}

export async function handlePaymentTrigger(ctx) {
    const amount = ctx.match[1];
    const userId = ctx.chat.id;
    
    await ctx.answerCbQuery("Taiyar ho jao baby... 🫦");
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
            // Log the exact error to the user for debugging
            return ctx.telegram.editMessageText(
                userId,
                statusMsg.message_id,
                null,
                `<b>❌ Payment Link Error:</b>\n\n<code>${result.error}</code>\n\nBaby, lagta hai API keys mein kuch gadbad hai. Admin Dashboard check karo! 🥺`,
                { parse_mode: 'HTML' }
            ).catch(e => console.error(e));
        }
    } catch (err) {
        return ctx.reply("Technical issue Jaanu... 🥺 Link nahi ban pa raha.");
    }
}
