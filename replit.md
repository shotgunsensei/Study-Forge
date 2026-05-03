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

## Routing

Frontend lives at `/`, API at `/api/*`. Both pass through the workspace proxy.

## Common Commands

- `pnpm --filter @workspace/api-spec run codegen` — regen client/zod after spec changes
- `pnpm --filter @workspace/db run push` — apply schema changes
- `pnpm -w run typecheck` — full typecheck across workspace
