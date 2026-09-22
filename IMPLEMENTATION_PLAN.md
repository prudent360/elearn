# LMS implementation plan

## Status

Phase 1 (access foundation) and the first slice of phase 2 (admin and people) are done: role/permission tables and enforcement, a role editor, an instructor approval workflow gating course-creation access, searchable/filterable accounts, manual enrollment, per-learner progress detail, and admin-triggered (email-based, single-use) password resets. Remaining phase 2 work — instructor-side metrics/roster/announcements belong to phase 3 — is otherwise open. Phases 3-7 are not started.

## Current foundation

The app uses Next.js 16/React 19, a shared server-side API service, SQLite locally and D1/R2 on Sites. Email/password sessions, CSRF origin checks, rate limits, three fixed roles, course drafts and publication, assignments, completion certificates, basic audit events, Stripe Pro subscriptions, and learner pages already exist. The admin and instructor pages should be extended in place. The current Sites deployment is owner-private; that gate blocks external payment webhooks and scheduled notification calls.

## Sequence

1. **Access foundation:** Add role and permission tables without changing existing account records; map the existing `admin`, `instructor`, and `learner` values to Super Admin, Instructor, and Student. Add Admin and custom role assignments separately so the legacy role constraint does not require rebuilding the users table. Enforce permissions in the shared API service, preserve course ownership checks, protect the last super admin, and invalidate sessions when assignments change. Build a simple role editor in Administration. Test privilege escalation and denied API calls.
2. **Admin and people:** Extend the existing Administration page with a concise metric header, searchable/filterable users, instructor approval states, account suspension, manual enrollment, progress and enrollment detail, and audit history. Keep administrative password resets email-based and single-use; never expose or set a user's password directly.
3. **Courses and studio:** Extend existing course metadata and status with backward-compatible migrations, add pending review/unpublished states, structured lesson types and stable ordering, and implement reorder operations. Add instructor metrics, roster, announcements and review queues. Scope every instructor API query to owned courses unless a permission grants wider access.
4. **Assessments and certificates:** Add quizzes, questions, attempts, scoring, and progression rules; extend assignments with due dates, maximum scores and review states. Add certificate templates and a public verification endpoint with non-sensitive data. Keep current issued certificates valid.
5. **Orders and payments:** Add order, transaction, refund and coupon tables. Keep the existing Stripe Pro subscription path distinct from course purchases. Introduce a gateway adapter interface, then implement Stripe, Paystack and Flutterwave with provider-verified callbacks, idempotency and safe secret storage. Do not enable a gateway until its public webhook path and test transaction work end to end.
6. **Communication and settings:** Add in-app notification records, email templates, SMTP transport and test connection, grouped platform settings, and branding overrides layered onto the existing theme. Keep secrets server-only and masked in responses. Schedule timed notifications through a reachable, authenticated worker.
7. **Analytics and hardening:** Add simple admin/instructor summaries from authoritative enrollment, assessment and transaction records. Expand audit coverage, login activity and suspicious-login signals. Run migration, security, UI and deployment checks across local SQLite and hosted D1.

Each module includes schema migration, shared backend endpoints, server authorization, validation, UI loading/empty/error/success states, and focused tests. No migration may delete learner progress or existing purchases. Deployment remains private unless the owner explicitly changes its audience.
