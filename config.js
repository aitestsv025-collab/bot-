
// Super robust environment loader for Production
const getEnv = (possibleNames, defaultValue = "") => {
    for (const name of possibleNames) {
        const val = process.env[name];
        if (val && val.trim().length > 0) {
            // Remove any accidental quotes, spaces, or invisible characters
            return val.trim()
                .replace(/['"]/g, '')
                .replace(/\s/g, ''); 
        }
    }
    return defaultValue;
};

export const CONFIG = {
    TELEGRAM_TOKEN: getEnv(['TELEGRAM_TOKEN', 'BOT_TOKEN']),
    GEMINI_KEY: getEnv(['GEMINI_KEY', 'API_KEY']),
    CASHFREE_APP_ID: getEnv(['CASHFREE_APP_ID']),
    CASHFREE_SECRET: getEnv(['CASHFREE_SECRET']),
    CASHFREE_MODE: (process.env.CASHFREE_MODE || "PROD").toUpperCase().trim(),
    FREE_MESSAGE_LIMIT: 50,
    FREE_AI_IMAGE_LIMIT: 5,
    FREE_BOLD_IMAGE_LIMIT: 3,
    BOT_NAME: "Malini",
    HOST: (process.env.RENDER_EXTERNAL_URL || `https://${process.env.RENDER_EXTERNAL_HOSTNAME}` || 'http://localhost:10000').replace(/\/$/, '')
};

export function checkSystem() {
    console.log("=========================================");
    console.log("🚀 PRODUCTION SYSTEM STARTUP");
    console.log(`- Bot Name: ${CONFIG.BOT_NAME}`);
    console.log(`- Mode: ${CONFIG.CASHFREE_MODE}`);
    console.log(`- Telegram: ${CONFIG.TELEGRAM_TOKEN ? '✅ READY' : '❌ MISSING'}`);
    console.log(`- Gemini AI: ${CONFIG.GEMINI_KEY ? '✅ READY' : '❌ MISSING'}`);
    console.log(`- Cashfree ID: ${CONFIG.CASHFREE_APP_ID ? '✅ READY' : '❌ MISSING'}`);
    console.log("=========================================");
}
