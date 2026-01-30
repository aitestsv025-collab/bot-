
// Super robust environment loader
const getEnv = (possibleNames) => {
    // 1. Try exact matches first
    for (const name of possibleNames) {
        const val = process.env[name];
        if (val && val.trim().length > 5) return val.trim().replace(/['"]/g, '');
    }
    
    // 2. Try case-insensitive search if still not found
    const allKeys = Object.keys(process.env);
    for (const name of possibleNames) {
        const foundKey = allKeys.find(k => k.toUpperCase() === name.toUpperCase());
        if (foundKey) {
            const val = process.env[foundKey];
            if (val && val.trim().length > 5) return val.trim().replace(/['"]/g, '');
        }
    }
    return "";
};

export const CONFIG = {
    TELEGRAM_TOKEN: getEnv(['TELEGRAM_TOKEN', 'BOT_TOKEN', 'TOKEN']),
    GEMINI_KEY: getEnv(['GEMINI_KEY', 'API_KEY', 'GEMINI_API_KEY']),
    CASHFREE_APP_ID: getEnv(['CASHFREE_APP_ID', 'CASH_APP_ID', 'CASHFREE_ID']),
    CASHFREE_SECRET: getEnv(['CASHFREE_SECRET', 'CASH_SECRET', 'CASHFREE_KEY']),
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
    console.log("Available Process Keys:", Object.keys(process.env).filter(k => k.includes('CASH') || k.includes('KEY') || k.includes('TOKEN')));
    console.log("-----------------------------------------");
}
