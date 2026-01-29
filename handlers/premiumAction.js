
import { Markup } from 'telegraf';
import { createPaymentLink } from '../services/payment.js';

export function handleShowRates(ctx) {
    return ctx.reply(
        "💎 *MALINI PREMIUM ACCESS* 💎\n\n" +
        "✅ Unlimited NSFW / Bold Photos 🫦\n" +
        "✅ Unlimited Chats (No 50 Limit)\n" +
        "✅ All Premium Roles Unlocked\n" +
        "✅ Seductive / Intimate Personalities\n\n" +
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
    await ctx.reply("Ruko baby, payment link generate kar rahi hoon... 🫦✨");
    
    const link = await createPaymentLink(ctx.chat.id, amount, `${amount} Plan`);
    if (link) {
        return ctx.reply(`🫦 Ye lo baby payment link:\n\n🔗 [CLICK HERE TO PAY](${link})\n\nPayment karne ke baad yahan wapas aa jana baby! ❤️`, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([[Markup.button.url('🔥 Pay Securely (Cashfree)', link)]])
        });
    }
    return ctx.reply("Oops! Link generate nahi ho raha baby. Server pe kuch issue lag raha hai... ❤️");
}
