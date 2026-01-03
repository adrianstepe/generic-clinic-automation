# n8n Dead Letter Queue (DLQ) - Black Box Recorder

## Purpose
Ensures **zero lost bookings** by capturing failed database writes to a local file system. Even in total Supabase outage, patient payment data is preserved for manual recovery.

> *"Our system includes a **Black Box Recorder**. Even in a total server outage, no patient payment is ever lost."*

---

## ⚠️ n8n 2.0 Breaking Changes

**ExecuteCommand node is DISABLED by default in n8n 2.0** for security reasons.
**File operations are RESTRICTED by default** - requires `N8N_RESTRICT_FILE_ACCESS_TO` env var.

### Solution: Use the n8n 2.0 Compatible Workflow
Use workflow: `workflows/n8n-dlq-error-handler-v2.json`
This uses Code + Convert to File + Read/Write File nodes instead of ExecuteCommand.

---

## VPS Setup (Hostinger KVM 2 with Docker n8n)

### 1. Create DLQ directory on host
```bash
mkdir -p /local-files/dlq
chmod 777 /local-files/dlq
```

### 2. Add environment variable to docker-compose.yml
```bash
nano /docker/n8n/docker-compose.yml
```

Add this line to the n8n service's `environment:` section:
```yaml
      - N8N_RESTRICT_FILE_ACCESS_TO=/files
```

### 3. Restart n8n
```bash
cd /docker/n8n
docker compose down
docker compose up -d
```

### 4. Verify
```bash
docker ps | grep n8n
docker exec n8n-n8n-1 touch /files/dlq/test.txt && docker exec n8n-n8n-1 rm /files/dlq/test.txt && echo "✅ DLQ ready!"
```

**DLQ files save to:** `/local-files/dlq/` on host (accessible as `/files/dlq/` from n8n)

---

## n8n Workflow Configuration

### Nodes Added to `n8n-2-stripe-confirmation-supabase.json`

| Node | Type | Purpose |
|------|------|---------|
| Error Trigger | `errorTrigger` | Catches any node failure with `onError: stopWorkflow` |
| Save to DLQ | `writeFile` | Writes booking data to `/home/n8n/dlq/failed-{timestamp}.json` |
| Alert Admin (DLQ) | `telegram` | Sends failure notification |

### Required Credential Updates

1. **Telegram Bot** (if not already configured):
   - Create bot via [@BotFather](https://t.me/botfather)
   - Get your Chat ID via [@userinfobot](https://t.me/userinfobot)
   - In n8n: Settings → Credentials → Add Telegram API
   - Update `Alert Admin (DLQ)` node with your Chat ID

2. **Update Placeholders** in the workflow:
   ```
   YOUR_TELEGRAM_CHAT_ID → Your actual chat ID (e.g., 123456789)
   YOUR_TELEGRAM_CREDENTIAL_ID → Your n8n credential ID
   ```

---

## DLQ File Format

Each failed booking creates a JSON file:

**Location:** `/home/n8n/dlq/failed-20251209-204530-123.json`

```json
{
  "timestamp": "2025-12-09T20:45:30.123Z",
  "error": {
    "message": "ETIMEDOUT: Connection timed out",
    "node": "Save to Supabase",
    "stack": "..."
  },
  "booking_data": {
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "customer_phone": "+37120123456",
    "service_id": "s1",
    "service_name": "Dental Checkup",
    "start_time": "2025-12-15T09:00:00Z",
    "end_time": "2025-12-15T10:00:00Z",
    "amount_paid": 30.00,
    "status": "confirmed",
    "stripe_session_id": "cs_xxxx",
    "payment_intent_id": "pi_xxxx",
    "client_reference": "BK-M5X9K2"
  },
  "original_input": { ... },
  "recovery_attempts": 0
}
```

---

## Recovery Procedure

### Manual Recovery (Quick)

```bash
# 1. List failed bookings
ls -la /home/n8n/dlq/

# 2. View a specific file
cat /home/n8n/dlq/failed-20251209-204530-123.json | jq .

# 3. After fixing the issue and manually inserting to Supabase:
mv /home/n8n/dlq/failed-20251209-204530-123.json /home/n8n/dlq/processed/
```

### Automated Recovery (Recommended)

Use the Python recovery script:

```bash
# Run recovery script
cd /home/as/Desktop/Antigravity/Workspace
python3 execution/recovery_dlq.py

# Or set up as cron job (runs every hour)
0 * * * * /usr/bin/python3 /home/n8n/scripts/recovery_dlq.py >> /var/log/dlq-recovery.log 2>&1
```

---

## Monitoring

### Daily Health Check

Add this cron job to alert if DLQ files are stale (> 24 hours old):

```bash
# Check for stale DLQ files daily at 9 AM
0 9 * * * find /home/n8n/dlq -name "failed-*.json" -mtime +1 | wc -l | xargs -I {} test {} -gt 0 && curl -X POST "https://api.telegram.org/bot<TOKEN>/sendMessage" -d "chat_id=<CHAT_ID>&text=⚠️ DLQ has {} stale files!"
```

### Telegram Alerts You'll Receive

```
🚨 **BOOKING FAILED - DLQ ACTIVATED**

❌ Error: ETIMEDOUT: Connection timed out
📍 Node: Save to Supabase
⏰ Time: 2025-12-09 20:45:30

📁 Saved to: /home/n8n/dlq/

⚠️ Manual recovery required!
```

---

## Testing the DLQ

1. **Simulate Failure:**
   - Temporarily change Supabase credentials to invalid values in n8n
   - Trigger a test webhook: `curl -X POST https://your-n8n-url/webhook/stripe-confirmation-webhook -H "Content-Type: application/json" -d '{"type":"checkout.session.completed","data":{"object":{"id":"cs_test","metadata":{"customer_name":"Test","booking_date":"2025-12-15","booking_time":"09:00"}}}}'`

2. **Verify:**
   - Check Telegram for alert
   - Check `/home/n8n/dlq/` for new JSON file

3. **Restore:**
   - Fix Supabase credentials
   - Run recovery script or manually insert

---

## Stripe Retry Behavior (Fallback)

Your `webhook.js` returns 502 on n8n failure, triggering Stripe retries:
- Immediate retry
- After 1 hour
- After 12 hours  
- Up to 72 hours total

**DLQ + Stripe Retries = Belt and Suspenders protection**
