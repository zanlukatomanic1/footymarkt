# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server at localhost:3000
npm run build    # production build
npm run lint     # eslint
```

No test suite exists yet.

## Stack

- **Next.js 14** — App Router, TypeScript, `src/` directory, path alias `@/*` → `src/*`
- **Supabase** — Postgres + Auth (Google OAuth only). Two clients: `@supabase/ssr` browser client and server client; a service-role admin client for privileged operations.
- **Tailwind CSS v3** — custom design tokens in `tailwind.config.ts`
- **Fonts** — Syne (display/headings), DM Sans (body), DM Mono (numbers/labels/codes) loaded via `next/font/google`
- **Deploy target** — Vercel

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # server-only, never exposed to browser
ADMIN_EMAILS=                # comma-separated, grants /admin access
```

## Architecture

### Supabase client pattern
Three wrappers in `src/lib/supabase/`:
- `client.ts` — `"use client"` browser client, used in Client Components
- `server.ts` — server client (reads cookies) + `createAdminClient()` (service role, no RLS)
- `middleware.ts` — session refresh in `middleware.ts` at root

### Layout & navigation
- `src/app/layout.tsx` fetches the user profile once and passes `username`, `coins`, `is_admin`, `signedIn` as props to `<Sidebar>` and `<MobileNav>`.
- Desktop: 220px fixed `<Sidebar>` (Client Component, uses `usePathname` for active state).
- Mobile: sidebar hidden, `<MobileNav>` fixed bottom tab bar.
- Each page renders its own `<TopBar title subtitle />` (Server Component, fetches coins independently) as the first element inside the page content — not in the layout.

### Server vs Client component split
- Pages are Server Components that fetch data and pass it down.
- Interactive parts are extracted as Client Components: `HomeClient`, `LeaderboardClient`, `MatchCard`, `PredictForm`, `LeagueActions`, `Sidebar`, `MobileNav`, `AdminMatchRow`, `SignOutButton`.
- The leagues `[id]` page is fully client-side (fetches data via Supabase browser client in `useEffect`) because it needs real-time member data.

### Auth flow
1. `/login` → Google OAuth → Supabase → `/auth/callback/route.ts`
2. Callback checks if `users.username` is null → redirects to `/username` if so
3. Username page sets the username, then redirects to `/`
4. `middleware.ts` refreshes sessions on every request

### Coin system
Defined in `src/lib/coins.ts`:
- Base reward: 100 coins
- Multiplier: `1 + (1 - share)` where `share = same_pick_count / total_picks`
- A pick made by 20% of users → 1.8× → 180 coins; 80% → 1.2× → 120 coins
- Coins are **only awarded** when an admin sets a match result via `POST /api/admin/result`
- The API route writes the result then calls the Postgres function `award_match_coins(match_id)` via service-role RPC
- `award_match_coins` recomputes all `coins_earned` on that match and rebuilds every affected user's `coins` balance from scratch (sum of all `coins_earned`)
- Users start with 1000 coins (table default)

### Admin access
Two ways to be admin: `users.is_admin = true` in DB, OR email listed in `ADMIN_EMAILS` env var. Both `/admin` page and `POST /api/admin/result` check both conditions.

## Database Schema

```
users          — id (FK auth.users), username (unique), coins (default 1000), is_admin
matches        — id, home_team, away_team, kickoff_at, result (enum home/draw/away, nullable), competition
predictions    — id, user_id, match_id, prediction, coins_earned, was_correct, unique(user_id, match_id)
leagues        — id, name, invite_code (unique), created_by
league_members — league_id, user_id (composite PK)

match_sentiment (VIEW) — match_id, home_count, draw_count, away_count, total_count
```

RLS: predictions can only be inserted/updated by the owning user AND only while `kickoff_at > now()` AND `result IS NULL`.

## Design Tokens (Tailwind)

Key colour names: `page` (#070707), `card` (#141414), `element` (#1a1a1a), `sidebar` (#0a0a0a), `topbar` (#0f0f0f), `brand` (#00ff87), `accent` (#4d7cff), `line` (#1e1e1e), `line-subtle/strong/muted`, `ink` through `ink-silent` (descending brightness). Gold/silver/bronze for leaderboard ranks.

## Key Utilities

- `src/lib/teamData.ts` — maps team name → `{ code, flag }` where `flag` is `/flags/TeamName.svg` (static files in `public/flags/`)
- `src/lib/dates.ts` — locale-independent date formatting (always use these, never `toLocaleDateString(undefined)` which causes SSR/client hydration mismatches)
- `src/lib/types.ts` — shared TypeScript types: `Outcome`, `Match`, `Sentiment`, `Prediction`, `UserRow`, `League`

## Fixtures

72 WC 2026 group stage matches are seeded in `supabase/migrations/0002_seed_matches.sql`. The `matches` table has a unique constraint on `(home_team, away_team, kickoff_at)`. API-Football integration is **not** built yet — results are entered manually via `/admin`.

## What's Not Built Yet

- Real-time sentiment updates (Supabase Realtime channels on `predictions` table)
- API-Football integration for live fixtures/results
- Push notifications
- Match venue data
