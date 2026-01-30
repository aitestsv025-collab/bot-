
import 'dotenv/config';

const getEnv = (names) => {
    for (const name of names) {
        if (process.env[name]) return process.env[name].trim();
    }
    return "";
};

const secret = getEnv(['CASHFREE_SECRET', 'CASH_SECRET', 'CASHFREE_KEY']);

export const CONFIG = {
    TELEGRAM_TOKEN: getEnv(['TELEGRAM_TOKEN', 'BOT_TOKEN']),
    GEMINI_KEY: getEnv(['API_KEY', 'GEMINI_KEY']),
    CASHFREE_APP_ID: getEnv(['CASHFREE_APP_ID', 'CASH_APP_ID', 'CASHFREE_ID']),
    CASHFREE_SECRET: secret,
    // Auto-detect PROD if secret starts with cfsk_ma_prod
    CASHFREE_MODE: (process.env.CASHFREE_MODE || (secret.includes('_prod_') ? "PROD" : "SANDBOX")).toUpperCase(),
    FREE_MESSAGE_LIMIT: 50,
    BOT_NAME: "Malini",
    HOST: (process.env.RENDER_EXTERNAL_URL || `https://${process.env.RENDER_EXTERNAL_HOSTNAME}` || 'http://localhost:10000').replace(/\/$/, '')
};

export function checkSystem() {
    console.log("-----------------------------------------");
    console.log("🔍 SOULMATE STARTUP DIAGNOSTIC:");
    console.log(`- Bot Token: ${CONFIG.TELEGRAM_TOKEN ? '✅ LOADED' : '❌ MISSING'}`);
    console.log(`- Gemini Key: ${CONFIG.GEMINI_KEY ? '✅ LOADED' : '❌ MISSING'}`);
    console.log(`- Cashfree ID: ${CONFIG.CASHFREE_APP_ID ? '✅ LOADED' : '❌ MISSING'}`);
    console.log(`- Mode: ${CONFIG.CASHFREE_MODE}`);
    console.log(`- Host: ${CONFIG.HOST}`);
    console.log("-----------------------------------------");
    return !CONFIG.TELEGRAM_TOKEN || !CONFIG.GEMINI_KEY || !CONFIG.CASHFREE_APP_ID || !CONFIG.CASHFREE_SECRET;
}
