# The "Before You Sell" Checklist

You cannot sell this en masse yet. It currently runs as "Butkevica's Custom Software". Scaling now would be an operations nightmare.

## 🚧 1. Technical "Must-Haves" (The Missing Pieces)

### A. Exorcise the Hardcoded Strings (CRITICAL)
Your code is full of hardcoded values that must be replaced with dynamic database lookups.

*   **Logo/Branding:** The widget hardcodes Butkeviča Dental.
    *   *Fix:* Fetch `clinic_name` and `logo_url` from the database `businesses` table.
*   **Emails:** Workflows hardcode `info@drbutkevicadentalpractice.com` as the sender/reply-to.
    *   *Fix:* Update n8n workflows to read `clinic_email` from the trigger data.
*   **Currency/Locale:** Currently hardcoded to EUR and Europe/Riga.
    *   *Fix:* Make config-driven (future-proofing for Estonia/Lithuania).

### B. The "Onboarding" Configurator
*   **Problem:** Adding a new clinic currently requires you to manually edit SQL, deploy Cloudflare pages, and clone n8n workflows.
*   **Solution:** Create an "Admin Super-Dashboard" for yourself.
    *   **Button:** "Create New Clinic"
    *   **Input:** Name, Email, Stripe Keys, Services List.
    *   **Action:** Generates the `clinic_id` and config entries in Supabase.

### C. Stripe Connect (Payments)
*   **Current:** Direct Stripe keys.
*   **Missing:** A way to route money to different clinics.
*   **Action:**
    *   *Option A (Fastest):* Ask each client for their Stripe Secret Key and save it (encrypted) in your DB.
    *   *Option B (Best):* Implement Stripe Connect. You act as the platform, they onboard as "merchants". You can even take a % cut of every deposit automatically.

## ⚖️ 2. Legal & Trust "Must-Haves"

*   **Generic Privacy Policy:** You need a "White Label" privacy policy that covers data processing, not just Butkevica's.
*   **Data Processing Agreement (DPA):** Clinics are Data Controllers; you are the Data Processor. You need a standard contract saying you are GDPR compliant.

## 📦 3. Sales Assets

### Demo Environment:
*   Deploy a version at `demo.yourdomain.com`.
*   **Fake Clinic Name:** "Nordic Smile Dental".
*   Let user test the flow without charging real cards (Stripe Test Mode).

## 4. Recommended Action Plan (Next 2 Weeks)

1.  **Refactor:** Replace `info@drbutkevicadentalpractice.com` with `{{clinic_email}}` everywhere.
2.  **Multi-Tenant Test:** Create a fake second clinic in the DB (`clinic_id: 'demo'`). Verify that booking on the demo widget does NOT show up in Butkevica's dashboard.
3.  **Launch:** Sell to 1 pilot client at a discount (€0 setup, €49/mo) specifically to test your onboarding process. Do not sell to 10 at once until the first one is smooth.
