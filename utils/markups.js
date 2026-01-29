
import { Markup } from 'telegraf';
import { LANGUAGES } from '../constants/languages.js';
import { ROLES } from '../constants/roles.js';
import { isPremiumUser } from '../state.js';

export const getPersistentMarkup = (userId, extraButtons = []) => {
    const buttons = [];
    if (!isPremiumUser(userId)) {
        buttons.push([Markup.button.callback('👑 UNLOCK PREMIUM (NSFW + Unlimited) 👑', 'show_rates')]);
    }
    if (extraButtons.length > 0) buttons.push(...extraButtons);
    return Markup.inlineKeyboard(buttons);
};

export const getLanguageKeyboard = () => {
    const rows = [];
    for (let i = 0; i < LANGUAGES.length; i += 2) {
        const row = [Markup.button.callback(LANGUAGES[i].label, `set_lang_${LANGUAGES[i].code}`)];
        if (LANGUAGES[i + 1]) row.push(Markup.button.callback(LANGUAGES[i + 1].label, `set_lang_${LANGUAGES[i + 1].code}`));
        rows.push(row);
    }
    return rows;
};

export const getRoleKeyboard = (userId) => {
    const rows = [];
    const allRoles = [...ROLES.FREE, ...ROLES.PREMIUM];
    for (let i = 0; i < allRoles.length; i += 2) {
        const row = [Markup.button.callback(allRoles[i].label, `set_role_${allRoles[i].id}`)];
        if (allRoles[i + 1]) row.push(Markup.button.callback(allRoles[i + 1].label, `set_role_${allRoles[i + 1].id}`));
        rows.push(row);
    }
    return rows;
};
