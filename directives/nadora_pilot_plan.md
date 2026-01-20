# Directive: Nadora Pilot Onboarding Protocol

**Goal:** Turn Nadora from "Interested" to " raving Case Study" in 30 days.

## Phase 1: The "Paperwork" (Days 1-3)
1.  **Sign Agreement:**
    - If SIA not ready: Sign "Letter of Intent" (Nodomu protokols) + NDA.
    - If SIA ready: Sign standard Service Agreement (0€ for 30 days).
2.  **Access Granularity:**
    - Request: "Receptionist View" access to Dendoo (if possible) or just a walkthrough.
    - **CRITICAL:** Do not ask for API access if Dendoo doesn't have it. Ask for "Process Walkthrough" to build the automation around them.

## Phase 2: Technical Integration (The "Dendoo Bridge")
**Strategy:** We cannot officially integrate with Dendoo API (likely closed). We will use "Human-in-the-Loop" or "Email Parsing" initially.

1.  **Input (Patient Booking):**
    - Patient books on Widget -> Data goes to `AntiGravity DB`.
    - Notification sent to Admin Email + SMS.
2.  **Sync (The Bridge):**
    - **Option A (Low Tech - Reliable):** Admin receives email: "New Booking: Jānis Bērziņš, 14:00". Admin manually enters into Dendoo.
        - *Pitch:* "It's still faster than a phone call (30sec vs 5min)."
    - **Option B (Mid Tech):** If Dendoo sends email confirmations? We parse them. (Unlikely).
    - **Option C (High Tech - RPA):** Headless browser logs into Dendoo and inserts booking. (⚠️ RISKY - Do not attempt in Week 1).
  
**Decision:** Start with **Option A+**.
- We provide a "Dashboard" where they see bookings.
- They click "Confirm" -> We send SMS to Patient.
- They manually add to Dendoo.

## Phase 3: The "Value Realization" (Day 30)
**Metric that matters:** "Admin Phone Calls Saved".
- We must track: "How many bookings came via Widget?"
- If 20 bookings = 100 minutes saved (5 min/call).
- Present this report on Day 29.

## Checklist for Adrians (User)
- [ ] Print 2 copies of NDA/LOI.
- [ ] Prepare the "Admin Dashboard" credentials for Nadora.
- [ ] Schedule the "Onboarding Call" (15 min) - Don't call it "Training", call it "Setup".
