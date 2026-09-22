# Publish the LMS from your own Cloudflare account

This project already builds as a Cloudflare Worker with D1 for LMS records and R2 for protected assignment uploads. The new `*.workers.dev` or custom-domain URL has **no Codex Sites sign-in gate**. Learners and staff sign in through the LMS's own email/password form. Publishing is manual: only someone authenticated to your Cloudflare account can run the deployment command. There is no GitHub auto-deploy workflow.

The existing Codex Sites deployment is a separate copy. Keep it running until the new URL, account setup, and data are verified. Publishing to your Cloudflare account does not transfer its D1 database, R2 objects, or environment secrets automatically.

## First deployment

1. Install Node.js 22.13+ and run `npm ci` in this repository.
2. Run `npx wrangler login` and sign in to **your** Cloudflare account. Verify with `npx wrangler whoami`.
3. Create your resources: `npx wrangler d1 create tekskillup-academy` and `npx wrangler r2 bucket create tekskillup-academy-files`. Copy the D1 database ID from Wrangler's output.
4. Copy `wrangler.jsonc.example` to `wrangler.jsonc`. Replace `REPLACE_WITH_YOUR_D1_DATABASE_ID` with that ID. If you used a different R2 bucket name, update it too. `wrangler.jsonc` is intentionally git-ignored because it belongs to your Cloudflare account.
5. Copy `cloudflare-secrets.example.json` to `cloudflare-secrets.json`. Generate a **new** setup token with `openssl rand -hex 32` and paste it as `LMS_SETUP_TOKEN`. This file is git-ignored. Do not reuse the token from the Codex Sites deployment or commit secrets to GitHub.
6. Run `npm run deploy:cloudflare`. This validates the local configuration, builds the Worker, and deploys it with the setup secret in one command. Save the `*.workers.dev` URL printed by Wrangler.
7. Open `<your-worker-url>/login`, choose **Setup**, and create your Super Admin account with the new token. Then test sign-in, course browsing, and the instructor/admin pages.

The app uses the incoming request origin for links and cookie security when `LMS_ORIGIN` is unset. If you attach a custom domain, set `LMS_ORIGIN` to its exact `https://` origin in `cloudflare-secrets.json` and redeploy. Do not include a trailing slash.

For repeat releases, pull the latest GitHub `main` branch and run `npm ci` and `npm run deploy:cloudflare` yourself. Cloudflare only receives a new version when you execute that command or deliberately configure a separate deployment pipeline.

## Optional services

Add `LMS_EMAIL_API_KEY` and `LMS_EMAIL_FROM` to `cloudflare-secrets.json` for email verification and password resets. Until an email provider is configured, those flows are unavailable on the live Worker. Add Stripe secrets and price IDs only when you are ready to test billing; keep `STRIPE_BILLING_ENABLED` set to `false` in `wrangler.jsonc` until Stripe can reach and successfully sign requests to `https://<your-domain>/api/billing/webhook`. Then change it to `true` and redeploy. The public Worker URL removes the Codex access gate that currently blocks Stripe's webhook.

Current optional secret names: `LMS_ORIGIN`, `LMS_EMAIL_API_KEY`, `LMS_EMAIL_FROM`, `LMS_NOTIFICATIONS_TOKEN`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_YEARLY`, and `STRIPE_PORTAL_CONFIGURATION_ID`. Store them only in `cloudflare-secrets.json` or Cloudflare's secret settings, never in the tracked Wrangler config. `LMS_NOTIFICATIONS_TOKEN` enables the protected notification sweep API; it still needs a scheduler.

## Existing data and cutover

At the time this guide was prepared, the current private Sites database contained one user account and the four seed courses. It had no enrollments, progress, notes, submissions, attachments, certificates, live classes, or subscriptions. If that remains true at cutover, creating a new Super Admin on your Cloudflare deployment is the simplest path. **Recheck before switching users over:** any new learner activity or course edits on the old site must be migrated first. D1/R2 resources from the Sites project are separate from those in your Cloudflare account. Keep the old site private until data is copied and verified; do not remove or repoint it as part of the first deployment.

Cloudflare's [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/), [D1 and R2 bindings](https://developers.cloudflare.com/r2/get-started/workers-api/), and [secrets deployment](https://developers.cloudflare.com/workers/configuration/secrets/) documentation describe the underlying Cloudflare controls. For a database export/import after real activity exists, use Cloudflare's [D1 import/export process](https://developers.cloudflare.com/d1/best-practices/import-export-data/); the current Sites-managed database requires an export from that project before it can be imported into your account.
