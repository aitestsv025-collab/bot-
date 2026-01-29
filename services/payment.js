
import { CONFIG } from "../config.js";

export async function createPaymentLink(userId, amount, planName) {
    if (!CONFIG.CASHFREE_APP_ID || !CONFIG.CASHFREE_SECRET) {
        console.error("❌ Cashfree Credentials Missing in Config!");
        return null;
    }

    const isSandbox = CONFIG.CASHFREE_APP_ID.startsWith("TEST");
    const baseUrl = isSandbox ? "https://sandbox.cashfree.com/pg/links" : "https://api.cashfree.com/pg/links";
    
    // Create a unique link ID
    const linkId = `link_${userId}_${Date.now()}`;
    
    console.log(`[Payment] Generating ${isSandbox ? 'SANDBOX' : 'PROD'} link for user ${userId}...`);

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
                    customer_phone: "9999999999", 
                    customer_email: "user@soulmate.ai" 
                },
                link_id: linkId,
                link_amount: parseFloat(amount),
                link_currency: "INR",
                link_purpose: `Malini Premium: ${planName}`,
                link_meta: { 
                    // Redirect back to bot after payment
                    return_url: `https://t.me/${CONFIG.BOT_NAME.toLowerCase()}_bot`,
                    // Webhook URL for server-to-server confirmation
                    notify_url: `${CONFIG.HOST}/api/cashfree/webhook` 
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("❌ Cashfree API Error Response:", JSON.stringify(data));
            return null;
        }

        console.log(`✅ Link Created Successfully: ${data.link_url}`);
        return data.link_url || null;
    } catch (e) { 
        console.error("❌ Payment Link Request Failed:", e);
        return null; 
    }
}
