
// Dotenv is handled in server.js entry point

const getEnv = (names) => {
    for (const name of names) {
        const val = process.env[name];
        if (val && val.trim().length > 0) {
            return val.trim().replace(/['"]/g, ''); 
        }
    }
    return "";
};

const secret = getEnv(['CASHFREE_SECRET', 'CASH_SECRET', 'CASHFREE_KEY', 'CASH_FREE_SECRET']);
const appId = getEnv(['CASHFREE_APP_ID', 'CASH_APP_ID', 'CASHFREE_ID', 'CASH_FREE_APP_ID']);

export const CONFIG = {
    TELEGRAM_TOKEN: getEnv(['TELEGRAM_TOKEN', 'BOT_TOKEN']),
    CASHFREE_APP_ID: appId,
    CASHFREE_SECRET: secret,
    CASHFREE_MODE: (process.env.CASHFREE_MODE || (secret.toLowerCase().includes('prod') ? "PROD" : "SANDBOX")).toUpperCase(),
    FREE_MESSAGE_LIMIT: 50,
    BOT_NAME: "Malini",
    HOST: (process.env.RENDER_EXTERNAL_URL || `https://${process.env.RENDER_EXTERNAL_HOSTNAME}` || 'http://localhost:10000').replace(/\/$/, '')
};

export function checkSystem() {
    console.log("-----------------------------------------");
    console.log("🔍 SOULMATE STARTUP DIAGNOSTIC:");
    console.log(`- Bot Token: ${CONFIG.TELEGRAM_TOKEN ? '✅ Found (' + CONFIG.TELEGRAM_TOKEN.substring(0, 5) + '...)' : '❌ MISSING'}`);
    console.log(`- Gemini Key: ${process.env.API_KEY ? '✅ Found (' + process.env.API_KEY.substring(0, 5) + '...)' : '❌ MISSING'}`);
    console.log(`- Cashfree ID: ${CONFIG.CASHFREE_APP_ID ? '✅ Found (' + CONFIG.CASHFREE_APP_ID.substring(0, 5) + '...)' : '❌ MISSING'}`);
    console.log(`- Cashfree Secret: ${CONFIG.CASHFREE_SECRET ? '✅ Found (' + CONFIG.CASHFREE_SECRET.substring(0, 5) + '...)' : '❌ MISSING'}`);
    console.log(`- Mode: ${CONFIG.CASHFREE_MODE}`);
    console.log("-----------------------------------------");
}
