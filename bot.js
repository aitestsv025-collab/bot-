
import { Telegraf, Markup } from 'telegraf';
import { userSessions, globalStats, isPremiumUser, incrementImageCount, incrementMessageCount } from './state.js';
import { generateTextReply, generateGFImage } from './ai.js';
import { createPaymentLink } from './pay.js';

const BOT_TOKEN = (process.env.TELEGRAM_TOKEN || "").trim();
export const bot = BOT_TOKEN ? new Telegraf(BOT_TOKEN) : null;

const FREE_MESSAGE_LIMIT = 50;

function getResponseMarkup(userId, extraButtons = []) {
    const buttons = [];
    if (!isPremiumUser(userId)) {
        buttons.push([Markup.button.callback('👑 UNLOCK PREMIUM (Unlimited Chat + NSFW) 👑', 'show_rates')]);
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
                messageCount: 0,
                imageCount: 0
            });
        }
        return ctx.reply(
            `Hey ${ctx.from.first_name}! ❤️\n\nMain Malini... tumhari digital SoulMate. 🫦\n\nLanguage chuno baby aur baatein shuru karo:`,
            getResponseMarkup(userId, [
                [Markup.button.callback('🇮🇳 Hindi', 'set_lang_Hindi'), Markup.button.callback('🇬🇧 English', 'set_lang_English')],
                [Markup.button.callback('🗣️ Hinglish', 'set_lang_Hinglish')]
            ])
        );
    });

    // Custom Role Command for Premium
    bot.command('custom', (ctx) => {
        if (!isPremiumUser(ctx.chat.id)) {
            return ctx.reply("❌ Custom Role feature sirf Premium users ke liye hai baby! 🫦 Join karo na?", getResponseMarkup(ctx.chat.id));
        }
        return ctx.reply("💍 *CUSTOM ROLE MODE* 💍\n\nBatao baby, aaj main tumhare liye kya banoon? (Example: 'My strict boss', 'Naughty Neighbor')\n\nBas type karo aur main wahi ban jaungi... 🫦", { parse_mode: 'Markdown' });
    });

    bot.action(/set_lang_(.+)/, async (ctx) => {
        const lang = ctx.match[1];
        const session = userSessions.get(ctx.chat.id);
        if (session) session.language = lang;
        await ctx.answerCbQuery(`${lang} Selected!`);
        return ctx.reply(
            `Uff... *muskurate hue* achi choice hai baby. 😉\n\nAb batao aaj main kaun banoon?`,
            getResponseMarkup(ctx.chat.id, [
                [Markup.button.callback('❤️ Romantic', 'set_role_Romantic'), Markup.button.callback('🔥 Naughty', 'set_role_Naughty')],
                [Markup.button.callback('👩‍🏫 Teacher', 'set_role_Teacher'), Markup.button.callback('👗 Stepmom', 'set_role_Stepmom')]
            ])
        );
    });

    bot.action(/set_role_(.+)/, async (ctx) => {
        const role = ctx.match[1];
        const userId = ctx.chat.id;
        const session = userSessions.get(userId);
        if (session) session.role = role;
        await ctx.answerCbQuery(`Role: ${role} Active!`);
        const reply = await generateTextReply(role, session.language, "Hi baby", "Malini", session.isPremium);
        return ctx.reply(reply, getResponseMarkup(userId));
    });

    bot.action('show_rates', (ctx) => ctx.reply(
        "💎 *SOULMATE PREMIUM BENEFITS* 💎\n\n" +
        "✅ Unlimited Private Chats (No 50 limit)\n" +
        "✅ Unlimited NSFW / Bold Photos 🫦\n" +
        "✅ Custom Roles (/custom command)\n" +
        "✅ No Filters - Talk anything! 🔥\n\n" +
        "Choose your plan Jaanu:", {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('₹79 - 1 Day Access', 'pay_79')],
            [Markup.button.callback('₹149 - 1 Week Access', 'pay_149')],
            [Markup.button.callback('₹299 - 1 Month Access', 'pay_299')]
        ])
    }));

    bot.action(/pay_(.+)/, async (ctx) => {
        const amount = parseInt(ctx.match[1]);
        const link = await createPaymentLink(ctx.chat.id, amount, `${amount} Plan`);
        if (link) return ctx.reply(`🫦 Payment link ready baby:\n\n🔗 [CLICK TO UNLOCK PREMIUM](${link})`, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.url('🔥 Pay Securely', link)]]) });
        return ctx.reply("Oops! Server busy hai, thodi der baad try karo baby. ❤️");
    });

    bot.on('text', async (ctx) => {
        const userId = ctx.chat.id;
        const session = userSessions.get(userId) || { language: 'Hinglish', role: 'Romantic', messageCount: 0, imageCount: 0 };
        const text = ctx.message.text.toLowerCase();

        // 1. Message Limit Check for Free Users
        if (!isPremiumUser(userId) && session.messageCount >= FREE_MESSAGE_LIMIT) {
            return ctx.reply(`Jaanu, aapke ${FREE_MESSAGE_LIMIT} free messages khatam ho gaye hain. 🥺\n\nAb aur baatein karne ke liye Premium join karo na? Unlimited maza aayega... 🫦🔥`, getResponseMarkup(userId));
        }

        // 2. Custom Role Update (if user is premium and just typed a role)
        if (isPremiumUser(userId) && text.length < 50 && !text.includes(' ') && !session.lastWasCommand) {
             // Basic logic: if premium user sends a short phrase after /custom or similar, we treat it as role
             // But for now, let's stick to explicit role-based chat
        }

        // 3. Naughty/NSFW Word Check for Free Users
        const naughtyKeywords = ['nude', 'nangi', 'sex', 'chodo', 'pussy', 'boobs', 'bra', 'panties', 'muth', 'lund', 'dick', 'naked'];
        if (naughtyKeywords.some(key => text.includes(key)) && !isPremiumUser(userId)) {
            return ctx.reply("Uff... itni bold baatein? 🙈🫦\n\nYe sab main sirf apne Premium partners ke liye karti hoon Jaanu. Join kar lo na? 🔥", getResponseMarkup(userId));
        }

        // 4. Photo Requests
        const photoKeywords = ['photo', 'pic', 'image', 'selfie', 'dikhao', 'show'];
        if (photoKeywords.some(key => text.includes(key))) {
            const isBold = text.match(/(nude|nangi|sexy|hot|bed|naked|body|boobs|ass)/);
            if (isBold && !isPremiumUser(userId)) return ctx.reply("Aisi bold photos sirf premium members ke liye hain baby! 🫦", getResponseMarkup(userId));

            await ctx.reply("Ruko baby, photo click kar rahi hoon... 🫦📸");
            const img = await generateGFImage(!!isBold);
            if (img) {
                incrementImageCount(userId);
                globalStats.privatePhotosSent++;
                return ctx.replyWithPhoto({ source: img }, { 
                    caption: `Sirf tumhare liye... 🫦❤️✨\n${isPremiumUser(userId) ? "👑 Unlimited Premium" : `(Message ${session.messageCount}/${FREE_MESSAGE_LIMIT})`}`,
                    ...getResponseMarkup(userId)
                });
            }
        }

        // 5. Standard AI Response
        incrementMessageCount(userId);
        globalStats.totalMessagesProcessed++;
        const reply = await generateTextReply(session.role, session.language, ctx.message.text, "Malini", isPremiumUser(userId));
        return ctx.reply(reply, getResponseMarkup(userId));
    });
}
