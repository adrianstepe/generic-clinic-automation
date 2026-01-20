ow to Roll Your Stripe Secret Key
Yes, regenerate the SECRET test key (sk_test_...) - that's the one that was exposed.

Steps:
Go to Stripe Dashboard: dashboard.stripe.com/test/apikeys
Find "Secret key" in the Standard Keys section
Click the ... menu next to the secret key → "Roll key..."
Choose expiration: Select "Expire immediately" (or 24 hours if you want a buffer)
Copy the new key that starts with sk_test_...
Update Cloudflare:
Go to Cloudflare Dashboard → Pages → generic-clinic-automation → Settings → Environment Variables
Update STRIPE_SECRET_KEY with the new value
Redeploy (or it auto-deploys on next push)
Note: The publishable key (pk_test_...) is meant to be public and doesn't need rotation. Only the secret key needed fixing, which is now done ✅