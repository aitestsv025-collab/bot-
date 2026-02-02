
import { CONFIG } from "../config.js";
import { globalStats, addLog } from "../state.js";

export async function createPaymentLink(userId, amount, planName) {
    const appId = CONFIG.CASHFREE_APP_ID;
    const secret = CONFIG.CASHFREE_SECRET;

    if (!appId || !secret) {
        const err = "API Credentials (App ID or Secret) are MISSING in environment variables.";
        globalStats.lastPaymentError = err;
        addLog(err, "error");
        return { success: false, error: err };
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

        addLog(`Creating payment link for ${userId} (${CONFIG.CASHFREE_MODE} mode)...`, "info");

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
            
            globalStats.lastPaymentError = data.message || data.code || "Unknown Gateway Error";
            globalStats.lastRawError = {
                status: response.status,
                url: baseUrl,
                response: data,
                mode: CONFIG.CASHFREE_MODE
            };
            
            addLog(`Cashfree API Error [${response.status}]: ${globalStats.lastPaymentError}`, "error");
            
            return { 
                success: false, 
                error: globalStats.lastPaymentError,
                details: data
            };
        }

        globalStats.isCashfreeApproved = true;
        globalStats.lastPaymentError = null;
        globalStats.lastRawError = null;
        addLog(`Payment link created successfully: ${data.link_url}`, "success");
        return { success: true, url: data.link_url };
    } catch (e) { 
        globalStats.lastPaymentError = `Network/System Error: ${e.message}`;
        addLog(globalStats.lastPaymentError, "error");
        return { success: false, error: e.message }; 
    }
}
