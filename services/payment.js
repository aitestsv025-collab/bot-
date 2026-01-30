
import { CONFIG } from "../config.js";

export async function createPaymentLink(userId, amount, planName) {
    if (!CONFIG.CASHFREE_APP_ID || !CONFIG.CASHFREE_SECRET) {
        console.error("❌ Cashfree Credentials Missing!");
        return null;
    }

    // Strict Mode Detection
    const isProd = CONFIG.CASHFREE_MODE === "PROD";
    const baseUrl = isProd ? "https://api.cashfree.com/pg/links" : "https://sandbox.cashfree.com/pg/links";
    
    // Unique ID for production
    const linkId = `L_${userId}_${Date.now()}`;
    
    console.log(`[Payment] Creating ${isProd ? 'PRODUCTION' : 'SANDBOX'} link for user ${userId}...`);

    try {
        const response = await fetch(baseUrl, {
            method: 'POST',
            headers: {
                'x-client-id': CONFIG.CASHFREE_APP_ID,
                'x-client-secret': CONFIG.CASHFREE_SECRET,
                'x-api-version': '2023-08-01',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                customer_details: { 
                    customer_id: userId.toString(), 
                    customer_phone: "9123456789", // Generic valid format for prod
                    customer_email: `user_${userId}@soulmate.ai` 
                },
                link_id: linkId,
                link_amount: parseFloat(amount),
                link_currency: "INR",
                link_purpose: `Subscription: ${planName}`,
                link_meta: { 
                    // Redirect back to Telegram Bot directly
                    return_url: `https://t.me/soulmate_ai_bot?start=success`, 
                    notify_url: `${CONFIG.HOST}/api/cashfree/webhook` 
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("❌ Cashfree Prod Error:", JSON.stringify(data));
            return null;
        }

        console.log(`✅ Real Link Generated: ${data.link_url}`);
        return data.link_url;
    } catch (e) { 
        console.error("❌ Cashfree Exception:", e);
        return null; 
    }
}
