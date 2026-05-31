# Production-Ready Next.js Full-Stack Starter

This project is set up as a production-oriented baseline for a travel planning engine hackathon build.

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

## Project Structure

- `src/app` - frontend pages and API routes
- `src/lib/auth` - auth options and callbacks
- `src/lib/db` - Postgres service layer and persistence helpers
- `src/lib/validation` - input sanitization and API schemas
- `src/lib/planner` - itinerary schema and parser
- `src/lib/openai` - OpenAI integration for trip planning
- `src/lib/utils` - reusable utility functions
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
