# Project Requirements

This file captures the confirmed requirements for this project.

## Confirmed by User

- Use the existing project in `next-fullstack-app`
- Build a production-ready setup
- Include auth, database, validation, and logging
- Use hosted Postgres for deployment reliability
- Use simple Google login mapped to internal `userId`
- Mark attached criteria as requirements

## Engineering Quality Requirements

- Strict TypeScript
- Modular service-layer architecture
- Small focused functions
- Reusable validation and utility modules
- Clean naming and folder structure

## Security Requirements

- Validate request/response payloads with Zod
- Sanitize user input
- Never trust external/auth payloads blindly
- Handle API errors and fallback states
- Keep secrets in environment variables
- Avoid unsafe HTML rendering

## Testing Requirements

- Utility function tests
- Planner schema validation tests
- Itinerary parsing tests
- Vitest as test runner

## Accessibility Requirements

- Semantic HTML and heading structure
- Keyboard focus states
- Labels for form controls
- `aria-live` status updates
- Mobile responsive layout
- Sufficient color contrast

## Efficiency Requirements

- Debounced UI status updates
- Avoid unnecessary network calls
- Isolated API routes and focused payloads
- Minimal rerender patterns in components

## Problem Alignment Requirements

- Dynamic planning support via structured itinerary schema and parser
- Preference/constraint-safe payload handling via validation layer
- Extensible foundations for realtime itinerary adaptation
