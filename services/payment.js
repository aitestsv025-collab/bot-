
import { CONFIG } from "../config.js";

export async function createPaymentLink(userId, amount, planName) {
    const appId = CONFIG.CASHFREE_APP_ID;
    const secret = CONFIG.CASHFREE_SECRET;

    if (!appId || !secret) {
        console.error("❌ Cashfree Credentials Missing in Environment Variables!");
        return { success: false, error: "API Keys are missing in Server Settings." };
    }

    // Determine environment
    const isProd = CONFIG.CASHFREE_MODE === "PROD";
    const baseUrl = isProd 
        ? "https://api.cashfree.com/pg/links" 
        : "https://sandbox.cashfree.com/pg/links";
    
    // Format: L_USERID_TIMESTAMP (Max length limit check)
    const linkId = `L_${userId}_${Math.floor(Date.now() / 1000)}`;
    
    try {
        const payload = {
            customer_details: { 
                customer_id: userId.toString(), 
                customer_phone: "9999999999", 
                customer_email: `user_${userId}@soulmate.ai` 
            },
            link_id: linkId,
            link_amount: parseFloat(amount),
            link_currency: "INR",
            link_purpose: `SoulMate Premium: ${planName}`,
            link_meta: { 
                return_url: `https://t.me/soulmate_ai_bot`, 
                notify_url: `${CONFIG.HOST}/api/cashfree/webhook` 
            }
        };

        console.log(`📡 Creating ${CONFIG.CASHFREE_MODE} Payment Link for User ${userId}...`);

        const response = await fetch(baseUrl, {
            method: 'POST',
            headers: {
                'x-client-id': appId,
                'x-client-secret': secret,
                'x-api-version': '2023-08-01',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error("❌ Cashfree API Rejection:", data);
            // Provide friendly error message based on common Cashfree issues
            let msg = data.message || "Payment Gateway is busy.";
            if (data.code === "unauthorized") msg = "Invalid App ID or Secret. Please check your Cashfree credentials.";
            if (data.code === "authentication_failure") msg = "Authentication failed. Check if you are using PROD keys in TEST mode.";
            
            return { success: false, error: msg };
        }

        console.log(`✅ Payment Link Created Successfully: ${data.link_url}`);
        return { success: true, url: data.link_url };
    } catch (e) { 
        console.error("❌ Network Error while calling Cashfree:", e.message);
        return { success: false, error: "Network Error. Please try again later." }; 
    }
}
