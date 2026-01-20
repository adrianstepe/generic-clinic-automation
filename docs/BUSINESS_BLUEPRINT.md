# Dental Booking Automation - System Architecture & Business Logic

## 1. System High-Level Overview
This is a comprehensive dental booking automation platform composed of four integrated components:
1.  **The Brain (Supabase):** Centralized database for bookings, services, and user profiles, secured with Row Level Security (RLS).
2.  **The Face (Cloudflare Widget):** A React-based frontend embedded on the clinic's website, handling the user booking flow and payment processing via Stripe.
3.  **The Nervous System (n8n):** An automation engine that orchestrates complex logic like availability checking, booking confirmation, reminders, and review requests. **This is the single source of truth for all booking writes.**
4.  **The Control Center (Admin Dashboard):** A secure interface for clinic staff to view and manage appointments directly within the database.

## 2. Database Mechanics (Supabase)

### Core Entities

#### `bookings` (Primary Table)
Central record of all appointments with full payment tracking.

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| `id` | uuid | PK | Auto-generated |
| `customer_name` | varchar | ✅ | Patient name |
| `customer_email` | varchar | ✅ | Patient email |
| `customer_phone` | varchar | ❌ | Patient phone |
| `start_time` | timestamptz | ✅ | Appointment start |
| `end_time` | timestamptz | ✅ | Appointment end |
| `status` | varchar | ✅ | confirmed/completed/cancelled |
| `service_id` | text | ❌ | FK → services.id |
| `service_name` | text | ❌ | Denormalized for display |
| `doctor_id` | uuid | ❌ | FK → profiles.id |
| `amount_paid` | numeric | ❌ | Deposit amount (€) |
| `amount_cents` | integer | ❌ | Raw Stripe amount |
| `currency` | varchar | ❌ | Default: EUR |
| `stripe_session_id` | varchar | ❌ | Stripe checkout session |
| `payment_intent_id` | varchar | ❌ | For refunds |
| `booking_token` | uuid | ❌ | Auto-generated |
| `client_reference` | varchar | ❌ | Human-readable ref (BK-XXXXX) |
| `business_id` | varchar | ❌ | Multi-tenant support |
| `language` | varchar | ❌ | en/lv/ru - user's language preference |
| `cancellation_token` | varchar | ❌ | Secure token for self-service cancellation |
| `cancelled_at` | timestamptz | ❌ | When booking was cancelled |
| `refund_status` | varchar | ❌ | processed/not_eligible/failed |
| `specialist_id` | text | ❌ | Assigned specialist ID (result of selection or auto-assignment) |
| `created_at` | timestamptz | Auto | |
| `updated_at` | timestamptz | Auto | |
| `expires_at` | timestamptz | ❌ | For pending bookings |

#### `services`
| Column | Type | Required | Notes |
|--------|------|----------|-------|
| `id` | text | PK | Service identifier |
| `business_id` | varchar | ✅ | |
| `name` | varchar | ✅ | Service name |
| `duration_minutes` | integer | ❌ | Default: 30 |
| `price_cents` | integer | ❌ | Default: 0 |
| `currency` | varchar | ❌ | Default: EUR |

#### `profiles`
| Column | Type | Required | Notes |
|--------|------|----------|-------|
| `id` | uuid | PK | Links to auth.users |
| `full_name` | text | ❌ | Doctor/admin name |
| `role` | text | ❌ | doctor/admin |
| `avatar_url` | text | ❌ | |
| `color_code` | text | ❌ | Calendar color |
| `created_at` | timestamptz | Auto | |

#### `doctors_services` (Join Table)
| Column | Type | Notes |
|--------|------|-------|
| `doctor_id` | uuid | PK, FK → profiles.id |
| `service_id` | text | PK |

#### `workflow_logs`
Audit trail for n8n automation events.

#### `businesses`
Multi-tenant support (currently single tenant).

#### `clinic_services` (Dynamic Configuration)
Replaces hardcoded SERVICES array in `constants.ts`. Allows service changes without redeployment.

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| `id` | text | PK | Service identifier (s1, s2, etc.) |
| `business_id` | text | ✅ | Default: BUTKEVICA_DENTAL |
| `name_en` | text | ✅ | English name |
| `name_lv` | text | ✅ | Latvian name |
| `name_ru` | text | ❌ | Russian name |
| `description_en` | text | ❌ | English description |
| `description_lv` | text | ❌ | Latvian description |
| `description_ru` | text | ❌ | Russian description |
| `price_cents` | integer | ✅ | Price in cents (€50 = 5000) |
| `duration_minutes` | integer | ✅ | Default: 30 |
| `display_order` | integer | ❌ | For ordering in UI |
| `is_active` | boolean | ❌ | Default: true |

#### `specialists` (Dynamic Configuration)
Replaces hardcoded SPECIALISTS array in `constants.ts`.

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| `id` | text | PK | Specialist identifier (d1, d2, etc.) |
| `clinic_id` | text | ✅ | Links to `clinics.id` |
| `name` | text | ✅ | Full name |
| `role` | jsonb | ❌ | Localized role (en, lv, ru) |
| `photo_url` | text | ❌ | Avatar URL |
| `specialties` | text[] | ❌ | **CRITICAL:** Array of service IDs they are qualified for. Used by auto-assignment logic. |
| `is_active` | boolean | ❌ | Default: true |
| `display_order` | integer | ❌ | For ordering in UI |
| `created_at` | timestamptz | Auto | |

### Automated Logic & Security
*   **RLS Policies:**
    *   **Public:** Can view `services`, `profiles`, `clinic_services`, `clinic_specialists`. Can insert `bookings` (unauthenticated).
    *   **Authenticated (Doctors/Admins):** Can view/update `bookings`. Can manage `clinic_services` and `clinic_specialists`.
*   **Data Integrity:**
    *   `sql/fix_services_data.sql`: Ensures valid service IDs are assigned to bookings.
    *   `sql/update_bookings_schema.sql`: Manages schema evolution (e.g., adding `doctor_id`) and inserts dummy data for testing.
    *   `sql/saas_migration.sql`: Creates dynamic config tables and adds idempotency protection.
    *   **Idempotency:** `stripe_session_id` has UNIQUE constraint. If Stripe sends duplicate webhooks, DB rejects the duplicate insert.


## 3. Booking Widget Logic (Cloudflare)
### Behavioral Flow
1.  **Initialization:**
    *   Loads state from `localStorage` (persistence across reloads).
    *   "Warms up" the n8n availability workflow on mount.
2.  **User Journey:**
    *   **Step 1 (Service):** User selects a service.
    *   **Step 2 (Time):** User selects a date. Widget calls `checkAvailability(date)` API.
    *   **Step 3 (Details):** User enters contact info. Validates phone/email.
    *   **Step 4 (Payment):**
        *   Calls `/api/create-session` (Cloudflare Function).
        *   Creates a Stripe Checkout Session with extensive metadata (booking details, customer info, **language**).
        *   Redirects user to Stripe.
3.  **Post-Payment:**
    *   Stripe redirects back to widget with `?success=1`.
    *   Widget displays Confirmation screen (display only - **no database writes**).
    *   **Backend:** Stripe sends a webhook to `/api/webhook`, which forwards the event to n8n.
    *   **Architecture Note:** The frontend does NOT write to the database. This was removed to fix a dual-write race condition. See section 6.

### API Endpoints (Cloudflare Functions)
*   **`POST /api/create-session`**:
    *   **Input:** Service details, amount, booking metadata.
    *   **Action:** Calls Stripe API to create a session.
    *   **Output:** Stripe Session ID and URL.
*   **`POST /api/webhook`**:
    *   **Input:** Stripe Event (JSON).
    *   **Action:** Validates event type (`checkout.session.completed`) and forwards payload to n8n.
    *   **Output:** 200 OK (if forwarded successfully), **502 if n8n fails** (triggers Stripe retry for up to 72h).

## 4. Automation Workflows (n8n)

### Workflow A: Stripe Confirmation (`n8n-2-stripe-confirmation-supabase.json`)
*   **Trigger:** Webhook (received from Cloudflare → Stripe).
*   **Integration:** Uses **native Supabase node** (not HTTP requests) for cleaner integration.
*   **Logic Path:**
    1.  **Filter:** Ensures event is `checkout.session.completed`.
    2.  **Extract:** Code node parses metadata (Customer Name, Email, Phone, Service, Date/Time). Extract `doctor_id` (if selected) and `service_id`.
    3.  **Auto-Assignment Logic:**
        -   IF `doctor_id` is null (Patient chose "Any Available Specialist"):
            -   **Fetch Qualifiers:** Query `specialists` table for doctors whose `specialties` array contains the current `service_id`.
            -   **Random Selection:** If multiple qualified doctors found, randomly select one for fair distribution.
            -   **Assign:** Update booking data with selected `specialist_id` and `specialist_name`.
        -   IF `doctor_id` is provided: Use the pre-selected specialist.
    4.  **Language Logic:** Priority 1: `metadata.language` from widget. Priority 2: Phone-based fallback.
    5.  **Database:** Native Supabase node inserts record into `bookings` table. **(Single source of truth for writes)**
    6.  **Email:** Sends confirmation email via Gmail (localized). **Now includes assigned specialist name.**
    7.  **Calendar:** Adds event to Google Calendar. Includes specialist name in description for staff internal view.
*   **Fields Saved:** `customer_name`, `customer_email`, `customer_phone`, `service_id`, `service_name`, `start_time`, `end_time`, `status`, `amount_paid`, `language`, `cancellation_token`, `payment_intent_id`, `stripe_session_id`, `specialist_id`
*   **Outcome:** Booking saved in DB with auto-assigned doctor, Client notified with doctor name, Calendar updated.
*   **GDPR Compliance:** Calendar events show only `Vizīte BK-XXXXX` with link to secure dashboard. No patient names, emails, or phone numbers in calendar.
*   **Error Handling:** All nodes use `onError: stopWorkflow` to trigger Error Trigger node.

### Workflow B: Daily Reminders & Smart Recall (`n8n-7-daily-reminders-and-recall.json`)
*   **Trigger:** Cron (Daily at 9:00 AM Europe/Riga) + Manual Trigger for testing.
*   **Integration:** Uses **native Supabase nodes** with Code nodes for date calculations.
*   **Two Parallel Flows:**

**Flow 1: Tomorrow's Appointment Reminders**
1.  **Calculate:** Code node computes tomorrow's date range.
2.  **Fetch:** Supabase node queries `bookings` where `status=confirmed` and `start_time` is tomorrow.
3.  **Language Logic:** Priority 1: Stored `language` from booking record. Priority 2: Phone-based fallback (371 prefix → LV, else EN).
4.  **Email:** Professional HTML templates with teal gradient header, appointment details card, Google Maps link.
5.  **SMS:** Optional Twilio integration (requires client's Twilio number).
*   **Outcome:** Patients reminded 24h in advance with beautiful branded emails.

**Flow 2: 6-Month Smart Recall**
1.  **Fetch:** Supabase node gets past and future bookings.
2.  **Filter:** Code node identifies patients whose last appointment was ~6 months ago, excluding those with future appointments.
3.  **Email:** Professional HTML recall email with booking CTA button.
*   **Outcome:** Automated patient retention.

### Workflow C: Check Availability (Supabase Edge Function + n8n Fallback)
*   **Primary:** Supabase Edge Function (`/functions/v1/check-availability`).
*   **Fallback:** n8n Webhook (`n8n-4-check-availability.json`) - deprecated, kept for resilience.
*   **Trigger:** Widget calls `GET ?date=YYYY-MM-DD`.
*   **Logic Path (Edge Function):**
    1.  **Fetch DB:** Direct Supabase query for `bookings` on the date (no HTTP hop).
    2.  **Fetch GCal:** Google Calendar API via service account (optional).
    3.  **Calculate:** Generates 9:00-17:00 slots, subtracts busy times.
*   **Outcome:** Returns `{ slots: [{ time: "09:00", available: true }, ...] }`.
*   **Resilience:** If Edge Function fails, widget automatically falls back to n8n.
*   **Directive:** See `directives/edge-function-availability.md` for deployment instructions.

### Workflow D: Google Review Request (`n8n-5-google-review-request.json`)
*   **Trigger:** Cron (Every 30 minutes).
*   **Integration:** Uses **native Supabase node** with time window calculation.
*   **Logic Path:**
    1.  **Calculate:** Code node computes 3h to 3.5h ago time window.
    2.  **Fetch:** Supabase node queries completed appointments in window.
    3.  **Email:** Professional HTML email with ⭐⭐⭐⭐⭐ rating display, amber review button, and feedback section.
*   **Outcome:** Automated reputation management with branded emails.

### Workflow E: Self-Service Cancellation (`n8n-8-cancellation.json`)
*   **Trigger:** Webhook (POST from `/api/process-cancellation` Cloudflare Function).
*   **Frontend:** `cancel-booking.html` - Standalone cancellation page with tri-lingual support (EN/LV/RU).
*   **Integration:** Uses **native Supabase node** for status updates + **Stripe API** for refunds.
*   **Logic Path:**
    1.  **Extract:** Code node parses cancellation request (booking_id, customer details, language).
    2.  **Refund Check:** IF node checks `is_refund_eligible` (>24h before appointment = eligible).
    3.  **Refund (if eligible):** HTTP Request to Stripe API `POST /v1/refunds` with `payment_intent`.
    4.  **Update DB:** Native Supabase node updates booking status to `cancelled`, sets `refund_status`.
    5.  **Email:** Professional HTML cancellation confirmation (localized) with refund status.
    6.  **Alert:** Telegram notification to clinic with cancellation details.
*   **Refund Policy:** 
    - **>24h before:** Full deposit refund (€30) processed via Stripe.
    - **<24h before:** No refund (deposit retained as no-show fee).
*   **Outcome:** Patients can self-cancel; clinic is notified; refunds processed automatically.

### Cancellation System Flow
```
Confirmation Email → "Cancel Appointment" Link
                              ↓
                    cancel-booking.html?token=XXX
                              ↓
                    /api/get-booking (fetch details)
                              ↓
                    User confirms cancellation
                              ↓
                    /api/process-cancellation
                              ↓
                    n8n-8 → Stripe Refund → DB Update → Email → Telegram
```

**Database Columns Added:**
| Column | Type | Notes |
|--------|------|-------|
| `cancellation_token` | varchar | Secure token for self-service link |
| `cancelled_at` | timestamptz | When cancelled |
| `refund_status` | varchar | processed/not_eligible/failed |
| `language` | varchar | en/lv/ru (for email localization) |

## 5. Admin Dashboard Functions
### Key Operations
*   **View Bookings:**
    *   **Action:** `fetchBookings()` calls `supabase.from('bookings').select('*')`.
    *   **Backend Effect:** Retrieves all bookings (subject to RLS - Admin sees all).
*   **Update Status:**
    *   **Action:** User changes dropdown (Confirmed/Completed/Cancelled).
    *   **Backend Effect:** `supabase.from('bookings').update({ status }).eq('id', id)`.
    *   **Note:** Direct database manipulation, bypassing n8n (unless DB triggers are added later).

---

## 6. Architecture Decisions & Compliance (Updated 2025-12-07)

### 6.1 Data Flow: Single Source of Truth
**Problem Solved:** Dual-write race condition where both frontend AND n8n wrote to Supabase.

**Previous Architecture (Bad):**
```
Payment Complete
    ├── Frontend Confirmation.tsx → Supabase (Path A)
    └── Stripe Webhook → n8n → Supabase (Path B)
    
Result: Duplicate entries OR orphaned records if one path failed
```

**Current Architecture (Fixed):**
```
Payment Complete
    └── Stripe Webhook → Cloudflare → n8n → Supabase (Only Path)
    
Frontend: Display only, no database writes
Stripe retries: Up to 72 hours if n8n fails (webhook.js returns 502)
```

### 6.2 GDPR Compliance (Art. 9 - Special Categories of Personal Data)
**Problem Solved:** Patient PII (name + medical service = sensitive data) exposed in shared Google Calendar.

**Fix Applied:** Calendar events are pseudonymized:
- **Before:** `Implants - John Smith` with full patient details
- **After:** `Vizīte BK-M5X9K2` with link to RLS-protected dashboard

**Directive:** See `directives/n8n-gdpr-execution-logs.md` for execution log configuration.

### 6.3 Error Handling (Dead Letter Queue)
**Requirement:** Add Error Trigger node to n8n workflow to alert on failures.

**Directive:** See `directives/n8n-dead-letter-queue.md` for DLQ setup and error monitoring.

### 6.4 Language Detection (Improved)
**Previous:** Phone-based only (brittle for expats/roaming).
**Current:** 
1. Priority 1: `metadata.language` from widget (user's actual selection)
2. Priority 2: Phone-based fallback (for legacy data)

### 6.5 Availability Check Resilience (Updated 2025-12-07)
**Problem Solved:** n8n VPS uptime dependency for critical user-facing `checkAvailability` interaction.

**Previous Architecture (Fragile):**
```
Widget → n8n VPS → Supabase + GCal → Widget
         ↑
    If n8n down: User stuck on spinner
```

**Current Architecture (Resilient):**
```
Widget → Supabase Edge Function → Supabase + GCal → Widget
         ↓ (automatic fallback)
         n8n VPS (deprecated, kept for backup)
```

**Benefits:**
- Supabase Edge Function is serverless, auto-scaling, no VPS to maintain
- Direct database access (no HTTP hop = lower latency)
- Automatic fallback to n8n if Edge Function fails
- n8n reserved for async tasks (emails, reminders) only

**Directive:** See `directives/edge-function-availability.md` for deployment.

### 6.6 UI/UX Improvements (Updated 2025-12-14)

**Light Mode Default:**
- Widget defaults to light mode for professional medical aesthetic
- Users can toggle dark mode (persisted to localStorage)

**Extended Booking Window:**
- Calendar shows 8+ months in advance
- Traffic light availability indicators

**Redesigned Payment Summary:**
- Receipt-style pricing with clear deposit breakdown
- Cleaner date format: "Mon, 8 Dec • 09:00"

**Enhanced Service Selection:**
- Service icons for quicker scanning
- Descriptions under each service
- "I'm in Pain / Emergency" quick option
- Information tooltips for price variations

**Improved Patient Details Form:**
- Clear section headers (Patient Information, Contact Information)
- Country code selector with flags
- Trust signal: "🔒 Your information is secure"

### 6.7 n8n Supabase Integration (Updated 2025-12-09)

**Problem Solved:** HTTP Request nodes for Supabase were brittle and error-prone.

**Previous Approach (Deprecated):**
- HTTP Request node with manual headers (`apikey`, `Content-Type`, `Prefer`)
- Manual JSON body construction with escaping issues
- Generic HTTP error codes

**Current Approach:**
- Native Supabase node with visual field mapper
- Built-in credential management (Supabase URL + Service Role Key)
- Clear Supabase-specific error messages
- Auto-detection of table columns

**n8n Supabase Credential Setup:**
| Field | Value |
|-------|-------|
| Host | `https://mugcvpwixdysmhgshobi.supabase.co` |
| Service Role Secret | Found in Supabase → Settings → API → `service_role` |

> ⚠️ Use `service_role` key (not `anon`) — it bypasses RLS for backend operations.

### 6.8 Dead Letter Queue (DLQ) - Black Box Recorder (Updated 2025-12-09)

**Problem Solved:** If Supabase fails during booking write, patient payment data is lost.

**Solution:** "Black Box Recorder" pattern — failed writes are captured locally and recovered later.

```
Payment → n8n → Save to Supabase
                     │
            ┌────────┴────────┐
            ↓                 ↓
        [SUCCESS]         [FAILURE]
            ↓                 ↓
       Email/Calendar    Error Trigger
                              ↓
                        Save to DLQ (/home/n8n/dlq/)
                              ↓
                        Telegram Alert
```

**Sales Guarantee:**
> *"Our system includes a **Black Box Recorder**. Even in a total server outage, no patient payment is ever lost. Failed transactions are automatically queued locally and recovered when systems are restored."*

**Recovery Options:**
1. **Automatic:** Python script `execution/recovery_dlq.py` scans and re-inserts
2. **Manual:** JSON files in `/home/n8n/dlq/` contain full booking data

**SLA:** Failed bookings recovered within 24 hours (monitored via Telegram alerts).

**Directive:** See `directives/n8n-dead-letter-queue.md` for setup and recovery procedures.

### 6.9 Multi-Language Support (Updated 2025-12-14)

**Full Tri-lingual Support:** English (EN), Latvian (LV), Russian (RU)

**Language Storage:**
- Language preference saved to `bookings.language` column on payment
- All subsequent communications use stored language
- Widget sends `metadata.language` to Stripe → n8n → Supabase

**Localized Communications:**
| Communication | Languages |
|--------------|----------|
| Confirmation Email | EN, LV, RU |
| Reminder Email (24h) | EN, LV, RU |
| Cancellation Email | EN, LV, RU |
| 6-Month Recall Email | EN, LV |
| Review Request Email | EN, LV |
| SMS Reminders | EN, LV, RU |

**Email Templates:**
- Professional HTML design with teal gradient headers
- Responsive layout for mobile
- Clear CTA buttons with Google Maps links
- Service details, date/time in localized format

### 6.10 Enhanced Reminder System (Updated 2025-12-14)

**Professional HTML Reminder Emails:**
- Visual appointment card with date/time/service
- Google Maps link for clinic location
- Latvian text: "⏰ Jūsu vizīte ir ieplānota rīt, plkst. 14:00"
- Mobile-responsive design

**Dual-Track Workflow:**
1. **Tomorrow's Appointments:** Cron 9AM → Fetch confirmed bookings for tomorrow → Send reminders
2. **6-Month Smart Recall:** Fetch patients whose last visit was ~6 months ago → Send recall emails

**Language Priority:**
1. Stored `language` from booking record
2. Phone-based detection fallback (371 prefix → LV, else EN)

### 6.11 Race Condition Prevention - Slot Locking (Added 2025-12-14)

**Problem Solved:** Two users could book the same time slot if they both started checkout within seconds of each other.

**Scenario Without Fix:**
```
10:00:00 - Patient A checks Monday 2pm → "Available ✅"
10:00:01 - Patient B checks Monday 2pm → "Available ✅"
10:00:15 - Patient A completes payment → Booking confirmed
10:00:18 - Patient B completes payment → DOUBLE BOOKING! 💥
```

**Solution:** Atomic slot reservation with 5-minute timeout lock.

**New Flow:**
```
User clicks "Pay" → /api/reserve-slot → Pending booking created (5-min lock)
        ↓
Slot now blocked from other users
        ↓
User completes Stripe checkout
        ↓
Webhook → n8n → confirm_booking() → Pending promoted to Confirmed
```

**If User B Tries Same Slot:**
```
User B clicks "Pay" → /api/reserve-slot → CONFLICT (slot locked)
        ↓
User sees: "This time slot is no longer available"
```

**Database Changes:**
| Addition | Type | Purpose |
|----------|------|---------|
| `slot_lock_expires_at` | TIMESTAMPTZ | Expires 5 min after checkout start |
| `reserve_slot()` | RPC Function | Atomic slot reservation |
| `confirm_booking()` | RPC Function | Promote pending or insert new |
| `cleanup_expired_locks()` | RPC Function | Delete expired pending bookings |

**Migration:** Run `sql/add_slot_lock.sql` in Supabase SQL Editor.

**Cloudflare Endpoints:**
- `POST /api/reserve-slot` - Creates pending booking with lock
- `POST /api/create-session` - Now includes `pending_booking_id` in metadata

**Availability Check Updates:**
- Edge Function and n8n now filter by `status IN ('confirmed', 'pending')` OR active locks

### 6.12 Analytics & KPI Tracking (Added 2025-12-14)

**Problem Solved:** No visibility into booking funnel performance, patient outcomes, or ROI metrics.

**Research Basis:** Based on market research of dental practice management software standards in Latvia and Europe (Dentally, Dental Intelligence, Adit, moCal).

**New Database Schema:**

| Table/Column | Type | Purpose |
|-------------|------|---------|
| `booking_events` | TABLE | Funnel tracking (widget opens, step progression) |
| `booking_events.session_id` | TEXT | Browser session UUID |
| `booking_events.event_type` | TEXT | Event name (widget_open, step_1_service, etc.) |
| `bookings.actual_status` | TEXT | completed/no_show/cancelled_late |
| `bookings.review_requested_at` | TIMESTAMPTZ | When review email sent |
| `bookings.review_completed_at` | TIMESTAMPTZ | When patient left review |
| `bookings.source` | TEXT | widget/phone/walk-in |

**Events Tracked:**
| Event | When Fired |
|-------|------------|
| `widget_open` | User opens booking widget |
| `step_1_service` | Selects a service |
| `step_2_specialist` | Selects a specialist |
| `step_3_datetime` | Selects date and time |
| `step_4_details` | Enters patient details |
| `step_5_payment` | Initiates payment |
| `booking_complete` | Booking confirmed |
| `language_change` | Changes language |

**Pre-built Analytics Views:**
- `analytics_monthly_summary` - Bookings, revenue, show rate, reviews per month
- `analytics_funnel` - Daily funnel step counts
- `analytics_top_services` - Top services by revenue

**Monthly Report Workflow (`n8n-9-monthly-analytics.json`):**
- **Trigger:** 1st of each month at 9AM
- **Recipients:** Clinic + You (SaaS owner copy)
- **Metrics Included:**
  - Total bookings & revenue
  - Show rate / no-show rate
  - Unique patients vs returning patients
  - Average booking lead time
  - Top services by revenue
  - Google reviews requested vs completed
  - Funnel conversion rates

**Files Added:**
| File | Purpose |
|------|---------|
| `sql/analytics_migration.sql` | Database schema for tracking |
| `hooks/useAnalytics.ts` | React hook with session management |
| `functions/track-event/index.ts` | Cloudflare API endpoint |
| `workflows/n8n-9-monthly-analytics.json` | Monthly report workflow |

**Deployment:**
1. Run `sql/analytics_migration.sql` in Supabase SQL Editor
2. Deploy widget changes (`git push`)
3. Import and activate n8n workflow

### 6.13 Build Optimization & Configuration Fixes (Updated 2025-12-17)

**Problem Solved:** Cloudflare Pages build failures due to:
1. Large bundle size (584KB > 500KB warning limit)
2. Missing output directory configuration
3. Widget price display showing 0 instead of actual prices

**Code Splitting (Vite):**
Bundle reduced from 584KB to 317KB (45% reduction) via `manualChunks`:
```typescript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        'vendor-supabase': ['@supabase/supabase-js'],
        'vendor-utils': ['date-fns', 'clsx', 'tailwind-merge'],
        'vendor-icons': ['lucide-react'],
      }
    }
  }
}
```

**Cloudflare Pages Configuration:**
Added `wrangler.toml` at repo root pointing to nested widget output:
```toml
name = "butkevica-dental-booking"
pages_build_output_dir = "src/widget/butkevica-dental-booking/dist"
compatibility_date = "2025-11-01"
```

**Build Script Updates:**
```json
// package.json (root)
"build": "cd src/widget/butkevica-dental-booking && npm install && npm run build && cp -r functions dist/"
```

**Price Display Fix:**
Database stores prices in `price_cents` (4500 = €45.00) but widget expected `price`. Fixed in `configService.ts`:
```typescript
// Before (broken):
price: row.price

// After (fixed):
price: row.price_cents / 100
```

**Cloudflare Environment Variables Required:**
| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://[PROJECT_ID].supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |

> ⚠️ These must be set in Cloudflare Pages dashboard → Settings → Environment variables, then redeploy.

**Files Changed:**
| File | Change |
|------|--------|
| `vite.config.ts` | Added code splitting |
| `wrangler.toml` (root) | NEW: Cloudflare Pages config |
| `package.json` (root) | Updated build script |
| `services/configService.ts` | Fixed price conversion |



## 7. Required n8n VPS Configuration

The following environment variables must be set on the n8n server:

```bash
# GDPR: Don't store execution data with PII on successful runs
EXECUTIONS_DATA_SAVE_ON_SUCCESS=none
EXECUTIONS_DATA_SAVE_ON_ERROR=all
EXECUTIONS_DATA_PRUNE=true
EXECUTIONS_DATA_MAX_AGE=48  # hours
```

See `directives/n8n-gdpr-execution-logs.md` for full instructions.

---

## 8. Project Structure

```
butkeviča-dental-booking/
├── sql/                          # Database scripts
│   ├── add_cancellation_columns.sql
│   ├── add_slot_lock.sql
│   ├── analytics_migration.sql     # NEW: Analytics schema
│   ├── debug_booking_inserts.sql
│   ├── debug_bookings.sql
│   ├── fix_admin_permissions.sql
│   ├── fix_booking_columns.sql
│   ├── fix_services_data.sql
│   ├── fix_widget_supabase_insert.sql
│   ├── insert_test_bookings.sql
│   ├── saas_migration.sql
│   ├── smart_recall_query.sql
│   ├── supabase_security.sql
│   ├── update_bookings_schema.sql
│   └── update_service_categories.sql
├── docs/                         # Documentation
│   ├── BUSINESS_BLUEPRINT.md
│   ├── DIRECTIVE.md
│   ├── README.md
│   └── VERIFICATION.md
├── workflows/                    # n8n workflow JSONs
│   ├── n8n-2-stripe-confirmation-supabase.json  # Booking confirmation + DB write
│   ├── n8n-4-check-availability.json            # Deprecated (Edge Function primary)
│   ├── n8n-5-google-review-request.json         # Post-appointment reviews
│   ├── n8n-7-daily-reminders-and-recall.json    # Reminders + 6-month recall
│   ├── n8n-8-cancellation.json                  # Self-service cancellations
│   └── n8n-9-monthly-analytics.json             # NEW: Monthly analytics reports
├── public/                       # Static pages
│   ├── booking-cancelled.html    # Cancellation confirmation page
│   ├── booking-success.html      # Success redirect page
│   └── cancel-booking.html       # Cancellation request page (tri-lingual)
├── components/                   # React components
│   └── dashboard/                # Admin dashboard
├── services/                     # API service layers
├── hooks/                        # Custom React hooks
│   ├── useConfig.ts
│   └── useAnalytics.ts           # NEW: Analytics tracking hook
├── functions/                    # Cloudflare Functions
│   ├── create-session/
│   ├── reserve-slot/
│   ├── track-event/              # NEW: Analytics event endpoint
│   └── webhook/
└── [source files]                # App.tsx, index.tsx, etc.
```
### 6.14 Automatic Doctor Assignment (Added 2025-12-18)

**Problem Solved:** Patients who select "Any Available Specialist" remained unassigned in the database, requiring manual intervention from clinic staff.

**Solution:** Server-side automated assignment based on service qualification.

**The Logic:**
1.  **Qualification Check:** The system uses the `specialties` column (text array) in the `specialists` table to filter doctors capable of performing the booked service.
2.  **Clinic Isolation:** Only specialists belonging to the specific `clinic_id` of the booking are considered.
3.  **Fair Distribution (Randomization):** If multiple specialists are qualified for a service, the system selects one at random. This ensures a fair workload distribution among doctors.
4.  **Metadata Enhancement:**
    -   Widget passes `service_id` and `duration` (min) to Stripe metadata.
    -   n8n extracts these to perform the lookup.
5.  **Graceful Fallback:** If no specialists are found matching the service, the booking proceeds without a specialist assigned (staying null), and an alert is logged for manual review.

**Technical Implementation:**
-   **n8n Node:** `Fetch Qualified Specialists` (Supabase node using PostgREST array containment filter `cs.{service_id}`).
-   **n8n Code Node:** `Auto-Assign Specialist` (Random selection logic + consolidated email generation).
-   **Database:** `specialist_id` column added to `bookings` for persistent tracking.

### 6.15 Multi-Tenant Dynamic Branding (Added 2025-12-22)

**Problem Solved:** Hardcoded branding (clinic name, email, logo) prevented onboarding new clinics without code changes. The `check-availability` Edge Function also lacked `clinic_id` filtering, causing cross-tenant data leakage.

**Solution:** Dynamic branding fetched from database + true multi-tenant isolation.

**Database Changes:**
| Column | Type | Purpose |
|--------|------|---------|
| `clinics.logo_url` | TEXT | Clinic logo URL (optional, fallback to initials) |
| `clinics.clinic_email` | TEXT | Clinic contact email for workflows |

**Migration:** Run `sql/add_branding_columns.sql` in Supabase SQL Editor.

**Frontend Changes:**
| File | Change |
|------|--------|
| `types.ts` | Added `Clinic` interface with `logoUrl`, `clinicEmail`, `theme`, `settings` |
| `services/configService.ts` | Added `fetchClinicDetails()` to fetch clinic metadata from Supabase |
| `hooks/useConfig.tsx` | Exposed `clinic` object globally via React Context |
| `constants.ts` | Added `DEFAULT_CLINIC` fallback for network failures |

**Backend Changes (Critical Fix):**
| File | Change |
|------|--------|
| `supabase/functions/check-availability/index.ts` | Added `.eq('clinic_id', clinicId)` filter to Supabase query. **This fixes cross-tenant data leakage.** |
| `workflows/n8n-2-stripe-confirmation-supabase.json` | Now uses `metadata.clinic_email` with fallback to hardcoded value |

**Flow After Refactor:**
```
Widget Mount → fetchAllConfig(clinicId)
                    ↓
Supabase: SELECT * FROM clinics WHERE id = 'butkevica'
                    ↓
ConfigContext: { clinic: { name, logoUrl, clinicEmail, ... } }
                    ↓
Header.tsx: Shows clinic.name instead of hardcoded "Butkeviča"
PaymentMock.tsx: Passes clinic_email to Stripe metadata
                    ↓
n8n: Uses metadata.clinic_email for confirmation emails
```

**Onboarding a New Clinic:**
1. Insert new row in `clinics` table with unique `id`, `name`, `clinic_email`
2. Insert services in `services` table with matching `clinic_id`
3. Insert specialists in `specialists` table with matching `clinic_id`
4. Widget auto-fetches correct branding based on `clinicId` prop

**Verification:**
- ✅ Changing `clinics.name` in DB instantly updates widget header
- ✅ Currency symbol displays correctly from `clinic.settings.currency`
- ✅ Confirmation emails use `clinic_email` from metadata
- ✅ Availability check only returns slots for the specific clinic

### 6.16 Super Admin Dashboard (Added 2025-12-22)

**Problem Solved:** Onboarding new clinics required manual SQL inserts, making it error-prone and inaccessible to non-technical users.

**Solution:** A dedicated Super Admin Dashboard at `/super-admin` route for platform owners.

**Database Changes:**
| Table/Column | Type | Purpose |
|-------------|------|---------|
| `super_admin_whitelist` | TABLE | Email whitelist for super admin access |
| `super_admin_whitelist.email` | TEXT (PK) | Whitelisted email address |
| `super_admin_whitelist.is_active` | BOOLEAN | Enable/disable without deletion |
| `clinics.is_active` | BOOLEAN | Toggle clinic visibility |
| `clinics.created_by` | TEXT | Audit: who created the clinic |

**Migration:** Run `sql/04_super_admin.sql` in Supabase SQL Editor.

**Features:**
| Feature | Description |
|---------|-------------|
| Platform Stats | Total clinics, bookings, monthly revenue, unique patients |
| Clinic List | View all clinics with status, services/specialists counts |
| Create Clinic | Form with auto-slug generation, color picker, timezone |
| Edit Clinic | Update branding, email, domain settings |
| Toggle Status | Activate/deactivate clinics |
| Template Copying | Copy services & specialists from existing clinic |
| Deploy Instructions | Step-by-step Cloudflare Pages setup after creation |

**Authentication:**
- Separate from clinic staff roles (admin/doctor)
- Email-based whitelist in `super_admin_whitelist` table
- Access denied page for non-super-admins

**Files Added:**
| File | Purpose |
|------|---------|
| `sql/04_super_admin.sql` | Database migration |
| `components/auth/SuperAdminRoute.tsx` | Protected route guard |
| `components/super-admin/SuperAdminLayout.tsx` | Layout with sidebar |
| `components/super-admin/SuperAdminSidebar.tsx` | Navigation sidebar |
| `components/super-admin/SuperAdminDashboard.tsx` | Platform stats page |
| `components/super-admin/ClinicsPage.tsx` | Clinic CRUD interface |
| `components/super-admin/ClinicFormModal.tsx` | Add/edit clinic form |

**New Clinic Onboarding Flow (via UI):**
1. Navigate to `/super-admin/clinics`
2. Click "Add New Clinic"
3. Fill form (name auto-generates slug)
4. Optional: Select template clinic to copy services
5. Click "Create Clinic"
6. Follow deployment instructions for Cloudflare Pages

### 6.17 RLS Performance & Security Fixes (Updated 2025-12-23)

**Problem Solved:** Supabase performance advisor flagged multiple issues:
- `auth_rls_initplan` warnings (inefficient `auth.uid()` calls in RLS)
- `multiple_permissive_policies` causing policy conflicts
- `Function Search Path Mutable` security warning

**Fixes Applied:**
| Fix | Before | After |
|-----|--------|-------|
| Auth function wrapping | `auth.uid()` | `(SELECT auth.uid())` (subquery optimization) |
| Policy consolidation | Multiple permissive policies per table | Single comprehensive policy per operation |
| Function security | Mutable search path | `SET search_path = ''` on all RPC functions |

**Files Changed:**
| File | Purpose |
|------|---------|
| `sql/10_fix_rls_performance.sql` | RLS policy optimization |
| `sql/11_fix_remaining_rls_issues.sql` | Additional policy fixes |
| `sql/09_fix_search_path.sql` | Updated `reserve_slot` and `confirm_booking` with fixed search path |

**Verification:**
- ✅ Supabase performance advisor warnings resolved
- ✅ RLS policies correctly isolate clinic data
- ✅ No authenticated bypass vulnerabilities

### 6.18 Multi-Specialist Capacity Scheduling (Updated 2025-12-24)

**Problem Solved:** When 2+ specialists could perform the same service, booking one would mark the entire time slot as unavailable. This prevented optimal resource utilization.

**Example Before (Broken):**
```
Service "Zobu ārstēšana" → Dr. A and Dr. B both qualified
Patient 1 books 10:00 → assigned to Dr. A
Patient 2 tries 10:00 → ❌ "Slot unavailable" (wrong!)
```

**Example After (Fixed):**
```
Patient 1 books 10:00 → assigned to Dr. A
Patient 2 books 10:00 → ✅ Slot still available → assigned to Dr. B
Patient 3 tries 10:00 → ❌ "Slot unavailable" (correct - both doctors booked)
```

**Technical Solution:**
1. **Capacity Check:** Count qualified specialists for the selected service
2. **Booking Count:** Count existing bookings at the requested time
3. **Availability Rule:** `slot_available = (bookings < qualified_specialists)`

**Files Changed:**
| File | Change |
|------|--------|
| `supabase/functions/check-availability/index.ts` | Fetches qualified specialists, compares to booking count |
| `sql/12_multi_specialist_capacity.sql` | Updated `reserve_slot` RPC with capacity logic |
| `services/api.ts` | Added `service_id` parameter to availability functions |
| `components/SpecialistSelection.tsx` | Passes `service_id` for accurate capacity check |

**Deployment:**
1. Run `sql/12_multi_specialist_capacity.sql` in Supabase SQL Editor
2. Deploy Edge Function: `supabase functions deploy check-availability`

**n8n Workflow Improvements (2025-12-24):**
| Fix | Description |
|-----|-------------|
| Update Pending Booking | Changed from `rowId` to `filterString` syntax (fixes "select condition" error) |
| Specialist Auto-Assignment | Added `Fetch Qualified Specialists` + random selection node |
| Deduplication | Added `Check Existing Booking` before INSERT (prevents duplicate key errors) |
| Timestamp Fix | Removed empty string for `slot_lock_expires_at` (caused PostgreSQL error) |

**Workflow File:** `workflows/n8n-2-stripe-confirmation-supabase.json`

**Flow Structure:**
```
Webhook → Filter Event → Extract Data → Fetch Specialists → Auto-Assign
                                                               ↓
                                                    Has Pending Booking?
                                            ┌──────────────┴──────────────┐
                                          [YES]                          [NO]
                                            ↓                              ↓
                                   Update Pending             Check Duplicate → Create
                                            ↓                              ↓
                                   Email + Calendar            Email + Calendar
```

### 6.19 SMS Reminders via Twilio (Implemented, Disabled by Default)

**Status:** ✅ Implemented | ⏸️ Disabled (cost-saving)

**Reason Disabled:** Requires purchasing a Twilio phone number (~$1/month + ~$0.05-0.08 per SMS).

**Implementation Details:**
- SMS sending nodes exist in `n8n-7-daily-reminders-and-recall.json`
- Triggered alongside email reminders (24h before appointment)
- Tri-lingual support: EN, LV, RU (matched to booking language)

**Activation Requirements:**
| Step | Action |
|------|--------|
| 1 | Upgrade Twilio account from Trial to Paid (removes "Sent from trial" prefix) |
| 2 | Purchase Latvian phone number (+371) for professional appearance |
| 3 | Add Twilio credentials to n8n (Account SID + Auth Token) |
| 4 | Enable SMS nodes in n8n workflow (currently disabled) |
| 5 | Update booking confirmation email to include SMS opt-out link |

**Cost per Client:**
- ~€25-40/month for 500 SMS
- Can be passed to client or included in package pricing

**Sales Note:**
> *"SMS reminders are an optional add-on that reduces no-shows by 30%. Available for €25/month."*

---

### 6.20 Phone Number Validation (Known Issue)

**Status:** 🐛 Bug — Phone numbers sometimes not saving to Supabase

**Symptoms:**
- Widget collects phone number
- Stripe metadata contains phone
- Supabase `bookings.customer_phone` is NULL

**Suspected Causes:**
1. Empty string sent when phone field is optional and left blank
2. Phone validation regex rejecting valid formats
3. n8n extraction node not parsing phone from metadata

**Workaround:** Phone is currently optional. SMS reminders fall back to email.

**TODO:** Debug n8n Code node extracting `customer_phone` from Stripe metadata.

---

### 6.21 Future Integrations (Roadmap)

**Status:** 📋 Planned | Not Implemented

| Integration | Priority | Notes |
|-------------|----------|-------|
| Outlook Calendar | Medium | Many clinics use Microsoft 365 |
| Apple Calendar (iCal feed) | Low | Export-only, no write-back |
| Curve/Oryx PMS | High | Popular dental management systems in EU |
| Dendoo | High | Nadora clinic uses this—API research needed |
| WhatsApp Business API | Medium | Higher engagement than SMS in Latvia |

**Architecture Note:** These would be additional n8n nodes, not widget changes.

---

### 6.22 Security: Two-Factor Authentication (Recommended)

**Status:** ⚠️ Not Implemented | Recommended for Production

**Risk:** Health-adjacent data (service type + patient name) qualifies as sensitive under GDPR Art. 9.

**Recommendation:**
| Area | Current | Recommended |
|------|---------|-------------|
| Admin Dashboard | Supabase Auth (email/password) | Add 2FA via Supabase Auth or Auth0 |
| Super Admin | Supabase Auth + email whitelist | Enforce 2FA for super-admin access |
| n8n | HTTP Basic Auth | Move behind VPN or add IP whitelist |

**Implementation Path:**
1. Enable "MFA" in Supabase Auth settings
2. Require MFA enrollment on first admin login
3. Add `mfa_verified` check to RLS policies

---

### 6.23 Payment Options & Flexibility

**Status:** ✅ Stripe Checkout | 🔶 SEPA Partially Supported

**Current Implementation:**
- Stripe Checkout handles card payments
- SEPA Direct Debit available if enabled in Stripe account
- No configuration UI exposed to widget

**Deposit vs Full Payment:**
| Mode | Current Status |
|------|----------------|
| Fixed deposit (e.g., €30) | ✅ Implemented |
| Per-service deposit | ✅ Supported via `clinic_services.price_cents` |
| Full prepayment | 🔶 Possible but not exposed in UI |
| Pay at clinic (no payment) | ❌ Not supported (payment required for booking) |

**Future Enhancement:** Add `payment_mode` column to `clinics` table:
- `deposit_fixed` — Current behavior
- `deposit_percentage` — 20% of service price
- `full_prepayment` — 100% upfront
- `pay_at_clinic` — Skip Stripe, direct to n8n

---

### 6.24 Mobile Widget Responsiveness

**Status:** ✅ Implemented | 🔶 Not Formally Tested

**Implementation:**
- Tailwind CSS responsive classes throughout
- Mobile-first layout in `BookingWidget.tsx`
- Touch-friendly buttons and inputs

**Known Issues:** None reported.

**Recommendation:** Add mobile screenshot to walkthrough.md for each client onboarding.

---

### 6.25 Google OAuth Production Mode (CRITICAL)

**Status:** ⚠️ Must Configure Per Client

**Problem:** Google Cloud OAuth in "Testing" mode expires refresh tokens after 7 days.

**Symptoms:**
- n8n Gmail/Calendar nodes fail after ~1 week
- Error: "Token has been expired or revoked"

**Fix (Required for Every Client):**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services → OAuth consent screen**
3. Click **"Publish App"** to change status from "Testing" to "In production"
4. Accept the verification notice (no actual verification required for internal use)

**Warning Display:**
> After publishing, users see "Google hasn't verified this app" screen on first auth. Click **"Advanced" → "Go to [app name] (unsafe)"** to proceed.

**Added to:** `directives/client-onboarding-checklist.md`

---

### 6.26 Analytics Deployment Verification

**Status:** ✅ Implemented | 🔶 No Verification Documented

**Components:**
| Component | File | Status |
|-----------|------|--------|
| React hook | `hooks/useAnalytics.ts` | ✅ Deployed |
| Cloudflare endpoint | `functions/api/track-event.js` | ✅ Deployed |
| Database schema | `sql/analytics_migration.sql` | ✅ Run |
| Monthly report workflow | `workflows/n8n-9-monthly-analytics.json` | ✅ Active |

**Verification Steps:**
1. Open widget → Check browser console for `track-event` network requests
2. Query Supabase: `SELECT * FROM booking_events ORDER BY created_at DESC LIMIT 10`
3. Confirm monthly report email arrives on 1st of month

**TODO:** Add automated test to Cloudflare deployment pipeline.

---

### 6.27 Code Cleanup Notes

**Redundant Files Identified:**

| File | Keep/Remove | Reason |
|------|-------------|--------|
| `functions/api/create-session.js` | ✅ Keep | Primary Stripe session creator |
| `functions/api/create-stripe-session.js` | ❓ Review | Appears redundant—may be legacy |

**Recommendation:** Diff the two files. If identical, delete `create-stripe-session.js`.

---

### 6.28 Known Limitations & Scope Boundaries

**Explicitly Out of Scope (by design):**

| Feature | Reason |
|---------|--------|
| Full EMR/EHR integration | Regulatory complexity, requires HIPAA/MDR compliance |
| Automatic clinical charting | Outside booking automation scope |
| Insurance processing | Varies by country, complex integrations |
| Video consultations | Different product category |

**Sales Response:**
> *"Our system is focused on lead capture and booking automation. Clinical workflows remain in your existing practice management system. We integrate with PMS for appointment sync where APIs are available."*

---

## 9. Document Revision History

| Date | Section | Change |
|------|---------|--------|
| 2025-12-07 | 6.1-6.4 | Initial architecture fixes |
| 2025-12-09 | 6.7-6.8 | Supabase native nodes, DLQ |
| 2025-12-14 | 6.9-6.12 | Multi-language, analytics, slot locking |
| 2025-12-17 | 6.13 | Build optimization |
| 2025-12-18 | 6.14 | Auto-assignment |
| 2025-12-22 | 6.15-6.16 | Multi-tenant branding, super admin |
| 2025-12-23 | 6.17 | RLS performance fixes |
| 2025-12-24 | 6.18 | Multi-specialist capacity |
| 2026-01-14 | 6.19-6.28 | Gap analysis documentation (SMS, phone bug, 2FA, payment options, Google OAuth, analytics, code cleanup, scope boundaries) |

