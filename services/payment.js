
import { CONFIG } from "../config.js";

export async function createPaymentLink(userId, amount, planName) {
    if (!CONFIG.CASHFREE_APP_ID || !CONFIG.CASHFREE_SECRET) {
        console.error("❌ Cashfree Credentials Missing in CONFIG object!");
        console.log("Current App ID Length:", CONFIG.CASHFREE_APP_ID.length);
        return null;
    }

    const isProd = CONFIG.CASHFREE_MODE === "PROD";
    const baseUrl = isProd ? "https://api.cashfree.com/pg/links" : "https://sandbox.cashfree.com/pg/links";
    const linkId = `L_${userId}_${Date.now()}`;
    
    console.log(`[Payment] Attempting ${isProd ? 'PROD' : 'SANDBOX'} link for user ${userId}...`);

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
                    customer_phone: "9123456789", 
                    customer_email: `user_${userId}@soulmate.ai` 
                },
                link_id: linkId,
                link_amount: parseFloat(amount),
                link_currency: "INR",
                link_purpose: `Subscription: ${planName}`,
                link_meta: { 
                    return_url: `https://t.me/soulmate_ai_bot?start=success`, 
                    notify_url: `${CONFIG.HOST}/api/cashfree/webhook` 
                }
            })
        });

        const data = await response.json();
        if (!response.ok) {
            console.error("❌ Cashfree API returned error:", JSON.stringify(data));
            return null;
        }

        return data.link_url;
    } catch (e) { 
        console.error("❌ Fetch Exception during payment link creation:", e);
        return null; 
    }
}
