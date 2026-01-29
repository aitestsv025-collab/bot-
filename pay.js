
const CF_APP_ID = (process.env.CASHFREE_APP_ID || "").trim();
const CF_SECRET = (process.env.CASHFREE_SECRET || "").trim();

export async function createPaymentLink(userId, amount, planName) {
    if (!CF_APP_ID || !CF_SECRET) return null;
    const baseUrl = "https://api.cashfree.com/pg/links";
    const orderId = `order_${userId}_${Date.now()}`;
    
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
                link_amount: amount,
                link_currency: "INR",
                link_purpose: `Unlock ${planName} Access`,
                link_meta: { 
                  return_url: `https://t.me/soulmate_ai_bot`,
                  notify_url: `https://${process.env.RENDER_EXTERNAL_HOSTNAME || 'localhost'}/api/cashfree/webhook`
                }
            })
        });

        const data = await response.json();
        return data.link_url || null;
    } catch (error) {
        console.error("Cashfree Error:", error);
        return null;
    }
}
