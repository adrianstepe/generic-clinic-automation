// Native fetch is available in Node.js 18+

// CONFIGURATION
// User must provide their Cloudflare URL here
const CLOUDFLARE_URL = process.argv[2];

if (!CLOUDFLARE_URL) {
    console.error("❌ Error: Please provide your Cloudflare URL as an argument.");
    console.error("Usage: node scripts/simulate-stripe-event.js https://your-project.pages.dev");
    process.exit(1);
}

const WEBHOOK_ENDPOINT = `${CLOUDFLARE_URL.replace(/\/$/, '')}/api/webhook`;

const mockEvent = {
    id: "evt_test_webhook_simulation",
    object: "event",
    type: "checkout.session.completed",
    created: Math.floor(Date.now() / 1000),
    data: {
        object: {
            id: "cs_test_simulation",
            object: "checkout.session",
            amount_total: 3000,
            currency: "eur",
            payment_status: "paid",
            metadata: {
                customer_name: "Test User",
                customer_email: "test@example.com",
                booking_date: "2024-01-01",
                booking_time: "10:00",
                service_id: "s1"
            }
        }
    }
};

console.log(`🚀 Sending mock Stripe event to: ${WEBHOOK_ENDPOINT}`);

try {
    const response = await fetch(WEBHOOK_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Stripe-Signature': 't=123,v1=fake_signature' // Mock signature
        },
        body: JSON.stringify(mockEvent)
    });

    console.log(`\n📥 Response Status: ${response.status} ${response.statusText}`);

    const text = await response.text();
    console.log(`📄 Response Body: ${text}`);

    if (response.ok) {
        console.log("\n✅ SUCCESS: Cloudflare accepted the request.");
        console.log("👉 NOW CHECK N8N: Did the 'Stripe Confirmation' workflow execute?");
    } else {
        console.log("\n❌ FAILURE: Cloudflare rejected the request.");
        console.log("👉 CHECK CLOUDFLARE LOGS: Why did it fail?");
    }

} catch (error) {
    console.error("\n💥 NETWORK ERROR:", error.message);
}
