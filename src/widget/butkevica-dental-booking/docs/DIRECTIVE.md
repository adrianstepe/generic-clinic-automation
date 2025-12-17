# Directive: Webhook Pipeline Verification

## Goal
Reliably verify the end-to-end connectivity from Stripe -> Cloudflare -> n8n without relying on manual "try and see" loops.

## Architecture
1.  **Source**: Stripe (Simulated via Script)
2.  **Proxy**: Cloudflare Pages Function (`/api/webhook`)
3.  **Destination**: n8n Webhook Node

## Debugging Protocol (The "Why" and "How")

### Step 1: Verify Cloudflare Proxy
**Hypothesis**: The Cloudflare Function is not receiving or forwarding the request correctly.
**Test**: Send a `POST` request to the Cloudflare URL with a mock Stripe payload.
**Expected Output**: `200 OK` and `{"received": true}`.
**Failure Analysis**:
- `404`: Function not deployed or wrong path.
- `500`: Script error (likely env var missing).

### Step 2: Verify n8n Reception
**Hypothesis**: n8n is rejecting the request (Method, Path, or Auth).
**Test**: Check n8n "Executions" after a successful Step 1.
**Failure Analysis**:
- No execution: URL in Cloudflare env var is wrong.
- Execution failed: Payload mismatch.

## Tools
- `scripts/simulate-stripe-event.js`: A Node.js script to act as Stripe.
