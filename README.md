# Production-Ready Next.js Full-Stack Starter

This project is set up as a production-oriented baseline for a travel planning engine hackathon build.

---

Focused and improved on 6 parameters Code Quality, Security, Efficiency, Testing, Accessibility, Problem Statement Alignment

---

## What is Included

- Next.js App Router (frontend + backend)
- Google authentication with NextAuth
- Hosted Postgres persistence (`DATABASE_URL` / `POSTGRES_URL`)
- Stable internal `userId` mapping for Google users
- OpenAI-backed itinerary generation + replanning
- Zod validation layer for API and structured itinerary parsing
- Structured logging with Pino
- Vitest test suite for utility and planner logic
- Accessibility-first starter UI patterns

## AI Evaluation Improvements (6 Sectors)

This project was improved specifically against the six evaluation sectors shown in the score report.

1. Code Quality
- Introduced shared trip contracts in `src/lib/trips/types.ts` to reduce duplicated inline types.
- Added a typed API client in `src/lib/trips/client.ts` for consistent request/response handling.
- Removed unused legacy code (`travel-dashboard` + old debounce utility) to reduce maintenance surface.
- Kept server/data responsibilities clearer: server pages prefetch data, client components focus on interaction.

2. Security
- Production env validation enforces OAuth + DB requirements and secure secret length.
- API inputs are sanitized and validated with Zod (`createTripSchema`, `replanTripSchema`).
- Auth uses Google profile validation before user mapping.
- Non-secret config is isolated in `/api/config`; secrets remain server-side env values.

3. Efficiency
- Reduced extra client fetches:
  - `/` now does server-side session/config checks instead of client round trips.
  - `/travel` uses server-prefetched previous searches (`initialTrips`) instead of immediate client refetch.
- Trip list endpoint now returns summaries for list views (no large itinerary payload in history cards).
- Removed unnecessary debounced status update path and related state churn.

4. Testing
- Expanded automated tests for critical logic:
  - `src/lib/validation/trip-schema.test.ts`
  - `src/lib/openai/itinerary.test.ts`
  - `src/lib/trips/client.test.ts`
  - `src/lib/env.test.ts`
- Existing parser/sanitize tests retained.
- Current suite: 19 passing tests (`pnpm test`), with coverage reporting (`pnpm test:coverage`).

5. Accessibility
- Semantic structure preserved across pages (forms, labels, headings, status regions, button states).
- Date and input controls use explicit labels and required/disabled semantics.
- Focus-visible/button behavior maintained with keyboard-friendly interactions.

6. Problem Statement Alignment
- Maintains end-to-end travel planner workflow:
  - Google login -> userId mapping -> trip input -> OpenAI itinerary generation -> replanning.
- Supports production deployment expectations:
  - Hosted Postgres persistence
  - Validation + logging
  - Auth-protected APIs
  - Travel search + detailed itinerary pages.

## Project Structure

- `src/app` - frontend pages and API routes
- `src/lib/auth` - auth options and callbacks
- `src/lib/db` - Postgres service layer and persistence helpers
- `src/lib/validation` - input sanitization and API schemas
- `src/lib/planner` - itinerary schema and parser
- `src/lib/openai` - OpenAI integration for trip planning
- `src/lib/trips` - shared trip contracts and typed API client helpers
- `src/types` - NextAuth type augmentation
- `src/test` - test setup
- `REQUIREMENTS.md` - explicit project requirements baseline

## Environment Setup

1. Copy `.env.example` to `.env.local`
2. Fill values for Google OAuth credentials
3. Add your hosted Postgres connection string in `DATABASE_URL`
4. Keep `NEXTAUTH_SECRET` long and random (32+ chars)
5. If your provider has custom/self-signed chain in dev, set `DB_SSL_REJECT_UNAUTHORIZED=false`
6. Add `OPENAI_API_KEY` (optional fallback itinerary is used when missing)

Google OAuth callback URL to configure in Google console:

- `http://localhost:3000/api/auth/callback/google`

## Run the App

```bash
pnpm dev
```

Open `http://localhost:3000`

## API Endpoints

- `GET /api/config` - Returns non-secret runtime feature flags
- `GET /api/message` - Backend health response (validated)
- `POST /api/message` - Validated request/response demo
- `GET /api/profile` - Auth-protected profile from Postgres
- `GET /api/trips` - List user trips
- `POST /api/trips` - Create a new trip + generate itinerary
- `POST /api/trips/:tripId/replan` - Replan an existing itinerary
- `GET|POST /api/auth/[...nextauth]` - NextAuth endpoints

## Testing

```bash
pnpm test
pnpm test:coverage
```

## Build for Production

```bash
pnpm build
pnpm start
```
