
import 'dotenv/config';

export const CONFIG = {
    TELEGRAM_TOKEN: (process.env.TELEGRAM_TOKEN || "").trim(),
    GEMINI_KEY: (process.env.API_KEY || "").trim(),
    CASHFREE_APP_ID: (process.env.CASHFREE_APP_ID || "").trim(),
    CASHFREE_SECRET: (process.env.CASHFREE_SECRET || "").trim(),
    CASHFREE_MODE: (process.env.CASHFREE_MODE || "SANDBOX").toUpperCase(), // PROD or SANDBOX
    FREE_MESSAGE_LIMIT: 50,
    BOT_NAME: "Malini",
    // Fallback for Host if Render URL is not present
    HOST: (process.env.RENDER_EXTERNAL_URL || `https://${process.env.RENDER_EXTERNAL_HOSTNAME}` || 'http://localhost:10000').replace(/\/$/, '')
};

// Internal validation helper
export function validateConfig() {
    const missing = [];
    if (!CONFIG.TELEGRAM_TOKEN) missing.push("TELEGRAM_TOKEN");
    if (!CONFIG.GEMINI_KEY) missing.push("API_KEY");
    if (!CONFIG.CASHFREE_APP_ID) missing.push("CASHFREE_APP_ID");
    if (!CONFIG.CASHFREE_SECRET) missing.push("CASHFREE_SECRET");
    return missing;
}
