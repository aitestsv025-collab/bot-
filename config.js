import 'dotenv/config';

const getEnv = (names) => {
    for (const name of names) {
        const val = process.env[name];
        if (val) return val.trim().replace(/['"]/g, ''); // Remove accidental quotes
    }
    return "";
};

const secret = getEnv(['CASHFREE_SECRET', 'CASH_SECRET', 'CASHFREE_KEY']);

export const CONFIG = {
    TELEGRAM_TOKEN: getEnv(['TELEGRAM_TOKEN', 'BOT_TOKEN']),
    CASHFREE_APP_ID: getEnv(['CASHFREE_APP_ID', 'CASH_APP_ID', 'CASHFREE_ID']),
    CASHFREE_SECRET: secret,
    // Auto-detect PROD if secret contains 'prod'
    CASHFREE_MODE: (process.env.CASHFREE_MODE || (secret.toLowerCase().includes('prod') ? "PROD" : "SANDBOX")).toUpperCase(),
    FREE_MESSAGE_LIMIT: 50,
    BOT_NAME: "Malini",
    HOST: (process.env.RENDER_EXTERNAL_URL || `https://${process.env.RENDER_EXTERNAL_HOSTNAME}` || 'http://localhost:10000').replace(/\/$/, '')
};

export function checkSystem() {
    console.log("-----------------------------------------");
    console.log("🔍 SOULMATE STARTUP DIAGNOSTIC:");
    console.log(`- Bot Token: ${CONFIG.TELEGRAM_TOKEN ? '✅ Found' : '❌ MISSING'}`);
    console.log(`- Gemini Key (API_KEY): ${process.env.API_KEY ? '✅ Found' : '❌ MISSING'}`);
    console.log(`- Cashfree ID: ${CONFIG.CASHFREE_APP_ID ? '✅ Found (' + CONFIG.CASHFREE_APP_ID + ')' : '❌ MISSING'}`);
    console.log(`- Cashfree Secret: ${CONFIG.CASHFREE_SECRET ? '✅ Found' : '❌ MISSING'}`);
    console.log(`- Cashfree Mode: ${CONFIG.CASHFREE_MODE}`);
    console.log(`- Host URL: ${CONFIG.HOST}`);
    console.log("-----------------------------------------");
    
    const missing = [];
    if (!CONFIG.TELEGRAM_TOKEN) missing.push("TELEGRAM_TOKEN");
    if (!process.env.API_KEY) missing.push("API_KEY");
    if (!CONFIG.CASHFREE_APP_ID) missing.push("CASHFREE_APP_ID");
    if (!CONFIG.CASHFREE_SECRET) missing.push("CASHFREE_SECRET");
    
    return missing;
}
