# FootyMarkt

Social fake-money prediction market for football. The crowd sets the odds.

## Stack

- Next.js 14 (App Router, TypeScript)
- Supabase (Postgres + Auth)
- Tailwind CSS
- Vercel for deploy

## Setup

1. **Install deps**

   ```bash
   npm install
   ```

2. **Create a Supabase project** at https://supabase.com.

3. **Run SQL migrations** in the Supabase SQL editor, in order:
   - `supabase/migrations/0001_initial_schema.sql`
   - `supabase/migrations/0002_seed_matches.sql`

4. **Enable Google OAuth** in Supabase → Authentication → Providers → Google.
   Add `http://localhost:3000/auth/callback` and your production URL
   `https://<your-app>.vercel.app/auth/callback` to the allowed redirect URLs.

5. **Env vars** — copy `.env.local.example` to `.env.local` and fill:

   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...   # server-only
   ADMIN_EMAILS=you@example.com    # comma-separated
   ```

6. **Run**

   ```bash
   npm run dev
   ```

## How it works

- **Crowd odds**: percentages are live counts of who picked what — no bookmaker.
- **Coin formula**: correct prediction earns `round(100 * (1 + (1 - share)))`,
  where `share = pickers_of_correct / total_predictions`. So if 20% picked the
  winning outcome you earn ~180; if 80% picked it you earn ~120.
- **Distribution**: when an admin sets a match result via `/admin`, the
  `award_match_coins(match_id)` Postgres function recomputes earnings on that
  match and refreshes every affected user's coin balance.
- **RLS**: predictions can only be inserted/updated by the user, and only
  before kickoff while `result` is still null. Match/league reads are public
  to members.

## Routes

- `/` — home feed (upcoming + live WC2026 markets)
- `/login` — Google sign-in
- `/username` — first-time username gate
- `/match/[id]` — full-screen prediction card
- `/leaderboard` — global ranking
- `/leagues` and `/leagues/[id]` — private leagues
- `/admin` — protected; set results

## Deploying to Vercel

1. Push to GitHub.
2. Import the repo in Vercel.
3. Set the same env vars in the Vercel project (mark `SUPABASE_SERVICE_ROLE_KEY`
   and `ADMIN_EMAILS` as server-only).
4. Add the production callback URL in Supabase Auth settings.

## Later

- Wire API-Football for fixtures and live results, replacing the seed and
  manual admin entry.
- Realtime sentiment updates via Supabase channels on the `predictions` table.
