# 🎥 Product Demo Video Script
**Goal:** A high-quality, silent walkthrough of the booking, email confirmation, and cancellation flow.
**Total Time:** ~45-60 seconds.

## ✅ Preparation
1.  **Open Browser Tabs:**
    *   **Tab 1:** `http://localhost:3001/` (The Booking Widget)
    *   **Tab 2:** `http://localhost:8080/stripe-checkout.html` (The Mock Stripe Page)
    *   **Tab 3:** `http://localhost:3001/dashboard` (Optional: The Dashboard)
2.  **Clean Up:** Hide bookmarks bar (`Ctrl+Shift+B` / `Cmd+Shift+B`). Use "Incognito" or a clean profile.
3.  **Recording:** Set Loom to "Full Screen" or "Current Tab". If switching tabs, "Full Screen" is better.

---

## 🎬 The Shot List

### **Scene 1: The Booking (0:00 - 0:25)**
1.  **Start** on the Booking Widget (Tab 1).
2.  **Scroll** down slightly to show it's a real page.
3.  **Select Service:** Click "Zobārstniecība" (Dentistry) -> "Konsultācija".
4.  **Select Doctor:** Choose a doctor (e.g., Dr. Anna Kalnina).
5.  **Select Time:** Pick a date/time (e.g., Tomorrow at 14:00). *Move mouse smoothly.*
6.  **Form:** Enter fake details:
    *   Name: `Janis Berzins`
    *   Phone: `20123456`
    *   Email: `janis@example.com`
7.  **Confirm:** Click "Apstiprināt".
8.  **Wait:** Show the "Paldies!" (Success) screen for 2 seconds.

### **Scene 2: The Email (0:25 - 0:35)**
1.  **Switch Tab** to Tab 2 (The Mock Email).
2.  **Scroll:** Slowly scroll down the email to show the doctor's details and location map.
3.  **Highlight:** Hover over the "Appointment Details" card to show it looks professional.

### **Scene 3: Cancellation (0:35 - 0:45)**
1.  **Action:** In the email (Tab 2), click the red link: *"Need to cancel or reschedule? Click here"*.
2.  **Transition:** This opens the "Cancellation Page" (mock file).
3.  **Action:** Click the Red "Confirm Cancellation" button.
4.  **Wait:** Watch the spinner for 1 second -> See "Appointment Cancelled" success message.

### **Scene 4: The Doctor's View (Optional / 0:45 - 0:55)**
1.  **Switch Tab** to Tab 3 (The Dashboard).
2.  **Action:** Click "Refresh" or just point to the calendar where the booking (or a similar one) is visible.
3.  **End:** Fade out or stop recording.

---

## 🛠 Troubleshooting
*   **"The Email link doesn't work":** Make sure `email-confirmation.html` and `cancellation-flow.html` are in the same folder.
*   **"Dashboard is empty":** If you don't have real data, skip Scene 4. The video is strong enough with just Booking + Email + Cancellation.
