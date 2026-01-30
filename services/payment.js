
import { CONFIG } from "../config.js";
import { globalStats } from "../state.js";

export async function createPaymentLink(userId, amount, planName) {
    const appId = CONFIG.CASHFREE_APP_ID;
    const secret = CONFIG.CASHFREE_SECRET;

    if (!appId || !secret) {
        return { success: false, error: "API Keys are missing in Server Settings." };
    }

    const isProd = CONFIG.CASHFREE_MODE === "PROD";
    const baseUrl = isProd 
        ? "https://api.cashfree.com/pg/links" 
        : "https://sandbox.cashfree.com/pg/links";
    
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
            
            globalStats.lastPaymentError = data.message || data.code;
            globalStats.lastRawError = data; // Save the full object
            
            if (data.type === 'feature_not_enabled' || data.code === 'feature_not_enabled' || (data.message && data.message.includes('not enabled'))) {
                globalStats.isCashfreeApproved = false;
                return { 
                    success: false, 
                    error_type: 'FEATURE_DISABLED',
                    error: data.message || "Feature not enabled."
                };
            }

            return { success: false, error: data.message || "Payment Gateway Error." };
        }

        globalStats.isCashfreeApproved = true;
        globalStats.lastPaymentError = null;
        globalStats.lastRawError = null;
        return { success: true, url: data.link_url };
    } catch (e) { 
        return { success: false, error: "Network Error. Please try again." }; 
    }
}
