The issue lies in your Google Cloud Project's OAuth Consent Screen configuration, which is currently set to "Testing."

In "Testing" mode, Google enforces a mandatory 7-day expiration on refresh tokens for security purposes. To resolve this, you must navigate to the Google Cloud Console, open "APIs & Services" > "OAuth consent screen," and click the button to "Publish App" (setting it to "In production").

Once the status is "In production," your credentials will no longer expire after 7 days; you may encounter a "Google hasn't verified this app" warning screen during the initial authentication, but you can safely bypass this for your own internal automation.

Check all email messages

## Pre-Integration Tasks (Before Client Deployment)

- [ ] **Twilio Phone Number** - Replace placeholder `+1234567890` in workflows with client's actual Twilio number (or disable SMS if not needed)
- [ ] **Gmail Account** - Verify Gmail OAuth credentials work for client's sending email address
- [ ] **Google Calendar** - Verify calendar integration uses correct clinic calendar
- [ ] **Phone Validation** - Investigate why phone numbers aren't saving to Supabase (check if empty values are being sent, consider enforcing required phone input)



Areas for Improvement/Suggestions

Security/Compliance Depth: You're on the right track with RLS and GDPR, but for health data (even if not full clinical records, service + name can be sensitive under Art. 9), consider a formal audit or BAA-like terms if targeting EU clinics. Add 2FA for admin/super-admin.
Integrations Growth: Google Calendar is good; add Outlook/Apple Calendar or full PMS integrations (e.g., with popular ones like Curve/Oryx if they have APIs) to reduce switching friction.
Scalability/Costs: n8n on VPS works for now, but at scale, migrate more to Supabase Functions or another serverless (e.g., Cloudflare Workers for some workflows) to cut maintenance. Monitor Stripe/n8n costs per booking.
Marketing Angle: Emphasize ROI: no-show reduction via reminders/recalls, review automation, funnel analytics. In Latvia/EU, highlight local language support and EU data hosting (Supabase is GDPR-compliant).
Minor Polish: Mobile widget responsiveness (if not already), more payment options (e.g., local cards/SEPA), or deposit-only vs full payment flexibility.