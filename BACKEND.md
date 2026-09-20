# Academy backend

The current Next.js frontend now reads and writes real account data through `/api/*`.

## Run locally

Use Node 22.13 or later (tested on 22.20). Install dependencies with `npm ci`, then run `npm run dev`. Copy `.env.example` to `.env.local` when setting up a new environment. A git-ignored `.env.local` has already been created in this workspace, with a random administrator setup credential. Do not commit it.

Open `/login`, choose **Set up the administrator**, and enter your name, email, password (12–128 characters), and `LMS_SETUP_TOKEN` from `.env.local`. This works only before the first administrator exists. Ordinary registration always creates a learner, regardless of submitted role fields. Administrators can grant instructor/admin roles and disable accounts in `/admin`. Role changes invalidate that user's sessions. There are no default passwords or pre-created human accounts.

Local data is stored in `.data/lms.sqlite`; submissions are in `.data/uploads`. Mount both on persistent storage for a Node deployment. Back up the database and uploads together. Never expose `.data` as public web content. The database migration in `db/migrations/0001_lms.sql` runs idempotently; seed content contains courses only, never fake learner activity or grades.

## Hosting

`npm run build` builds the native Next server. `npm run build:sites` exports the client pages in an isolated temporary directory and packages the same API service as a Worker. The local API route uses SQLite; the Worker uses prepared D1 statements and R2 objects. Static export does not remove authentication or authorization: every `/api/*` route authenticates and authorizes its request on the server. `/course?id=...` supports newly created courses without rebuilding; old `/course/:id` links redirect on the hosted Worker.

Sites bindings: `DB` (D1) and `FILES` (R2). Runtime values: `LMS_SETUP_TOKEN` (secret), `LMS_ORIGIN` (exact HTTPS origin). Configure these through Sites environment settings. The setup credential is not part of frontend assets. Existing Sites audience settings remain private; app email/password accounts are separate from that hosting gate. Making the academy available without the private hosting gate is a separate audience change.

## Implemented workflows

- Register, sign in/out, password change, hashed sessions, expiry, disabled-user rejection.
- Course catalog, enrollment, bookmarks, per-account completion, last lesson, private notes, downloadable resources.
- Instructor-owned course drafts, modules, lessons, publication, archive, and enrollment roster; administrators can assign ownership.
- Assignment creation, text/link submissions, protected attachments (PDF/TXT/ZIP/PNG/JPEG, 10 MB, five per assignment), grading and feedback.
- Completion certificates after all lessons and required assignments pass; unique issuance and authenticated verification.
- Community posts, replies, unique helpful votes, administrator moderation.
- Live session scheduling with enrollment-gated meeting links.
- Profile, saved preferences, weekly goals, completion-derived activity and estimated lesson durations.
- Administrator role/access management and administrative audit events.

## Security and behavior

Passwords use salted scrypt (N=32768, r=8, p=1); sessions store only token hashes. Production cookies are Secure, HttpOnly, SameSite=Lax and use a `__Host-` prefix. State-changing API calls require the configured same Origin. Request sizes, field lengths, URLs, role changes and publication are validated server-side. SQL values are bound parameters. Read access to notes, resources, certificates and attachments is enforced per account or course owner. Rate-limit counters are persistent. Existing lessons with learner activity cannot be silently removed. Profile headlines cannot change authorization roles. Uploads are attachment downloads with nosniff and are never rendered as executable inline content.

Live classes use an instructor-supplied HTTPS meeting link; this app does not operate a video-conference server. Videos use instructor-supplied HTTPS URLs. No email sender is connected: email verification, password-reset email delivery and notification sending are not yet implemented. Notification settings are saved preferences, not delivery guarantees. Two-factor authentication is explicitly shown as unconfigured. Analytics estimate time from completed lesson durations, not watch-time telemetry. Existing sample teaching content remains seed content.

## Verification

- `npm run test:backend`: actual SQLite requests covering accounts, CSRF, learner isolation, instructor ownership, publication, grading, unique certificates, session invalidation, discussions, and reopening persistent storage.
- `npm run typecheck`: Next/React TypeScript checks.
- `npm run build:sites && node tests/worker-smoke.mjs`: hosted asset/API smoke with the D1-compatible adapter and protected uploads.

The legacy vanilla JavaScript files/tests are retained from the earlier prototype; they are not the active Next.js frontend or authoritative data storage.
