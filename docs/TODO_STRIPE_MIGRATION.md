# Stripe Sandbox Account Migration TODO

## Manual Steps Required

### 1. ⚠️ Stripe Webhook Configuration (CRITICAL)
Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/test/webhooks):

- [ ] Delete or disable the old webhook pointing to your n8n endpoint
- [ ] Create new webhook in the NEW Stripe account:
  - **Endpoint URL**: Your n8n webhook URL (e.g., `https://your-n8n-instance.com/webhook/stripe-confirmation-webhook`)
  - **Events**: `checkout.session.completed`
- [ ] Get the new **Webhook Signing Secret** (starts with `whsec_`)

### 2. n8n Stripe Credentials
If your n8n workflows use Stripe credentials directly:

- [ ] Update the Stripe credential with the new API keys:
  - **Public Key**: `pk_test_51SX3fTPj1OTNtDrGtV3qISKxvG12ZZANh9AiPP20GTWnCDCpHylgPz5GAJVwbCBYHoPd0ntsq5iqb9NKOfcCPS0o00ZZWoAVtg`
  - **Secret Key**: `sk_test_51SX3fTPj1OTNtDrGF3gdymNxmZKDuhiw2s6HP62JWi1YkhAqcbFN7TX8ryExaRE6IgOGLUkcBAdukKv8aELrJEFA00OqFXAHne`

### 3. Cloudflare Pages Environment Variables
Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages → Your project → Settings → Environment Variables:

- [ ] Update `STRIPE_SECRET_KEY` to: `sk_test_51SX3fTPj1OTNtDrGF3gdymNxmZKDuhiw2s6HP62JWi1YkhAqcbFN7TX8ryExaRE6IgOGLUkcBAdukKv8aELrJEFA00OqFXAHne`
- [ ] Update `STRIPE_PUBLISHABLE_KEY` (if set) to: `pk_test_51SX3fTPj1OTNtDrGtV3qISKxvG12ZZANh9AiPP20GTWnCDCpHylgPz5GAJVwbCBYHoPd0ntsq5iqb9NKOfcCPS0o00ZZWoAVtg`
- [ ] Trigger a new deployment to pick up the changes

---

## Automated Changes (Done by Agent)

- [x] Updated fallback key in `platform/widget/functions/api/create-session.js`

---

*Created: 2025-12-30*
