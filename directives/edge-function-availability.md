# Directive: Deploy check-availability Edge Function

## Purpose
Deploy the Supabase Edge Function that replaces n8n for availability checking, eliminating VPS uptime dependency for critical user-facing interactions.

## Prerequisites
- Supabase CLI installed (`npm install -g supabase`)
- Access to the Supabase project
- (Optional) Google Cloud Platform service account for calendar integration

---

## Step 1: Link Supabase Project

```bash
cd src/widget/butkeviča-dental-booking

# Login to Supabase
supabase login

# Link to existing project
supabase link --project-ref mugcvpwixdysmhgshobi
```

---

## Step 2: Set Supabase Secrets (Required)

The Edge Function automatically has access to `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

No additional secrets required for basic Supabase-only availability checking.

---

## Step 3: (Optional) Setup Google Calendar Integration

To enable Google Calendar checking in the Edge Function:

### 3a. Create GCP Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google Calendar API**
4. Go to **IAM & Admin** > **Service Accounts**
5. Create a new service account
6. Create a JSON key and download it

### 3b. Share Calendar with Service Account

1. Open Google Calendar
2. Find your clinic calendar > Settings
3. Under "Share with specific people", add the service account email (`xxx@yyy.iam.gserviceaccount.com`)
4. Grant "See all event details" permission

### 3c. Store the Service Account JSON in Supabase

```bash
# Escape newlines and store as secret
cat service-account.json | jq -c . > service-account-compact.json

supabase secrets set GOOGLE_SERVICE_ACCOUNT_JSON="$(cat service-account-compact.json)"
supabase secrets set GOOGLE_CALENDAR_ID="primary"  # or your specific calendar ID
```

---

## Step 4: Deploy the Edge Function

```bash
cd src/widget/butkeviča-dental-booking

# Deploy to Supabase
supabase functions deploy check-availability --no-verify-jwt
```

The `--no-verify-jwt` flag is required because the widget calls this function anonymously.

---

## Step 5: Test the Edge Function

```bash
# Test directly
curl "https://mugcvpwixdysmhgshobi.supabase.co/functions/v1/check-availability?date=2025-12-07"

# Expected response:
# {"slots":[{"time":"09:00","available":true},{"time":"10:00","available":false},...]}
```

---

## Step 6: Verify Widget Integration

1. Open the booking widget
2. Open browser DevTools > Network tab
3. Select a date
4. Verify the request goes to `/functions/v1/check-availability` (not n8n)
5. Look for console logs: `[Availability] Edge Function success: X slots`

---

## Rollback (Fallback to n8n)

If the Edge Function has issues, the widget automatically falls back to n8n.

To force n8n-only mode:

```typescript
// In services/api.ts, comment out getEdgeFunctionUrl():
const getEdgeFunctionUrl = () => null;
```

---

## Architecture Notes

**Before (Fragile):**
```
Widget → n8n VPS → Supabase + GCal → Widget
         ↑
    Single point of failure
```

**After (Resilient):**
```
Widget → Supabase Edge Function → Supabase + GCal → Widget
         ↓ (fallback)
         n8n VPS
```

## Related Files
- `supabase/functions/check-availability/index.ts` - Edge Function source
- `services/api.ts` - Widget API with fallback logic
- `workflows/n8n-4-check-availability.json` - Original n8n workflow (deprecated, kept for reference)
