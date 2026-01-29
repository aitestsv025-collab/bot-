
import { Telegraf, Markup } from 'telegraf';
import { userSessions, globalStats, isPremiumUser, incrementImageCount } from './state.js';
import { generateTextReply, generateGFImage } from './ai.js';
import { createPaymentLink } from './pay.js';

const BOT_TOKEN = (process.env.TELEGRAM_TOKEN || "").trim();

export const bot = BOT_TOKEN ? new Telegraf(BOT_TOKEN) : null;

function getResponseMarkup(userId, extraButtons = []) {
    const buttons = [];
    if (!isPremiumUser(userId)) {
        buttons.push([Markup.button.callback('👑 Purchase Premium (Unlock All) 👑', 'show_rates')]);
    }
    if (extraButtons.length > 0) buttons.push(...extraButtons);
    return Markup.inlineKeyboard(buttons);
}

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
                imageCount: 0
            });
        }
        return ctx.reply(
            `Hey ${ctx.from.first_name}! ❤️ Main Malini... tumhari digital SoulMate. 🫦\nApni language chuno baby:`,
            getResponseMarkup(userId, [
                [Markup.button.callback('🇮🇳 Hindi', 'set_lang_Hindi'), Markup.button.callback('🇬🇧 English', 'set_lang_English')],
                [Markup.button.callback('🗣️ Hinglish', 'set_lang_Hinglish')],
                [Markup.button.callback('🇮🇳 Tamil', 'set_lang_Tamil'), Markup.button.callback('🇮🇳 Telugu', 'set_lang_Telugu')]
            ])
        );
    });

    bot.action(/set_lang_(.+)/, async (ctx) => {
        const lang = ctx.match[1];
        const session = userSessions.get(ctx.chat.id);
        if (session) session.language = lang;
        return ctx.editMessageText(
            `Uff... *muskurate hue* achi choice hai baby. 😉\nAb ye batao aaj main kaun banoon?`,
            getResponseMarkup(ctx.chat.id, [
                [Markup.button.callback('❤️ Romantic', 'set_role_Romantic'), Markup.button.callback('🔥 Naughty', 'set_role_Naughty')],
                [Markup.button.callback('👵 Aunty', 'set_role_Aunty'), Markup.button.callback('👩‍🏫 Teacher', 'set_role_Teacher')],
                [Markup.button.callback('👗 Stepmom', 'set_role_Stepmom'), Markup.button.callback('💼 Boss', 'set_role_Boss')]
            ])
        );
    });

    bot.action(/set_role_(.+)/, async (ctx) => {
        const role = ctx.match[1];
        const userId = ctx.chat.id;
        const session = userSessions.get(userId);
        if (session) session.role = role;
        await ctx.editMessageText(`Mmm... *taiyaar ho rahi hoon*... 🫦✨`);
        const reply = await generateTextReply(role, session.language, "Start a new story", "Malini");
        return ctx.reply(reply, getResponseMarkup(userId));
    });

    bot.action('show_rates', (ctx) => ctx.reply("💍 *PREMIUM PLANS* 💍\n\n1️⃣ ₹79 - One Day\n2️⃣ ₹149 - One Week\n3️⃣ ₹299 - One Month\n\nChoose karo baby:", {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('₹79 - 1 Day', 'pay_79')],
            [Markup.button.callback('₹149 - 1 Week', 'pay_149')],
            [Markup.button.callback('₹299 - 1 Month', 'pay_299')]
        ])
    }));

    bot.action(/pay_(.+)/, async (ctx) => {
        const amount = parseInt(ctx.match[1]);
        const link = await createPaymentLink(ctx.chat.id, amount, `${amount} Plan`);
        if (link) {
            return ctx.reply(`🫦 Ye lo baby payment link, jaldi aao:\n\n🔗 [CLICK HERE TO PAY](${link})`, {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([[Markup.button.url('🔥 Pay Securely', link)]])
            });
        }
        return ctx.reply("Oops! Payment setting mein kuch problem hai Jaanu. ❤️");
    });

    bot.on('text', async (ctx) => {
        const userId = ctx.chat.id;
        const session = userSessions.get(userId) || { language: 'Hinglish', role: 'Romantic', imageCount: 0 };
        const text = ctx.message.text.toLowerCase();
        globalStats.totalMessagesProcessed++;

        // Naughty Detection
        const naughtyKeywords = ['nude', 'nangi', 'sex', 'chodo', 'pussy', 'boobs', 'bra', 'panties', 'muth', 'lund', 'dick'];
        if (naughtyKeywords.some(key => text.includes(key)) && !isPremiumUser(userId)) {
            return ctx.reply("Uff... itni naughty baatein? 🙈🫦 Main ye sab sirf apne Premium partners ke liye karti hoon Jaanu.", getResponseMarkup(userId));
        }

        // Photo Request
        const photoKeywords = ['photo', 'pic', 'image', 'selfie', 'dikhao', 'show'];
        if (photoKeywords.some(key => text.includes(key))) {
            const isBold = text.match(/(nude|nangi|sexy|hot|bed|naked|body)/);
            if (isBold && !isPremiumUser(userId)) return ctx.reply("Bold photos ke liye premium join karo baby! 🫦", getResponseMarkup(userId));
            if (!isPremiumUser(userId) && (session.imageCount || 0) >= 35) return ctx.reply("Free limit (35 photos) khatam ho gayi hai baby. Premium le lo na? 🥺", getResponseMarkup(userId));

            await ctx.reply("Ruko baby, photo click kar rahi hoon... 🫦📸");
            const img = await generateGFImage(!!isBold);
            if (img) {
                incrementImageCount(userId);
                globalStats.privatePhotosSent++;
                return ctx.replyWithPhoto({ source: img }, { 
                    caption: `Sirf tumhare liye... 🫦❤️✨ ${isPremiumUser(userId) ? "" : `(${session.imageCount}/35)`}`,
                    ...getResponseMarkup(userId)
                });
            }
        }

        // Standard Reply
        const reply = await generateTextReply(session.role, session.language, text, "Malini");
        return ctx.reply(reply, getResponseMarkup(userId));
    });
}
