# 🎬 Demo Recording Guide

**Time needed:** ~1 minute video  
**Recording with:** Loom (or OBS / GNOME Screen Recorder if Loom is unstable)

---
## 🚨 Loom Issues? Use These Alternatives

If Loom cuts off your recording or asks for permissions repeatedly:

### Option A: SimpleScreenRecorder (Recommended for your X11 Setup)
*   **Most Reliable**. It records your screen directly without needing "Portals".
*   Install: `sudo apt update && sudo apt install simplescreenrecorder`
*   **How to use:**
    1.  Open it and click "Continue".
    2.  Keep the default "Record the entire screen".
    3.  Click "Continue" through the audio/video settings (defaults are fine).
    4.  Choose a filename and click "Continue".
    5.  Click **"Start recording"** at the top.

### Option B: Kazam (Very Simple)
*   Another solid X11 alternative.
*   Install: `sudo apt install kazam`
*   Select "Fullscreen" and click "Capture".

### Option B: OBS Studio (Professional)
*   **Most reliable**.
*   Install: `sudo apt install obs-studio`
*   Setup:
    1.  Sources > + > Screen Capture (XSHM)
    2.  Controls > Start Recording
*   Output: `~/Videos` (MKV/MP4)

---

## ⚡ Quick Start

### 1. Open These Tabs

| Tab | URL | What it shows |
|-----|-----|---------------|
| **Widget** | http://localhost:3001/ | Booking flow |
| **Email** | Your inbox (Gmail/Outlook) | Confirmation email |

### 2. Clean Your Browser
- **Incognito mode** recommended (Ctrl+Shift+N)
- Hide bookmarks bar (Ctrl+Shift+B)

---

## 🎥 Recording Flow (60 seconds)

### Scene 1: Book an Appointment (0:00 - 0:30)

1. **Open Widget** at `http://localhost:3001/`
2. **Select Service:** Click "Pirmā vizīte un konsultācija" (First Visit)
3. **Pick Doctor:** Dr. Ieva Bērziņa
4. **Select Date:** Tomorrow (any weekday)
5. **Select Time:** 14:00
6. **Fill Form:**
   - Name: `Jānis Bērziņš`
   - Phone: `20123456`
   - Email: **YOUR REAL EMAIL** (to receive confirmation!)
7. **Click "Turpināt" (Continue)**

### Scene 2: Stripe Payment (0:30 - 0:45)

1. You'll be redirected to **real Stripe Checkout**
2. Enter test card:
   ```
   Card:   4242 4242 4242 4242
   Expiry: 12/28
   CVC:    123
   Name:   Jānis Bērziņš
   ```
3. Click **"Pay €35.00"**
4. Wait for redirect to success page → "Paldies!"

### Scene 3: Confirmation Email (0:45 - 1:00)

1. **Switch to Email tab**
2. Check inbox for email from your system
3. **Show the email** — scroll slowly to highlight:
   - Date/time confirmation
   - Doctor name
   - Clinic address
   - "Add to Calendar" button
   - Cancellation link

---

## 🔧 Before Recording

### Run These Commands

```bash
# Terminal 1: Start Widget
cd /home/as/Desktop/Antigravity/Workspace/platform/widget
npm run dev
# → Opens on http://localhost:3001/
```

### Check n8n is Running

Your n8n must be active at: `https://n8n.srv1152467.hstgr.cloud/`

The Stripe webhook is: `POST /webhook/stripe-confirmation-webhook`

---

## 🎥 Loom Tips (No Voice)

1. **Start with mic muted**
2. **After recording,** use Loom's editor to add:
   - Text overlays (e.g., "Select your service...")
   - Background music (Loom has a library)
3. **Speed up** slow parts (like typing) to 1.5x

### Text Overlay Ideas

| Time | Text |
|------|------|
| 0:05 | "Klienti pierakstās online jebkurā laikā" |
| 0:15 | "Izvēlas ārstu un laiku" |
| 0:30 | "Maksā depozītu — nav neierašanās" |
| 0:45 | "Automātisks apstiprinājums e-pastā" |

---

## ✅ Checklist Before Recording

- [ ] Widget running on localhost:3001
- [ ] Using incognito browser
- [ ] Bookmarks bar hidden
- [ ] n8n is active
- [ ] Email inbox ready to show
- [ ] Test card memorized: `4242 4242 4242 4242`

### Scene 4: Admin Dashboard (1:00 - 1:20)

> **Note:** This continues immediately after you "receive" the booking.

1.  **Open Widget** at `http://localhost:3001/dashboard` (Log in if needed).
2.  **Scene Start:** Hover over the "Šodienas pieraksti" (Today's Bookings) card.
3.  **Action:**
    *   Find the booking you just made (Jānis Bērziņš).
    *   Click the **Status** dropdown (or Edit button).
    *   Change status to **"Completed"** (Pabeigts) or leave as "Confirmed".
    *   *Alternative:* Click the **Edit (Pencil)** icon to show the details modal, then close it.
4.  **Transitions:**
    *   Click on **"Kalendārs"** (Calendar) in the sidebar.
    *   Show the slot is filled on the calendar.

### Text Overlay Ideas for Admin

| Time | Text |
|------|------|
| 1:05 | "Visa klīnika vienuviet" (Your entire clinic in one place) |
| 1:12 | "Viegla pierakstu pārvaldība" (Easy booking management) |

---
---

## ✂️ How to Edit Your Local Recording
 
### Option A: Canva (Easiest & Best for "Black Bars")
> [!TIP]
> **Recommended:** Canva handles resizing and "cropping out" black bars much better than CapCut Web.
> [👉 **Read the Step-by-Step Canva Guide**](CANVA_EDITING_TUTORIAL.md)

### Option B: CapCut (Advanced)
If you need complex animations.
> [👉 **Read the CapCut Masterclass**](CAPCUT_EDITING_TUTORIAL.md)

### Option C: Loom (Fastest)
1.  Upload to Loom.com.
2.  Trim the start/end.
3.  Add a "Call to Action" button in Loom settings.

## 🧹 After Recording

To clean up test bookings, delete from Supabase:

```sql
DELETE FROM bookings WHERE clinic_id = 'demo-clinic' AND customer_email = 'your-email@example.com';
```

---

## 📁 Where to Put the Video

| Option | Use For |
|--------|---------|
| **Loom link** | Reply emails (after clinics respond) |
| **Landing page embed** | Add to your Carrd/Notion page |
| **Google Drive** | Alternative for email attachment |

**Recommendation:** Don't include video in first cold email. Add it in follow-up after they reply.
