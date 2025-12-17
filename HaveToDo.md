The issue lies in your Google Cloud Project's OAuth Consent Screen configuration, which is currently set to "Testing."

In "Testing" mode, Google enforces a mandatory 7-day expiration on refresh tokens for security purposes. To resolve this, you must navigate to the Google Cloud Console, open "APIs & Services" > "OAuth consent screen," and click the button to "Publish App" (setting it to "In production").

Once the status is "In production," your credentials will no longer expire after 7 days; you may encounter a "Google hasn't verified this app" warning screen during the initial authentication, but you can safely bypass this for your own internal automation.

Check all email messages

## Pre-Integration Tasks (Before Client Deployment)

- [ ] **Twilio Phone Number** - Replace placeholder `+1234567890` in workflows with client's actual Twilio number (or disable SMS if not needed)
- [ ] **Gmail Account** - Verify Gmail OAuth credentials work for client's sending email address
- [ ] **Google Calendar** - Verify calendar integration uses correct clinic calendar
