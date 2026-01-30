
export const CONFIG = {
    TELEGRAM_TOKEN: (process.env.TELEGRAM_TOKEN || "").trim(),
    GEMINI_KEY: (process.env.API_KEY || "").trim(),
    CASHFREE_APP_ID: (process.env.CASHFREE_APP_ID || "").trim(),
    CASHFREE_SECRET: (process.env.CASHFREE_SECRET || "").trim(),
    CASHFREE_MODE: (process.env.CASHFREE_MODE || "SANDBOX").toUpperCase(), // PROD or SANDBOX
    FREE_MESSAGE_LIMIT: 50,
    BOT_NAME: "Malini",
    // Ensure host doesn't have double slashes
    HOST: (process.env.RENDER_EXTERNAL_URL || `https://${process.env.RENDER_EXTERNAL_HOSTNAME}` || 'http://localhost:10000').replace(/\/$/, '')
};
