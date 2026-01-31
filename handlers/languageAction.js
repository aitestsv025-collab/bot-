
import { userSessions } from '../state.js';
import { getPersistentMarkup, getRoleKeyboard } from '../utils/markups.js';

export async function handleLanguageSelection(ctx) {
    const lang = ctx.match[1];
    const session = userSessions.get(ctx.chat.id);
    if (session) session.language = lang;
    
    await ctx.answerCbQuery(`${lang} Selected! ❤️`);
    
    // Confirmation message based on language or generic Hinglish with translation hint
    const confirmationText = {
        'Hindi': 'ठीक है जानू, अब मैं हिंदी में बात करूँगी। ❤️\n\nअब बताओ मैं आज तुम्हारे लिए क्या बनूँ? 🫦',
        'Tamil': 'சரி அன்பே, இனி நான் தமிழில் பேசுவேன். ❤️\n\nஇன்று நான் உனக்காக என்னவாக இருக்க வேண்டும் என்று சொல்? 🫦',
        'Telugu': 'సరే ప్రియుడా, ఇకపై నేను తెలుగులో మాట్లాడతాను. ❤️\n\nఈరోజు నేను నీకోసం ఏం కావాలో చెప్పు? 🫦',
        'English': 'Alright darling, I will speak in English now. ❤️\n\nNow tell me, what should I be for you today? 🫦',
        'Hinglish': 'Uff... *muskurate hue* bahut achi choice hai baby.\n\nAb batao main aaj tumhare liye kya banoon? 🫦'
    };

    const text = confirmationText[lang] || confirmationText['Hinglish'];

    return ctx.editMessageText(
        text,
        getPersistentMarkup(ctx.chat.id, getRoleKeyboard(ctx.chat.id))
    );
}
