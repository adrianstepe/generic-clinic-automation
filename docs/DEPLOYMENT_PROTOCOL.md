# Protocol: Rapid Client Deployment (<5 Minutes)

## Goal
Go from "Client says YES" to "Live Website" in under 5 minutes.

## Prerequisites
*   **Repo:** The `marketing` folder in your monorepo.
*   **Cloudflare Account:** Active and logged in.
*   **Domain:** Bought via Namecheap/GoDaddy (or client's existing domain).

## The Pipeline

### 1. Prepare the Asset (2 Minutes)
1.  **Generate:** Run `render_mockup.py` for the specific client (if not already done).
    ```bash
    python3 marketing/templates/render_mockup.py
    ```
    *   *Result:* `marketing/outreach/[clinic_slug]/preview.html`
2.  **Isolate:** Copy the generated HTML to a clean deploy folder.
    ```bash
    mkdir -p deployments/[clinic_slug]
    cp marketing/outreach/[clinic_slug]/preview.html deployments/[clinic_slug]/index.html
    # Copy any shared assets (CSS/Images) if they aren't CDNs
    ```

### 2. Deploy to Cloudflare Pages (2 Minutes)
1.  **Go to:** [Cloudflare Dashboard](https://dash.cloudflare.com) > **Workers & Pages** > **Create Application** > **Pages** > **Upload Assets**.
2.  **Project Name:** `[clinic-slug]-website` (e.g., `alpha-dental-lv`).
3.  **Upload:** Drag & Drop the `deployments/[clinic_slug]` folder.
4.  **Deploy:** Click "Deploy Site".
    *   *Result:* You get a `https://alpha-dental-lv.pages.dev` URL instantly.

### 3. Domain Connection (1 Minute)
*If the client gives you a domain:*
1.  **Cloudflare:** Custom Domains > Set up a custom domain.
2.  **Enter:** `www.[clinic].lv`.
3.  **DNS:** Cloudflare gives you `CNAME` or `Nameserver` records.
4.  **Registrar:** Login to their NIC.lv / Namecheap and update records.

---

## ⚡ The "Widget" Injection (Post-Deployment)
Once the site is live, you enable the booking engine.

1.  **Edit:** `deployments/[clinic_slug]/index.html`.
2.  **Inject:** Add the iframe code into the `#book` container.
    ```html
    <div id="book" class="booking-card-container">
        <iframe 
            src="https://widget.antigravity.lv/embed?clinic_id=[CLINIC_ID]"
            style="width: 100%; height: 600px; border: none; overflow: hidden;"
            title="Online Booking"
        ></iframe>
    </div>
    ```
3.  **Redeploy:** Drag & Drop the folder to Cloudflare again (creates a new deployment hash).

---

## 🎒 "Go-Bag" Checklist
Have these ready on Monday:
- [ ] Cloudflare Login Credentials saved.
- [ ] `render_mockup.py` tested and working.
- [ ] This protocol open in a tab.
