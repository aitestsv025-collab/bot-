
import { CONFIG } from "../config.js";

export async function createPaymentLink(userId, amount, planName) {
    if (!CONFIG.CASHFREE_APP_ID || !CONFIG.CASHFREE_SECRET) {
        console.error("❌ PAYMENT ERROR: Missing Credentials in Config.");
        return null;
    }

    const isProd = CONFIG.CASHFREE_MODE === "PROD";
    const baseUrl = isProd ? "https://api.cashfree.com/pg/links" : "https://sandbox.cashfree.com/pg/links";
    const linkId = `L_${userId}_${Date.now()}`;
    
    console.log(`[Cashfree] Requesting ${isProd ? 'PRODUCTION' : 'SANDBOX'} link for User ${userId}...`);

    try {
        const response = await fetch(baseUrl, {
            method: 'POST',
            headers: {
                'x-client-id': CONFIG.CASHFREE_APP_ID,
                'x-client-secret': CONFIG.CASHFREE_SECRET,
                'x-api-version': '2023-08-01',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                customer_details: { 
                    customer_id: userId.toString(), 
                    customer_phone: "9876543210", 
                    customer_email: `user_${userId}@soulmate.ai` 
                },
                link_id: linkId,
                link_amount: parseFloat(amount),
                link_currency: "INR",
                link_purpose: `Premium Plan: ${planName}`,
                link_meta: { 
                    return_url: `https://t.me/soulmate_ai_bot?start=paid`, 
                    notify_url: `${CONFIG.HOST}/api/cashfree/webhook` 
                }
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error("❌ Cashfree API Rejected Request:", JSON.stringify(data));
            // Check if user is using prod keys on sandbox url
            if (data.message && data.message.includes("client id") && !isProd) {
                console.error("💡 TIP: Aap shayad PROD keys Sandbox mein use kar rahe hain. Set CASHFREE_MODE=PROD in Render.");
            }
            return null;
        }

        console.log(`✅ Link Generated Successfully: ${data.link_url}`);
        return data.link_url;
    } catch (e) { 
        console.error("❌ Network Error during Cashfree Call:", e.message);
        return null; 
    }
}
