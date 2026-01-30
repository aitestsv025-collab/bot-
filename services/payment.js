
import { CONFIG } from "../config.js";

export async function createPaymentLink(userId, amount, planName) {
    const appId = CONFIG.CASHFREE_APP_ID;
    const secret = CONFIG.CASHFREE_SECRET;

    if (!appId || !secret) {
        return { success: false, error: "Production API Keys Missing" };
    }

    const isProd = CONFIG.CASHFREE_MODE === "PROD";
    const baseUrl = isProd 
        ? "https://api.cashfree.com/pg/links" 
        : "https://sandbox.cashfree.com/pg/links";
    
    // Unique Link ID for each transaction
    const linkId = `L_${userId}_${Date.now()}`;
    
    try {
        const payload = {
            customer_details: { 
                customer_id: userId.toString(), 
                customer_phone: "9999999999", // Dummy for Cashfree requirements
                customer_email: `user_${userId}@soulmatebot.com` 
            },
            link_id: linkId,
            link_amount: parseFloat(amount),
            link_currency: "INR",
            link_purpose: `Premium Upgrade: ${planName}`,
            link_meta: { 
                return_url: `https://t.me/soulmate_ai_bot`, // Replace with your actual bot username
                notify_url: `${CONFIG.HOST}/api/cashfree/webhook` 
            }
        };

        console.log(`Initiating ${isProd ? 'PROD' : 'SANDBOX'} payment for user ${userId}...`);

        const response = await fetch(baseUrl, {
            method: 'POST',
            headers: {
                'x-client-id': appId,
                'x-client-secret': secret,
                'x-api-version': '2023-08-01', // Stable Production Version
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error("Cashfree API Rejected:", data);
            return { 
                success: false, 
                error: data.message || `API Error ${response.status}` 
            };
        }

        return { success: true, url: data.link_url };
    } catch (e) { 
        console.error("Payment Network Error:", e);
        return { success: false, error: "Connection to Cashfree failed" }; 
    }
}
