
import { CONFIG } from "../config.js";

export async function createPaymentLink(userId, amount, planName) {
    if (!CONFIG.CASHFREE_APP_ID || !CONFIG.CASHFREE_SECRET) {
        console.error("❌ PAYMENT ERROR: Missing Cashfree Credentials.");
        return { success: false, error: "Credentials Missing in Render Settings" };
    }

    const isProd = CONFIG.CASHFREE_MODE === "PROD";
    const baseUrl = isProd ? "https://api.cashfree.com/pg/links" : "https://sandbox.cashfree.com/pg/links";
    const linkId = `L_${userId}_${Date.now()}`;
    
    console.log(`[Cashfree] Attempting to create ${isProd ? 'PRODUCTION' : 'SANDBOX'} link for ₹${amount}...`);

    try {
        const payload = {
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
        };

        const response = await fetch(baseUrl, {
            method: 'POST',
            headers: {
                'x-client-id': CONFIG.CASHFREE_APP_ID,
                'x-client-secret': CONFIG.CASHFREE_SECRET,
                'x-api-version': '2023-08-01',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (!response.ok) {
            const errMsg = data.message || data.err_message || "Unknown Rejection";
            console.error("❌ Cashfree API Rejection:", JSON.stringify(data));
            return { success: false, error: errMsg };
        }

        console.log(`✅ Link Generated: ${data.link_url}`);
        return { success: true, url: data.link_url };
    } catch (e) { 
        console.error("❌ Cashfree Connection Error:", e.message);
        return { success: false, error: "Connection Failed: " + e.message }; 
    }
}
