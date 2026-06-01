# Handoff: FootyMarkt — WC 2026 Prediction Market

## Overview
FootyMarkt is a football prediction market app for World Cup 2026. Users predict match outcomes (Home / Draw / Away), earn coins for correct predictions, compete on global and private-league leaderboards, and share invite codes to set up friends groups.

## About the Design Files
The HTML files in this bundle are **high-fidelity interactive design references built in React + Babel**. They are *not* production code to ship. Your job is to recreate these screens in your real app's stack (React Native, Next.js, Swift, Flutter, etc.) using its existing patterns and component libraries. Use these files as the pixel-level reference for layout, color, spacing, type, interaction states, and copy.

Open `footymarkt.html` in a browser to see all 6 screens stacked and interactive.

---

## Fidelity
**High-fidelity.** Every color, spacing value, font size, border radius, shadow, hover/active state, and copy string shown here is intentional and should be matched as closely as the target platform allows.

---

## Design Tokens

### Colors
```
Background (page)     #070707
Background (cards)    #141414
Background (sidebar)  #0a0a0a
Background (element)  #1a1a1a
Border (primary)      #222 / #1e1e1e
Border (subtle)       #1a1a1a

Accent green          #00ff87   ← primary brand color, CTAs, active states
Accent blue           #4d7cff   ← away team, secondary accent
Text primary          #ffffff / #e0e0e0
Text secondary        #888888
Text muted            #444444 / #3a3a3a / #2e2e2e
Text disabled         #2a2a2a

Gold (rank 1)         #FFD700
Silver (rank 2)       #a8a8a8
Bronze (rank 3)       #cd8a3a

Green tint bg         rgba(0,255,135,0.06–0.08)
Green tint border     rgba(0,255,135,0.2–0.4)
Blue tint bg          rgba(77,124,255,0.06)
Blue tint border      rgba(77,124,255,0.4)
```

### Typography
```
Display font    Syne — weights 700, 800 — used for team names, page headings, logo
Body font       DM Sans — weights 400, 500, 600, 700 — used for all UI text
Mono font       DM Mono — weights 400, 500 — used for numbers, codes, labels, tags

Google Fonts import:
  DM Sans: opsz 9..40, weights 400/500/600/700
  DM Mono: weights 400/500
  Syne: weights 700/800
```

### Type Scale
```
Headline (Syne 800)   50px, letter-spacing -2px   → showcase title
Hero team name        24px Syne 800, ls -0.5px    → match hero
Section heading       22px Syne 800               → league detail title
Card title            14–15px DM Sans 600–700
Body                  13–13.5px DM Sans 400–500
Small label           10.5–12px DM Sans
Mono data             12–16px DM Mono 500, tabular-nums
Tag / badge           10.5px DM Mono 600, ls 0.06em
Micro label           9–10px, uppercase, ls 0.08–0.1em
```

### Spacing & Shape
```
Card border-radius    12–14px
Modal border-radius   16px
Button border-radius  6–8px
Tag border-radius     4–5px
Avatar border-radius  50%
Logo mark radius      8px

Card padding          18–20px (small), 22–28px (large), 28–32px (hero)
Sidebar width         220px
TopBar height         56px
Section gap           12–14px (grid), 22px (major sections)
```

### Shadows & Glows
```
Selected card glow    0 0 24px {color}12, 0 0 0 1px {color}18
Hover card            border-color shift from #1e1e1e → #2c2c2c, bg #141414 → #171717
```

---

## Screens

### 01 — Home Feed (`fm-home.jsx`)
**Purpose:** Main dashboard — shows upcoming matches, lets user pick predictions inline.

**Layout:**
- Left sidebar (220px) + right content area (flex 1)
- TopBar (56px tall) with title, coin balance, notification bell
- Content has 16px vertical scroll, 24px horizontal padding
- Stats strip: 4-column grid, `gap: 12px`, cards `border-radius: 10px`
- Filter tabs row: flex row, `gap: 8px`
- Match grid: `display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px`

**Match Card:**
- Background `#141414`, hover `#171717`
- Border `1px solid #1e1e1e`, hover `#2c2c2c`
- Border-radius `12px`, padding `18px 18px 16px`
- Team flag emoji at 22px, team name 13px/600, code 9.5px mono
- VS divider: 10px mono, color `#2a2a2a`, ls 0.12em
- Sentiment bar below teams (see SentimentBar spec)
- Footer: prediction count (mono) + pick buttons or "locked" badge

**Prediction buttons (unpicked):**
- 3 buttons: [HomeCode] [D] [AwayCode]
- Green/grey/blue per outcome
- Border `1px solid {color}28`, color `{color}`, padding `4px 9px`, radius `6px`, 10px mono bold

**Locked pick badge:**
- Background `{color}12`, border `{color}30`, padding `4px 10px`, radius `6px`
- 10.5px mono, 700 weight, shows checkmark + team code

**Stats strip items:**
```
Predictions: 31 total
Correct: 17 (53.4%)
Coins: 2,450 (accent green)
Rank: #47 global
```

**Filter tabs:**
- Active: background `#00ff87`, color `#080808`, border `#00ff87`
- Inactive: transparent bg, color `#4a4a4a`, border `#222`
- Options: All / Today / Tomorrow / This Week

**Section dividers (`FMDivider`):**
- Flex row: 10.5px mono label (`#3a3a3a`, uppercase, ls 0.1em) + 1px line (`#1a1a1a`)

---

### 02 — Match Prediction (`fm-match.jsx`)
**Purpose:** Full-page prediction view for a single match. Click a card to lock in a prediction.

**Layout:**
- Back link row (arrow + "Back to feed", 12px mono `#3a3a3a`)
- Match hero card: `border-radius: 14px`, padding `28px 32px`, margin-bottom `20px`
- 3 prediction cards: `display: flex; gap: 14px` — equal width
- Lock confirmation banner (conditional, above cards)
- Recent predictions feed (below cards)

**Match Hero Card:**
- Competition tag + kickoff datetime + venue (mono labels)
- Teams row: flex space-between, flag at 36px, team name 24px Syne 800
- Compact sentiment bar in center (4px tall, no labels)
- Percentage display: `{hp}% · {dp}% · {ap}%` in 10px mono

**Prediction Cards (`PredCard`):**
- flex: 1, min-height ~280px, padding `28px 24px`, radius `14px`
- States: default / hover / selected / dimmed (when another is selected)
- **Default:** bg `#141414`, border `1px solid #1e1e1e`
- **Hover:** bg `#171717`, border `#2a2a2a`
- **Selected:** tinted bg + colored border + glow shadow (`0 0 24px {color}12`)
- **Dimmed:** `opacity: 0.35`
- Label: 10.5px mono uppercase, ls 0.1em, color `#3a3a3a`
- Team name: 15px/600, color: selected=accent, else `#ccc`
- Big percentage: 46px DM Mono 500, ls -2px; `%` sign 22px gray
- "market sentiment" sub-label: 10.5px mono `#333`
- Divider: 1px `#1a1a1a`
- "If correct" section: coin icon + reward amount (22px mono 700) + "coins" label
- Pick button (when not selected): 12.5px/600, radius `8px`, hover tinted
- "Locked in" badge: top-right absolute, 10px mono

**Lock confirmation banner:**
- bg `rgba(0,255,135,0.05)`, border `rgba(0,255,135,0.15)`, radius `10px`, padding `10px 14px`
- Lock icon + "Prediction locked in — {team}" + "Change" button (right-aligned)

**Recent predictions chips:**
- flex wrap, gap `8px`
- Each chip: bg `#141414`, border `#1e1e1e`, radius `20px` (pill), padding `5px 10px`
- 18px avatar circle, 11px username, 10px mono colored pick, 9.5px time

---

### 03 — Leaderboard (`fm-leaderboard.jsx`)
**Purpose:** Global ranking table, sortable by coins / correct / win rate. User's row is pinned at bottom.

**Layout:**
- Period tabs row (same style as filter tabs): WC 2026 / All Time / This Week
- Player count badge: right-aligned, bg `#141414`, border `#1e1e1e`
- Single table: bg `#141414`, radius `12px`, overflow hidden
- Ellipsis separator between rank 10 and user row
- User row pinned below separator

**Table Columns:** Rank · Player · Coins · Correct · Win Rate

**Column headers:**
- Sortable: 10.5px mono uppercase, ls 0.1em, color `#333` (inactive) / `#00ff87` (active)
- Sort direction arrows inline

**Row variants:**
- Top 3: medal emoji in rank cell; left border `2px solid {medalColor}`; tinted row bg
  - Gold: `rgba(255,215,0,0.05)` / Silver: `rgba(168,168,168,0.04)` / Bronze: `rgba(205,130,58,0.05)`
- "You" row: bg `rgba(0,255,135,0.04)`, left border `2px solid rgba(0,255,135,0.5)`, green name
- Regular rows: transparent bg, no left border

**Avatar:**
- 28px circle, initial letter centered
- You: `linear-gradient(135deg, #00ff87, #4d7cff)`, letter color `#0a0a0a`
- Top-3: `linear-gradient(135deg, {color}60, {color}20)`
- Regular: `#1a1a1a`, letter `#3a3a3a`

**Win rate color coding:**
- ≥70%: `#00ff87` + up arrow
- ≥60%: `#a8d8a8`
- <60%: `#888`

**Ellipsis row:**
- padding `10px 20px`, flex with lines on each side, `· · · ranks 11–46 · · ·` in 10.5px mono `#2a2a2a`

---

### 04 — Private Leagues (`fm-leagues.jsx`)
**Purpose:** List the user's private leagues; create or join a league.

**Layout:**
- Action row: "Create League" (green CTA) + "Join League" (ghost) + inline join input (conditional)
- Section divider + 3-column grid of league cards

**Create League button:** bg `#00ff87`, color `#080808`, padding `9px 16px`, radius `8px`, 13px/600 + plus icon

**Join inline flow:**
- Clicking "Join" reveals an input + "Join →" button inline in the action row
- Input: bg `#141414`, border `#2a2a2a`, radius `8px`, DM Mono 13px

**Create League Modal:**
- Backdrop: `rgba(0,0,0,0.7)` + `backdrop-filter: blur(4px)`
- Modal: bg `#141414`, border `#2a2a2a`, radius `16px`, `400px` wide, padding `28px 28px 24px`
- Step 1: league name input + disabled/enabled "Create League" button (green when name filled)
- Step 2: success state shows green confirmation panel + generated invite code in mono
- Code display: `#0f0f0f` bg, `#2a2a2a` border, code in 16px mono green + copy button

**League Card:**
- bg `#141414`, hover `#171717`, radius `12px`, padding `20px`
- League name: 14.5px/700 `#e0e0e0`
- Members count: 11px mono `#3a3a3a`
- Rank: top-right, 22px mono, colored by medal tier
- Leader + coin balance in footer row
- "View League" button: full-width ghost button, shows chevron, tints on hover

---

### 05 — League Detail (`fm-leagues.jsx` → `FMLeagueDetail`)
**Purpose:** League standings + member roster + copyable invite code.

**Layout:**
- Back link
- League header card (full-width, flex space-between)
- 2-column grid: standings table (flex 1) + members list (280px fixed)

**League header card:** radius `14px`, padding `22px 24px`
- Left: league name in Syne 22px 800 + member/prediction counts
- Right: invite code display block with copy button
  - Code: 15px DM Mono green, ls 0.1em
  - Copy button: bg flips to green tint on `copied` state, shows checkmark

**Standings table:** same column structure as global leaderboard but smaller (12px)
- Left border 2px colored per rank
- Rate ≥65% = green

**Members list:**
- 280px panel, scrollable
- Each row: 26px avatar + username (12.5px) + rank badge for top 3
- "You" row: green tinted bg + green name

---

### 06 — Admin Panel (`fm-admin.jsx`)
**Purpose:** Set official match results; triggers coin payouts for correct predictors.

**Layout:**
- Stats strip: 4-column grid (same pattern as Home Feed stats)
- Full-width results table

**Stats strip:**
- Total Matches (white), Settled (green), Pending (gray), Predictions Affected (blue)
- Numbers at 26px DM Mono 700

**Results table columns:** Match · Competition · Kickoff · Current Result · Set Result (dropdown) · Action (save button)

**Admin Row states:**
- **Pending / unsaved:** transparent bg
- **Has saved result:** bg `rgba(0,255,135,0.02)`, "Saved" badge (green)
- **Dirty (changed):** border on dropdown brightens to `#2a2a2a`
- **Saving:** button shows "Saving…", disabled

**Result dropdown:**
- bg `#111`, radius `7px`, padding `7px 10px`, 12px DM Mono, `appearance: none`
- Option color matches result color (green/gray/blue)

**Save button:**
- Active: bg `#00ff87`, color `#080808`
- Disabled: bg `#141414`, color `#2a2a2a`
- After save: replaced by "Saved" badge (green bg tint + check icon)
- Saving state: "Saving…" text, disabled

**Footer note:** "Settling a result triggers coin payouts for all correct predictions in that match."

---

## Shared Components

### Sidebar (`FMSidebar`)
- Width 220px, bg `#0a0a0a`, right border `1px solid #1e1e1e`
- Logo at top (padding `0 18px`)
- Nav items: flex col, gap `1px`, padding `0 10px`
  - Active: bg `rgba(0,255,135,0.07)`, color `#00ff87`, weight 600 + green dot (5px)
  - Inactive: transparent, color `#4a4a4a`, weight 400
  - Icon 17px, gap 9px from label
- Bottom section: Settings link (14px icon + text, color `#333`) + user profile row
- User avatar: 26px gradient circle + name (12px/600 `#aaa`) + balance (10.5px mono `#333`)

**Nav items:** Home · Leaderboard · My Leagues · Profile · Admin

### TopBar (`FMTopBar`)
- Height 56px, bg `#0f0f0f`, border-bottom `1px solid #1e1e1e`
- Title: 14px/600 `#ddd`; Subtitle: 10.5px mono `#3a3a3a`
- Coin badge: bg `#141414`, border `#242424`, radius `8px`, padding `5px 12px`
  - Coin icon (green) + balance (12.5px mono green) + separator · + `@you` (11.5px `#4a4a4a`)
- Bell icon button: 32×32px, bg `#141414`, radius `8px`
  - Notification dot: 6px green circle, absolute top-5 right-6, border `1.5px solid #0f0f0f`

### Sentiment Bar (`FMSentimentBar`)
- `height: 5px` (configurable), `border-radius: 999px`, overflow hidden
- 3 segments separated by 1px gap, proportional to `home : draw : away` percentages
  - Home: `rgba(0,255,135,0.65)`, left-rounded
  - Draw: `#353535`, square
  - Away: `rgba(77,124,255,0.65)`, right-rounded
- Labels below (optional): green home %, gray draw %, blue away %
  - Percentage: 12.5px mono 600, tabular-nums
  - Sub-label: 9px uppercase ls 0.08em `#3a3a3a`

### FMTag
- `10.5px DM Mono 600`, ls 0.06em, padding `2px 7px`, radius `4px`
- Default: green color + `rgba(0,255,135,0.08)` bg

### Icons
All custom SVG inline icons (17×17 default, strokeWidth 1.8, round caps/joins):
`home, trophy, shield, user, admin, settings, coin, copy, check, plus, x, chevron, bell, back, lock, up, down`

---

## Interactions & Animations

| Element | Interaction | Detail |
|---|---|---|
| Match card | hover | bg+border color shift, `transition: 0.15s` |
| Prediction card | hover | bg shift; selected → tinted bg + glow shadow |
| Prediction card | click | toggles selected; dims others to opacity 0.35 |
| Lock banner | appears | when any prediction card is selected |
| Filter/period tabs | click | active style swap |
| Leaderboard headers | click | sort col + direction toggle |
| Admin dropdown | change | marks row as dirty; enables Save button |
| Admin save | click | 600ms mock async → shows "Saved" badge |
| Create modal | name input | enables Create button when non-empty |
| Invite code copy | click | button flips to green/check for 2s then resets |
| Join flow | click "Join" | inline input + button slide into action row |
| All transitions | | `transition: all 0.15s` (or `0.2s` for prediction cards) |
| Sentiment bar segments | mount | `transition: flex 0.7s ease` |

---

## Data Structures

```typescript
// Match (Home Feed)
interface Match {
  id: number
  home: string; homeCode: string; homeFlag: string  // emoji
  away: string; awayCode: string; awayFlag: string
  competition: string   // e.g. "WC 2026 · Group D"
  kickoff: string       // e.g. "Today · 21:00"
  hp: number; dp: number; ap: number  // home/draw/away % (sum ~100)
  vol: number           // prediction count
  predicted: boolean
  myPick?: 'home' | 'draw' | 'away'
}

// Prediction option (Match Detail)
interface PredOption {
  id: 'home' | 'draw' | 'away'
  label: string; team: string
  pct: number; reward: number
  color: string; bg: string; borderColor: string
}

// Leaderboard row
interface LBRow {
  rank: number; username: string
  coins: number; correct: number; total: number; rate: number
  isMe?: boolean
}

// League
interface League {
  id: number; name: string
  members: number; myRank: number
  leader: string; coins: number
}

// Admin match
interface AdminMatch {
  id: number; home: string; away: string
  competition: string; kickoff: string
  result: 'home' | 'draw' | 'away' | null
}
```

---

## Files in This Bundle

| File | Purpose |
|---|---|
| `footymarkt.html` | Entry point — open in browser to see all 6 screens |
| `fm-shared.jsx` | Icons, Logo, Sidebar, TopBar, PageShell, SentimentBar, Tag, Divider |
| `fm-home.jsx` | Screen 01: Home Feed + MatchCard component |
| `fm-match.jsx` | Screen 02: Match Prediction + PredCard component |
| `fm-leaderboard.jsx` | Screen 03: Leaderboard + sortable table |
| `fm-leagues.jsx` | Screens 04 & 05: Private Leagues list + League Detail |
| `fm-admin.jsx` | Screen 06: Admin match results table |
| `fm-app.jsx` | Showcase shell — renders all 6 screens with section labels |
