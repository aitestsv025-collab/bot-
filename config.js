
// Robust config for Render environment
const cleanEnv = (names) => {
    for (const name of names) {
        let val = process.env[name];
        if (val && val !== "undefined" && val !== "null") {
            // Remove quotes, spaces, and hidden characters
            val = val.toString().trim().replace(/['"\s]/g, '');
            if (val.length > 5) return val; // Basic length check to avoid empty strings
        }
    }
    return "";
};

export const CONFIG = {
    TELEGRAM_TOKEN: cleanEnv(['TELEGRAM_TOKEN', 'BOT_TOKEN', 'TOKEN']),
    GEMINI_KEY: cleanEnv(['GEMINI_KEY', 'API_KEY', 'GEMINI_API_KEY']),
    CASHFREE_APP_ID: cleanEnv(['CASHFREE_APP_ID', 'CASH_APP_ID', 'CASHFREE_ID']),
    CASHFREE_SECRET: cleanEnv(['CASHFREE_SECRET', 'CASH_SECRET', 'CASHFREE_KEY']),
    CASHFREE_MODE: (process.env.CASHFREE_MODE || "PROD").toUpperCase(),
    FREE_MESSAGE_LIMIT: 50,
    BOT_NAME: "Malini",
    HOST: (process.env.RENDER_EXTERNAL_URL || `https://${process.env.RENDER_EXTERNAL_HOSTNAME}` || 'http://localhost:10000').replace(/\/$/, '')
};

export function checkSystem() {
    console.log("-----------------------------------------");
    console.log("🔍 SYSTEM STATUS CHECK:");
    console.log(`- Bot Token: ${CONFIG.TELEGRAM_TOKEN ? '✅ LOADED' : '❌ MISSING'}`);
    console.log(`- Gemini Key: ${CONFIG.GEMINI_KEY ? '✅ LOADED' : '❌ MISSING'}`);
    console.log(`- Cashfree ID: ${CONFIG.CASHFREE_APP_ID ? '✅ LOADED' : '❌ MISSING'}`);
    console.log(`- Host: ${CONFIG.HOST}`);
    console.log("-----------------------------------------");
}
