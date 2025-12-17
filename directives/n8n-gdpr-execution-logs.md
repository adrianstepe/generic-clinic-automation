# n8n GDPR Execution Logs Configuration

## Problem
By default, n8n saves all execution data (inputs/outputs) including patient PII (names, phones, emails) in plain text in its database. This violates GDPR Art. 9.

## Solution

### Step 1: SSH into your n8n VPS
```bash
ssh your-user@your-n8n-server
```

### Step 2: Edit n8n environment variables
If using Docker Compose, edit your `docker-compose.yml`:
```yaml
services:
  n8n:
    environment:
      # Only save execution data on errors, not on success
      - EXECUTIONS_DATA_SAVE_ON_SUCCESS=none
      - EXECUTIONS_DATA_SAVE_ON_ERROR=all
      # Optional: Auto-prune old executions
      - EXECUTIONS_DATA_PRUNE=true
      - EXECUTIONS_DATA_MAX_AGE=48  # hours
```

If using systemd or direct install, add to your `.env` or environment:
```bash
EXECUTIONS_DATA_SAVE_ON_SUCCESS=none
EXECUTIONS_DATA_SAVE_ON_ERROR=all
EXECUTIONS_DATA_PRUNE=true
EXECUTIONS_DATA_MAX_AGE=48
```

### Step 3: Restart n8n
```bash
# Docker Compose
docker-compose down && docker-compose up -d

# Or systemd
sudo systemctl restart n8n
```

### Step 4: Purge existing execution logs (one-time cleanup)
In n8n UI:
1. Go to **Workflow Executions**
2. Select all executions
3. Delete them

Or via CLI/API:
```bash
# If using SQLite (default):
sqlite3 ~/.n8n/database.sqlite "DELETE FROM execution_entity;"

# If using PostgreSQL:
psql -U n8n -d n8n -c "TRUNCATE TABLE execution_entity;"
```

### Step 5: (Optional) Set up cron job for error log purging
Create a cron job to purge error logs every 24-48 hours:

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 3 AM)
0 3 * * * docker exec n8n n8n prune --days=2
```

## Verification
After restarting:
1. Run a test workflow
2. Check that successful executions are NOT saved
3. Intentionally trigger an error and verify it IS saved for debugging

## References
- [n8n Environment Variables](https://docs.n8n.io/hosting/configuration/environment-variables/)
- GDPR Article 9: Processing of special categories of personal data
