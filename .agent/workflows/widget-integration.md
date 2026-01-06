---
description: Checklist for integrating the booking widget for a new clinic client
---

# Widget Integration Checklist

When you mention "new client", "integrate widget", or "onboarding a clinic", follow this checklist:

---

## 📋 PRE-INTEGRATION: Information to Collect

Before starting, collect from client:

- [ ] **Clinic name** (official business name)
- [ ] **Domain/website URL** (where widget will be embedded)
- [ ] **Business email** (for notifications and contact)
- [ ] **Phone number** (for WhatsApp/contact)
- [ ] **Physical address** (for legal pages)
- [ ] **Business registration number** (optional, for legal pages)
- [ ] **List of services** with prices and durations
- [ ] **List of specialists/doctors** with names and roles
- [ ] **Working hours** for each day of the week
- [ ] **Logo image** (if they want custom branding)

---

## 🔧 CONFIGURATION CHANGES REQUIRED

### 1. Environment Variables (`.env`)

**File:** `platform/widget/.env`

```env
VITE_CLINIC_ID=<new_clinic_id>  # Currently: demo
```

### 2. Wrangler Configuration

**File:** `platform/widget/wrangler.toml`

```toml
name = "<new-clinic-name>-booking"  # Currently: butkevica-dental-booking
```

### 3. Privacy Policy URL in Widget

**File:** `platform/widget/components/PatientForm.tsx` (lines 211, 214, 217)

Replace `https://klinika.lv/privacy_policy.html` with client's actual privacy policy URL:

```tsx
// Line 211 (Latvian)
<a href="https://CLIENT_DOMAIN/privacy_policy.html" ...>Privātuma politiku</a>

// Line 214 (English)  
<a href="https://CLIENT_DOMAIN/privacy_policy.html" ...>Privacy Policy</a>

// Line 217 (Russian)
<a href="https://CLIENT_DOMAIN/privacy_policy.html" ...>Политике конфиденциальности</a>
```

### 4. Fallback Clinic Config

**File:** `platform/widget/constants.ts` (line 166-179)

Update `DEFAULT_CLINIC` with client's info:

```typescript
export const DEFAULT_CLINIC: Clinic = {
    id: '<client_id>',
    name: '<Client Clinic Name>',
    domain: '<client-domain.com>',
    logoUrl: '',
    clinicEmail: '<client@email.com>',
    theme: {
        primaryColor: '#0d9488'  // Adjust to client's brand color
    },
    settings: {
        currency: 'EUR',
        timezone: 'Europe/Riga'
    }
};
```

---

## 🗄️ DATABASE SETUP (Supabase)

### Option A: Use existing Supabase project
Run the SQL scripts in order:
1. `sql/01_init_saas_schema.sql` - Creates tables
2. Create a new seed file like `sql/02_seed_<client>_clinic.sql` based on `02_seed_sample_clinic.sql`

### Option B: New Supabase project per client
1. Create new Supabase project
2. Update `.env` with new credentials:
   ```env
   VITE_SUPABASE_URL=<new_project_url>
   VITE_SUPABASE_ANON_KEY=<new_anon_key>
   ```
3. Run all SQL migrations

### Database seed file must include:
- [ ] Clinic record in `clinics` table
- [ ] Services in `services` table (with proper clinic_id prefix)
- [ ] Specialists in `specialists` table (with proper clinic_id prefix)
- [ ] Working hours in `working_hours` table
- [ ] (Optional) Custom translations in `clinic_translations` table

---

## 💳 STRIPE SETUP

- [ ] Get client's Stripe account or create sub-account
- [ ] Configure Stripe webhook endpoint
- [ ] Update n8n workflow with new Stripe credentials
- [ ] Test payment flow end-to-end

---

## 📧 N8N WORKFLOWS

Update these workflows with client's branding:

- [ ] **Booking confirmation email** - Update clinic name, logo, address
- [ ] **Reminder SMS/email** - Update clinic branding
- [ ] **Cancellation email** - Update clinic branding

**Webhook URLs to configure:**
- `VITE_N8N_AVAILABILITY_URL` in `.env`
- `VITE_API_URL` for payment session creation

---

## 📄 LEGAL PAGES

### Templates ready at:
- `/marketing/privacy_policy.html` - Latvian GDPR-compliant privacy policy
- `/marketing/terms_of_use.html` - Latvian terms of service

### Customization required:
- [ ] Update business name throughout
- [ ] Update contact email (currently: adriansbusinessw@gmail.com)
- [ ] Update WhatsApp number (currently: +371 2730 7068)
- [ ] Update business address if applicable
- [ ] Host on client's domain or provide URL

---

## 🚀 DEPLOYMENT

### Cloudflare Pages
```bash
cd platform/widget
npm run build
npx wrangler pages deploy dist
```

### Get embed code for client:
```html
<iframe 
  src="https://<project-name>.pages.dev/?clinic=<clinic_id>"
  width="100%" 
  height="800" 
  frameborder="0">
</iframe>
```

---

## ✅ POST-DEPLOYMENT CHECKLIST

- [ ] Test full booking flow (service → date → details → payment)
- [ ] Verify confirmation email arrives with correct branding
- [ ] Verify booking appears in dashboard
- [ ] Test cancellation flow
- [ ] Provide admin dashboard access to client
- [ ] Brief training on dashboard usage

---

## 📂 FILES THAT NEED CHANGES PER CLIENT

| File | What to Change |
|------|----------------|
| `.env` | `VITE_CLINIC_ID`, Supabase/Stripe keys if separate |
| `wrangler.toml` | Project name |
| `PatientForm.tsx` | Privacy policy URL (3 places) |
| `constants.ts` | `DEFAULT_CLINIC` fallback config |
| `sql/02_seed_*.sql` | Create new seed file for client |
| `/marketing/*.html` | Customize legal pages with client info |
