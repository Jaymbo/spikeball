# Copilot instructions for Spikeball

## Architecture snapshot
- This is a Next.js 14 App Router app (`src/app`) with a single-page client UI in `src/app/page.tsx` and route handlers in `src/app/api/**/route.ts`.
- Business logic lives in `src/lib/elo.ts` (ELO math, decay, matchup generation) and `src/lib/auth.ts` (JWT + password hashing).
- Persistence uses Prisma + SQLite (`prisma/schema.prisma`, `src/lib/db.ts`). Most write operations are transactional (`db.$transaction`) to keep `Player`, `Game`, and `EloChange` consistent.
- Main data flow: UI component -> `/api/*` handler -> Prisma + `lib/elo` -> JSON back to UI (`toast` feedback via `sonner`).


## Domain rules you must preserve
- Ratings are per-player, for 2v2 matches; winner is derived from score, and ties are invalid (`/api/games`).
- Recalculation paths are destructive by design:
  - `POST /api/replay` resets all players to 1000 and rebuilds from game history.
  - `DELETE /api/games?id=...` deletes one game, then resets and replays all remaining games.
- Leaderboard has side effects: `GET /api/leaderboard` applies inactivity decay before returning data.
- `root` is reserved/hidden: exclude from player-facing lists and block rename/delete/create to that name.

## Auth and permissions
- Auth is custom JWT in `auth-token` cookie (not NextAuth despite dependency present).
- Password hashing uses PBKDF2 in `src/lib/auth.ts`; reuse `hashPassword()`/`verifyPassword()`.
- Admin-only actions: player create/delete, game delete, admin password reset.
- Player creation also creates a linked `User` and forces first-login password change (`requiresPasswordChange=true`).

## Project conventions
- Use alias imports (`@/*`) and existing shadcn/ui components under `src/components/ui`.
- Keep API validation explicit in handlers (early `400/403/404` returns); responses are partly German—match existing language in touched area.
- Preserve `include: { eloChanges: true }` where UI needs per-player ELO deltas (recent game cards/history).
- Do not remove Prisma query logging in `src/lib/db.ts` unless explicitly requested.

## Dev workflows
- Install: `npm install`
- Start dev server (logs to `dev.log`): `npm run dev`
- Prisma sync/generate: `npm run db:push` and `npm run db:generate`
- Build/start prod: `npm run build` then `npm run start` (uses standalone output + absolute SQLite path).
- Lint: `npm run lint`
- There is no formal test suite in this repo; validate by running lint and exercising key API flows.

## Deployment-specific constraints
- Production runtime expects `DATABASE_URL=file:/home/server2/spikeball/db/custom.db` (see `package.json`, `spikeball.service`).
- Next config intentionally allows builds with TS errors (`ignoreBuildErrors: true`); keep changes type-safe anyway.
- Reverse proxy assumes app on port 3000 (`Caddyfile`).
