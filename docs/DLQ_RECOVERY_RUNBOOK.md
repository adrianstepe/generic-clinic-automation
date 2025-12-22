# DLQ Recovery Runbook

## When You Get a Telegram Alert

You received this message:
```
🚨 BOOKING FAILED - DLQ ACTIVATED!

Workflow: Stripe Confirmation
Error: [error message]
Node: [node name]
Time: 2025-12-09 21:15:00

📁 Saved to: /home/node/.n8n/dlq/

⚠️ Check n8n immediately!
```

---

## Step 1: SSH into VPS

```bash
ssh root@72.62.0.150
```

---

## Step 2: List Failed Bookings

```bash
docker exec -it root-n8n-1 ls -la /home/node/.n8n/dlq/
```

You'll see files like:
```
failed-20251209-211234.json
failed-20251209-214500.json
```

---

## Step 3: View a Failed Booking

```bash
docker exec -it root-n8n-1 cat /home/node/.n8n/dlq/failed-20251209-211234.json
```

Output example:
```json
{
  "timestamp": "2025-12-09T21:12:34Z",
  "error": {
    "message": "Supabase timeout",
    "node": "Save to Supabase"
  },
  "recovery_attempts": 0
}
```

---

## Step 4: Recover the Booking

### Option A: Re-run from Stripe (if within 72 hours)

Stripe will have retried automatically. Check if the booking appeared in Supabase. If not, continue to Option B.

### Option B: Manual Insert via Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Open your project → Table Editor → `bookings`
3. Click "Insert Row"
4. Fill in the customer details from the JSON file

### Option C: Insert via SQL

```sql
INSERT INTO bookings (
  customer_name,
  customer_email,
  customer_phone,
  service_name,
  start_time,
  end_time,
  status,
  amount_paid
) VALUES (
  'Customer Name',
  'email@example.com',
  '+37120123456',
  'Dental Checkup',
  '2025-12-15 09:00:00+00',
  '2025-12-15 10:00:00+00',
  'confirmed',
  30.00
);
```

---

## Step 5: Move Processed File

After recovery, move the file to prevent re-processing:

```bash
docker exec -it root-n8n-1 mkdir -p /home/node/.n8n/dlq/processed
docker exec -it root-n8n-1 mv /home/node/.n8n/dlq/failed-20251209-211234.json /home/node/.n8n/dlq/processed/
```

---

## Quick Reference

| Task | Command |
|------|---------|
| SSH to VPS | `ssh root@72.62.0.150` |
| List DLQ files | `docker exec -it root-n8n-1 ls -la /home/node/.n8n/dlq/` |
| View file | `docker exec -it root-n8n-1 cat /home/node/.n8n/dlq/<filename>` |
| Move to processed | `docker exec -it root-n8n-1 mv /home/node/.n8n/dlq/<file> /home/node/.n8n/dlq/processed/` |
