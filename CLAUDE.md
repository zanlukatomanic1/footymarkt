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
NEXT_PUBLIC_VAPID_PUBLIC_KEY= # web push public key (exposed to browser)
VAPID_PRIVATE_KEY=            # web push private key (server-only)
VAPID_SUBJECT=                # mailto:... or https://... contact URL
```

Generate VAPID keys once with: `npx web-push generate-vapid-keys`.

## Architecture

### Supabase client pattern
Three wrappers in `src/lib/supabase/`:
- `client.ts` — `"use client"` browser client, used in Client Components
- `server.ts` — server client (reads cookies) + `createAdminClient()` (service role, no RLS)
- `middleware.ts` — session refresh in `middleware.ts` at root

### Layout & navigation
- `src/app/layout.tsx` fetches the user profile and spin availability once and passes `username`, `coins`, `is_admin`, `signedIn`, `spinAvailable` as props to `<Sidebar>` and `<MobileNav>`. Spin availability is checked by querying `daily_spins` directly with the regular (RLS-scoped) client — do **not** use `createAdminClient` in the root layout.
- Desktop: 220px fixed `<Sidebar>` (Client Component, uses `usePathname` for active state). Shows a pulsing green dot badge on the Daily Spin nav item when `spinAvailable` is true.
- Mobile: sidebar hidden, `<MobileNav>` fixed bottom tab bar. Same pulsing badge on the Spin tab.
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
daily_spins    — id, user_id, coins_won, spun_at (timestamptz). One row per spin; reset is UTC-day based.

match_sentiment (VIEW) — match_id, home_count, draw_count, away_count, total_count
```

RLS: predictions can only be inserted/updated by the owning user AND only while `kickoff_at > now()` AND `result IS NULL`. `daily_spins` is readable by the owning user (SELECT policy).

### Daily Spin (`/spin`)
- One spin per UTC calendar day; resets at midnight UTC.
- `src/app/spin/page.tsx` — Server Component; checks `has_spun_today` RPC, computes `nextSpinAt` (next UTC midnight ISO string), passes both to `<SpinWheel>`.
- `src/components/SpinWheel.tsx` — Client Component; runs a `useCountdown` hook that ticks every second; shows a live `HH:MM:SS` countdown to the next spin after the user has spun. `POST /api/spin` calls the `claim_daily_spin` Postgres function.
- Segments (7): 50 × 2, 100 × 2, 200, 300, 500 coins — weighted equally at 1/7 each.

## Design Tokens (Tailwind)

All tokens are CSS custom properties on `:root` (dark) and `[data-theme="light"]` (light). Tailwind maps them via `tailwind.config.ts`.

**Dark mode (default):**
Key names: `page` (#070707), `card` (#141414), `element` (#1a1a1a), `sidebar` (#0a0a0a), `topbar` (#0f0f0f), `brand` (#00ff87), `accent` (#4d7cff), `line` (#1e1e1e), `line-subtle/strong/muted`, `ink` → `ink-silent` (descending brightness). Gold/silver/bronze for ranks.

**Light mode (`[data-theme="light"]`):**
`page` (#F2F5FA), `card` (#FFFFFF), `element` (#F2F5FA), `sidebar` (#161616 — **always dark**), `topbar` (#FFFFFF), `brand` (#5A9600), `accent` (#3560D8), `line` (#E3E8F0), `ink` (#0F1624), `ink-muted` (#5A6478), `ink-faint` (#96A0B0). Gold (#B8860A), silver (#787878), bronze (#966220).

**Additional CSS vars (both themes, in `globals.css`):**
- `--nav-active-color` — active nav item colour (sidebar-specific: `#00ff87` dark / `#74C200` light)
- `--sidebar-avatar-gradient` — sidebar user avatar gradient
- `--sidebar-divider` — sidebar/mobile-nav border colour (always dark-appropriate)
- `--pick-home/draw/away-color` and `--pick-home/draw/away-rgb` — pick outcome colours (use `rgba(var(--pick-home-rgb), 0.12)` for tinted backgrounds)
- `--chip-active-bg/text/sub`, `--chip-inactive-bg/border/text/day/date/count` — date-nav / filter chip states
- `--match-dot-settled/open` — timeline dots on home feed
- `--lb-*` — leaderboard row backgrounds, medal avatars, text colours, header colours

### Theme switching
- `ThemeProvider` (`src/components/ThemeProvider.tsx`) stores choice in `localStorage` and toggles `data-theme` on `<html>`.
- `ThemeToggle` (`src/components/ThemeToggle.tsx`) is rendered in the sidebar bottom section.
- `layout.tsx` runs an inline sync script before paint to prevent flash of wrong theme. `<html suppressHydrationWarning>` suppresses the expected React hydration warning.
- **Sidebar is always dark** (#161616) regardless of theme — sidebar-specific tokens (`--nav-active-color`, `--sidebar-divider`, `--widget-bg`, etc.) are set to dark-appropriate values even in light mode.
- **Never use hardcoded dark hex values** (#141414, #1a1a1a, #00ff87, etc.) in components — always use CSS vars so both themes work.

## Key Utilities

- `src/lib/teamData.ts` — maps team name → `{ code, flag }` where `flag` is `/flags/TeamName.svg` (static files in `public/flags/`)
- `src/lib/dates.ts` — locale-independent date formatting (always use these, never `toLocaleDateString(undefined)` which causes SSR/client hydration mismatches)
- `src/lib/types.ts` — shared TypeScript types: `Outcome`, `Match`, `Sentiment`, `Prediction`, `UserRow`, `League`

## Fixtures

72 WC 2026 group stage matches are seeded in `supabase/migrations/0002_seed_matches.sql`. The `matches` table has a unique constraint on `(home_team, away_team, kickoff_at)`. API-Football integration is **not** built yet — results are entered manually via `/admin`.

## PWA

Installable as a home-screen app. The manifest is generated by [src/app/manifest.ts](src/app/manifest.ts) (Next serves it at `/manifest.webmanifest`); icons live in `public/icons/` (`icon-192.png`, `icon-512.png`, `icon-maskable-512.png` — must be supplied). [public/sw.js](public/sw.js) is registered in production only via [`<ServiceWorkerRegister>`](src/components/ServiceWorkerRegister.tsx) in `layout.tsx`. SW strategy: network-first for pages with cache fallback, cache-first for `/_next/static/`, `/flags/`, `/icons/`, and **never** caches `/api/`, `/auth/`, `/_next/data/`. `appleWebApp` + `viewport.themeColor` are set in `layout.tsx` metadata. Install only works over HTTPS (or `http://localhost`).

## Match Page Extras

- **Sentiment over time** ([SentimentHistory.tsx](src/components/SentimentHistory.tsx)) — Recharts step-line of cumulative `home/draw/away %` derived from `predictions.created_at`. Built server-side in [match/[id]/page.tsx](src/app/match/[id]/page.tsx) via `buildHistory()`: skips the noisy lead-in (`total < 5`) and downsamples to ≤200 points. Auto-hides when fewer than 2 valid points exist. No snapshot table — series is reconstructed from raw picks every request.
- **Recent predictions** ([RecentPredictions.tsx](src/components/RecentPredictions.tsx)) — fed by a server-side join of `predictions` + `users.username` (top 20 by `created_at`). Flex-wraps when ≤5 picks; switches to an infinite horizontal marquee (CSS keyframe, pauses on hover, mask-faded edges) when ≥6. Duration scales with item count.

## Push Notifications

Web Push via VAPID. Pieces:
- **Storage:** [supabase/migrations/0018_push_subscriptions.sql](supabase/migrations/0018_push_subscriptions.sql) — one row per `(user_id, endpoint)`, unique on `endpoint`. RLS allows owner read/delete; inserts/updates go through the API route under the service role.
- **Sender:** [src/lib/push.ts](src/lib/push.ts) — `sendPushToUsers(userIds, payload)` fans out via `web-push`, swallows individual failures, and prunes rows whose endpoint returned 404/410.
- **Subscribe API:** `POST /api/push/subscribe` upserts a subscription; `DELETE` removes one by endpoint.
- **Service worker:** [public/sw.js](public/sw.js) handles `push` (shows the notification with icon, body, tag, url payload) and `notificationclick` (focuses an existing client and navigates, or opens a new window).
- **Client prompt:** [src/components/PushPrompt.tsx](src/components/PushPrompt.tsx) — mounted in `layout.tsx`, only shown to signed-in users after a 4s delay when `Notification.permission === "default"` and `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is set. Dismissal is sticky for 7 days via `localStorage`.
- **Triggers:** `POST /api/admin/result` fans out two messages after `award_match_coins` runs — one for winners (with their coin reward) and one for losers. Failures are swallowed so settling never breaks because of push.

To enable: generate VAPID keys (`npx web-push generate-vapid-keys`), put them in env vars, run the migration. Pushes only fire from production (HTTPS) — the SW itself is gated on `NODE_ENV === "production"` in [ServiceWorkerRegister.tsx](src/components/ServiceWorkerRegister.tsx).

## What's Not Built Yet

- API-Football integration for live fixtures/results
- Match venue data
- Light mode on remaining components: `BetModal`, `SyncButtons`, `match/[id]` prediction page, `leagues/[id]` detail page, `account` page — these still have some hardcoded dark hex values
- Square PWA icons in `public/icons/` (manifest already references them)
