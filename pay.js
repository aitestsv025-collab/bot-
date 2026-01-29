
const CF_APP_ID = (process.env.CASHFREE_APP_ID || "").trim();
const CF_SECRET = (process.env.CASHFREE_SECRET || "").trim();

export async function createPaymentLink(userId, amount, planName) {
    if (!CF_APP_ID || !CF_SECRET) {
        console.error("❌ Cashfree Credentials Missing!");
        return null;
    }

    // Auto-detect Sandbox vs Production
    const isSandbox = CF_APP_ID.startsWith("TEST") || CF_APP_ID.includes("sandbox");
    const baseUrl = isSandbox 
        ? "https://sandbox.cashfree.com/pg/links" 
        : "https://api.cashfree.com/pg/links";
    
    const orderId = `order_${userId}_${Date.now()}`;
    const host = process.env.RENDER_EXTERNAL_HOSTNAME || 'your-app-domain.com';
    
    try {
        const response = await fetch(baseUrl, {
            method: 'POST',
            headers: {
                'x-client-id': CF_APP_ID,
                'x-client-secret': CF_SECRET,
                'x-api-version': '2023-08-01',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                customer_details: {
                    customer_id: userId.toString(),
                    customer_phone: "9999999999", 
                    customer_email: "customer@example.com"
                },
                link_id: orderId,
                link_amount: parseFloat(amount),
                link_currency: "INR",
                link_purpose: `Unlock ${planName} Access`,
                link_meta: { 
                  return_url: `https://t.me/soulmate_ai_bot`,
                  // Webhook must be accessible by Cashfree (HTTPS required)
                  notify_url: `https://${host}/api/cashfree/webhook`
                }
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error("❌ Cashfree API Error:", data);
            return null;
        }

        console.log(`✅ Payment Link Created: ${data.link_url}`);
        return data.link_url || null;
    } catch (error) {
        console.error("❌ Cashfree Request Failed:", error);
        return null;
    }
}
