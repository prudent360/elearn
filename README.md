# Tekskillup Academy

Next.js frontend and LMS backend. The application has its own email/password sign-in.

Styling uses Tailwind CSS 4 through PostCSS. The existing design-system stylesheet remains in a lower `legacy` cascade layer while pages are migrated, so Tailwind utilities can be introduced without redesigning or destabilizing working learner views. New and revised UI should prefer Tailwind utilities and the theme tokens declared in `app/globals.css`.

To publish manually from your own Cloudflare account, follow [CLOUDFLARE.md](CLOUDFLARE.md). The deployment command is `npm run deploy:cloudflare`; no GitHub push automatically publishes the site.

For local development and backend details, see [BACKEND.md](BACKEND.md). The former Codex Sites project binding has been removed from this repository; its existing private deployment remains separate during migration.
