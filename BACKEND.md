# Academy backend

The current Next.js frontend now reads and writes real account data through `/api/*`.

## Run locally

Use Node 22.13 or later (tested on 22.20). Install dependencies with `npm ci`, then run `npm run dev`. Copy `.env.example` to `.env.local` when setting up a new environment. A git-ignored `.env.local` has already been created in this workspace, with a random administrator setup credential. Do not commit it.

Open `/login`, choose **Set up the administrator**, and enter your name, email, password (12–128 characters), and `LMS_SETUP_TOKEN` from `.env.local`. This works only before the first administrator exists. Ordinary registration always creates a learner, regardless of submitted role fields. Administrators can grant instructor/admin roles and disable accounts in `/admin`. Role changes invalidate that user's sessions. There are no default passwords or pre-created human accounts.

Local data is stored in `.data/lms.sqlite`; submissions are in `.data/uploads`. Mount both on persistent storage for a Node deployment. Back up the database and uploads together. Never expose `.data` as public web content. Migrations in `db/migrations/*.sql` run in filename order on every startup and are each idempotent; seed content contains courses only, never fake learner activity or grades.

Outgoing email (account verification, password reset) sends through [Resend](https://resend.com) when `LMS_EMAIL_API_KEY` and `LMS_EMAIL_FROM` are set. Leave them blank in development: the message, including the verification code or reset link, is logged to the console instead of being sent, so the flow is fully testable without a provider account.

## Hosting

`npm run build` builds the native Next server. `npm run build:sites` exports the client pages in an isolated temporary directory and packages the same API service as a Worker. The local API route uses SQLite; the Worker uses prepared D1 statements and R2 objects. Static export does not remove authentication or authorization: every `/api/*` route authenticates and authorizes its request on the server. `/course?id=...` supports newly created courses without rebuilding; old `/course/:id` links redirect on the hosted Worker.

Sites bindings: `DB` (D1) and `FILES` (R2). Runtime values: `LMS_SETUP_TOKEN` (secret), `LMS_ORIGIN` (exact HTTPS origin), and optionally `LMS_EMAIL_API_KEY` (secret) and `LMS_EMAIL_FROM` for outgoing email. Payments use `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_YEARLY`, and optional `STRIPE_PORTAL_CONFIGURATION_ID`. Configure these through Sites environment settings. The Stripe webhook URL is `/api/billing/webhook`. The setup and Stripe credentials are never part of frontend assets. Existing Sites audience settings remain private; app email/password accounts are separate from that hosting gate. Making the academy available without the private hosting gate is a separate audience change.

Keep `STRIPE_BILLING_ENABLED=false` until Stripe can deliver events to `/api/billing/webhook` on an externally reachable HTTPS deployment. The current private Sites access gate blocks unauthenticated Stripe webhook requests, so adding Stripe keys alone must not open checkout. Once a reachable deployment and webhook are tested, set `STRIPE_BILLING_ENABLED=true`. The pricing page reads actual amounts and currency from the configured Stripe Prices; it displays no invented amount before activation.

Scheduled notification emails (live-class reminders and the weekly digest) need an external trigger, since neither the Node server nor this Worker run a background scheduler on their own: set `LMS_NOTIFICATIONS_TOKEN` (secret) and point a trusted scheduler at `POST /api/notifications/sweep` every 5-10 minutes with header `Authorization: Bearer <LMS_NOTIFICATIONS_TOKEN>`. The private Sites access gate also blocks an external scheduler; use a scheduler that can reach the application before enabling it. The endpoint is disabled while the token is unset. Live-class reminders are recorded per class and the weekly digest is gated to roughly once every 7 days per learner.

## Implemented workflows

- Register, sign in/out, password change, hashed sessions, expiry, disabled-user rejection.
- Email verification via a 6-digit one-time code (entered in-app, 15-minute expiry) and password reset via a single-use emailed link (1-hour expiry); both send through a configurable provider (Resend), with a resend option and no account-enumeration on reset requests.
- Course catalog, enrollment, bookmarks, per-account completion, last lesson, private notes, downloadable resources.
- Instructor-owned course drafts, modules, lessons, publication, archive, and enrollment roster; administrators can assign ownership.
- Course editor metadata for subtitle, language, promotional video, target audience, learning outcomes, requirements, and per-course certificate enablement; values are validated on the server.
- Module and lesson order can be changed with drag handles or keyboard-friendly move buttons in the instructor editor; saving persists the order through existing position columns.
- Assignment creation, text/link submissions, protected attachments (PDF/TXT/ZIP/PNG/JPEG, 10 MB, five per assignment), grading and feedback.
- Completion certificates after all lessons and required assignments pass; unique issuance and authenticated verification.
- Community posts, replies, unique helpful votes, administrator moderation.
- Live session scheduling with enrollment-gated meeting links.
- Profile, saved preferences, weekly goals, completion-derived activity and estimated lesson durations.
- Administrator role/access management and administrative audit events.
- Custom roles with validated granular permissions, server-side permission checks, role assignment, and session invalidation after access changes. Existing administrator accounts are Super Admins; the built-in Admin role and custom roles can be assigned from Administration.
- Instructor approval workflow: promoting a learner to instructor starts them pending (no course-creation access) until someone holding `manage_instructors` approves or rejects the account from Administration; approval/rejection revokes the affected session, matching every other access change. Instructor accounts that predate this workflow are grandfathered in as approved by the migration itself, so it never locks out an existing instructor.
- Administration: searchable and filterable (role, active/disabled) account list, a metrics header, manual learner enrollment into any published course, per-learner enrollment and progress detail, and an admin-triggered password-reset email — gated respectively by `manage_students` and reusing the existing single-use email reset flow (no endpoint ever sets or exposes a password directly).
- Stripe-hosted monthly/yearly Pro checkout, signed idempotent webhooks, entitlement-gated courses, and Stripe Customer Portal management. Payment never grants an instructor or administrator role.
- Notification emails honoring each learner's saved preferences: assignment-graded alerts, community reply/upvote alerts, live-class reminders (~30 minutes ahead), and an opt-in weekly learning digest. The first two send immediately from the triggering request; the latter two need the external scheduler described above.

## Security and behavior

Passwords use salted scrypt (N=32768, r=8, p=1); new accounts require 12–128 characters and sessions store only token hashes. Production cookies are Secure, HttpOnly, SameSite=Lax and use a `__Host-` prefix. State-changing API calls require the configured same Origin, except the Stripe webhook, which requires a current HMAC signature. Checkout price IDs are selected server-side. Request sizes, field lengths, URLs, role changes and publication are validated server-side. SQL values are bound parameters. Read access to notes, resources, certificates and attachments is enforced per account or course owner. Rate-limit counters are persistent. Existing lessons with learner activity cannot be silently removed. Profile headlines cannot change authorization roles. Uploads are attachment downloads with nosniff and are never rendered as executable inline content.

Live classes use an instructor-supplied HTTPS meeting link; this app does not operate a video-conference server. Videos use instructor-supplied HTTPS URLs. All outgoing email — verification, password reset, and the notification emails below — sends through the same configurable provider and is best-effort: a delivery failure is logged but never blocks the action that triggered it, and reset requests always respond identically whether or not the address has an account. Each notification preference in Settings is checked before sending (defaults match what the toggle shows: assignment-graded, live-class reminders, and community replies/upvotes default on; the weekly digest defaults off and is opt-in); the `/api/notifications/sweep` endpoint that drives the two time-based ones is itself only active when `LMS_NOTIFICATIONS_TOKEN` is configured. Two-factor authentication is explicitly shown as unconfigured. Analytics estimate time from completed lesson durations, not watch-time telemetry. Existing sample teaching content remains seed content.

## Verification

- `npm run test:backend`: actual SQLite requests covering accounts, CSRF, learner isolation, instructor ownership, publication, grading, unique certificates, session invalidation, discussions, email verification codes/resend, password-reset token consumption, and reopening persistent storage.
- `npm run typecheck`: Next/React TypeScript checks.
- `npm run build:sites && node tests/worker-smoke.mjs`: hosted asset/API smoke with the D1-compatible adapter and protected uploads.

The legacy vanilla JavaScript files/tests are retained from the earlier prototype; they are not the active Next.js frontend or authoritative data storage.
