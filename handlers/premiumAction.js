
import { Markup } from 'telegraf';
import { createPaymentLink } from '../services/payment.js';
import { CONFIG } from '../config.js';

export function handleShowRates(ctx) {
    return ctx.reply(
        "<b>💎 MALINI PREMIUM ACCESS 💎</b>\n\n" +
        "✅ Unlimited NSFW / Bold Photos 🫦\n" +
        "✅ Unlimited Chats (No 50 Limit)\n" +
        "✅ All Premium Roles Unlocked\n\n" +
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
    
    // Quick Loading State (Edit instead of New Message for speed)
    await ctx.answerCbQuery("Generating Payment Link... 🫦");
    const statusMsg = await ctx.reply("Wait baby... ⏳");
    
    try {
        const result = await createPaymentLink(userId, amount, `${amount} Plan`);
        
        if (result.success && result.url) {
            // Remove the loading message and show the BIG pay button
            await ctx.telegram.deleteMessage(userId, statusMsg.message_id);
            
            return ctx.reply(
                `<b>🫦 Taiyar ho na Jaanu?</b>\n\nNiche button par click karo aur direct payment complete karo. Main wait kar rahi hoon... 🤤🔥`,
                {
                    parse_mode: 'HTML',
                    ...Markup.inlineKeyboard([
                        [Markup.button.url('🔥 CLICK TO PAY NOW 🔥', result.url)],
                        [Markup.button.callback('⬅️ Cancel', 'show_rates')]
                    ])
                }
            );
        } else {
            return ctx.telegram.editMessageText(
                userId,
                statusMsg.message_id,
                null,
                `<b>❌ ERROR:</b> <code>${result.error}</code>\n\nBaby, Cashfree connect nahi ho raha. Dashboard check karo.`,
                { parse_mode: 'HTML' }
            );
        }
    } catch (err) {
        return ctx.reply("Technical issue Jaanu... 🥺");
    }
}
