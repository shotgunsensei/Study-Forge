# StudyForge AI

A production-ready study materials SaaS web app where students paste notes and receive AI-generated flashcards, quizzes, review sheets, and personalized study plans.

## Architecture

- **Monorepo**: pnpm workspaces with TypeScript project references
- **Frontend** (`artifacts/studyforge`): React + Vite + Tailwind + shadcn/ui, dark-mode-first with deep blue / electric violet brand palette. Routing via wouter. Data via generated react-query hooks from `@workspace/api-client-react`.
- **Backend** (`artifacts/api-server`): Express 5 + cookie-session auth + Drizzle/Postgres
- **API Contract**: OpenAPI spec at `lib/api-spec/openapi.yaml`. Codegen produces:
  - `@workspace/api-client-react`: React Query hooks
  - `@workspace/api-zod`: Zod schemas (used server-side for input validation)
- **Database** (`@workspace/db`): Drizzle ORM tables — users, sessions, folders, study_sets, flashcards, quiz_questions, quiz_attempts, study_sessions, exam_countdowns

## Auth & Demo Accounts

Sessions stored as random tokens in `sessions` table, sent via httpOnly `sf_session` cookie. Passwords hashed with scrypt.

Seeded on first start:
- `student@example.com` / `demo123` — Free plan, 8 sample sets across subjects
- `tutor@example.com` / `demo123` — Tutor plan
- `admin@example.com` / `demo123` — Admin role, Pro plan

## Generation

Local deterministic generator in `artifacts/api-server/src/lib/generator.ts` produces flashcards, MCQs, short-answer questions, key terms, summary, review sheet, and a study plan from raw notes — no external AI required. If `OPENAI_API_KEY` is later added it can replace this layer.

## Plan Limits

- **Free**: 3 study sets, 25 flashcards/set, 3 quiz attempts/month, no exam countdowns
- **Pro**: Unlimited everything, exam countdowns, advanced exports
- **Tutor**: Pro features + tutor groups

Returns HTTP 402 with `{ limitReached: true, feature, currentPlan, upgradeTo }` on limit hit; frontend shows an upgrade modal.

## Billing

Demo mode active when `STRIPE_SECRET_KEY` is missing — checkout instantly upgrades the user, billing portal downgrades to free, and the UI shows a "Demo Mode" banner.

For real Stripe checkout set: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`, `STRIPE_TUTOR_PRICE_ID`, and (recommended) `APP_PUBLIC_URL` for canonical redirect origins. The webhook endpoint at `POST /api/billing/webhook` verifies signatures with the raw request body (excluded from the global JSON parser in `app.ts`) and handles `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`. Customer + subscription IDs are persisted on `users.stripe_customer_id` / `users.stripe_subscription_id`.

## Security & abuse controls

- `app.set('trust proxy', true)` so `req.ip` reflects the real client IP behind the Replit edge.
- In-memory rate limiter (`src/lib/rateLimit.ts`): `/api/contact` 5/hour/IP, `/api/auth/login` + `/api/auth/signup` 20/15min/IP. For multi-instance prod, swap with a Redis-backed store.
- `DELETE /api/auth/account` runs `deleteUserCascade()` which transactionally removes flashcards, quiz questions, study sessions, quiz attempts, exam countdowns, study sets, folders, sessions, then the user row. Demo accounts (`@example.com`) are server-side protected.

## Routing

Frontend lives at `/`, API at `/api/*`. Both pass through the workspace proxy.

## Common Commands

- `pnpm --filter @workspace/api-spec run codegen` — regen client/zod after spec changes
- `pnpm --filter @workspace/db run push` — apply schema changes
- `pnpm -w run typecheck` — full typecheck across workspace
- `PORT=3000 BASE_PATH=/app pnpm --filter @workspace/studyforge run build` — production build

## Launch Polish (May 2026)

- Landing page rebuilt with How-it-works, testimonials, FAQ, and final CTA sections.
- Pricing page now has accessible feature-comparison table (caption, scope, sr-only labels), FAQ, and dynamic "Current Plan" badge.
- Limit modal redesigned with feature-aware copy and Pro benefits list.
- Dashboard onboarding card for first-time users; richer empty states.
- Account page surfaces usage stats (sets / quizzes / cards) alongside plan status.
- 404 page now uses theme tokens, has a friendly icon, and links back to home/dashboard.
- Sidebar uses distinct icons (LayoutDashboard / Library / Calendar / Settings).
- Login & signup forms have autoComplete attributes; signup enforces 8-char password.
- Exam date input uses local-date min (TZ-safe).
- All UI emoji removed (review sheet uses Flame lucide icon).
