# Handoff: FootyMarkt — Light Mode

## Overview
A complete light mode theme for the FootyMarkt WC 2026 prediction market app. This covers all 6 screens: Home Feed, Match Prediction, Leaderboard, Private Leagues, League Detail, and Admin Panel. The light mode uses a **dark sidebar / light main content** split so the existing logo (white + green on dark) works without modification.

## About the Design Files
The files in this bundle are **HTML design references** — prototypes showing the intended look and behaviour, not production code to ship directly. Recreate them in your existing codebase (React, React Native, Next.js, Flutter, etc.) using its established component patterns and libraries.

## Fidelity
**High-fidelity.** All colours, typography, spacing, shadow values, hover states, and interactions are final. Match them precisely.

---

## Design Tokens

### Colour Palette

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#F2F5FA` | Main content area background |
| `--card` | `#FFFFFF` | Card / panel background |
| `--sidebar` | `#161616` | Sidebar (stays dark for logo) |
| `--sidebar-border` | `#252525` | Sidebar right border |
| `--topbar` | `#FFFFFF` | Top bar background |
| `--border` | `#E3E8F0` | Standard borders |
| `--border-sub` | `#EDF0F6` | Subtle dividers / alternating rows |
| `--accent` | `#5A9600` | Green — text, active states, buttons |
| `--accent-vivid` | `#74C200` | Green — icons, decorative dots, bulbs |
| `--accent-bg` | `rgba(90,150,0,0.08)` | Green tinted backgrounds |
| `--accent-border` | `rgba(90,150,0,0.22)` | Green tinted borders |
| `--blue` | `#3560D8` | Away team / blue accents |
| `--text` | `#0F1624` | Primary text |
| `--text-2` | `#5A6478` | Secondary text |
| `--text-3` | `#96A0B0` | Tertiary / placeholder text |
| `--text-3-sub` | `#C8D0DC` | Very subtle text |
| `--gold` | `#B8860A` | 1st place medal |
| `--silver` | `#787878` | 2nd place medal |
| `--bronze` | `#966220` | 3rd place medal |

### Typography

| Family | Usage | Import |
|---|---|---|
| `DM Sans` 400/500/600/700 | Body, UI, buttons | Google Fonts |
| `DM Mono` 400/500 | Numbers, codes, labels, tags | Google Fonts |
| `Syne` 700/800 | Display headings, team names | Google Fonts |

```
https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&family=Syne:wght@700;800
```

### Spacing & Shape

| Property | Value |
|---|---|
| Card border-radius | `12px` (standard), `14px` (hero cards) |
| Button border-radius | `6px` (small), `8px` (standard), `50px` (pill) |
| Card shadow (rest) | `0 1px 3px rgba(15,22,36,0.04)` |
| Card shadow (hover) | `0 2px 12px rgba(15,22,36,0.07)` |
| Hero card shadow | `0 1px 4px rgba(15,22,36,0.05)` |
| Modal shadow | `0 12px 40px rgba(15,22,36,0.16)` |

---

## Layout Shell

### Sidebar (always dark)
```
width:           220px (fixed, never collapses)
background:      #161616
border-right:    1px solid #252525
padding:         20px 0 14px
```

**Logo** — use `logo.png` at `128px` wide in the sidebar header. The PNG has white + green text on transparent background; it requires the dark sidebar to be readable.

**Nav items:**
```
padding:         9px 11px
border-radius:   8px
font-size:       13.5px
font-weight:     400 (inactive) / 600 (active)
color (active):  #74C200
color (inactive):#4A4A4A
bg (active):     rgba(116,194,0,0.12)
active dot:      5×5px circle, #74C200, margin-left: auto
```

**User row (bottom):**
```
Avatar:  26×26px circle, gradient linear(135deg, #74C200, #3560D8), 'Y' in white, 10.5px 700
Name:    12px 600 #AAAAAA
Coins:   10.5px DM Mono #3A3A3A
```

### Top Bar
```
height:          56px
background:      #FFFFFF
border-bottom:   1px solid #E3E8F0
padding:         0 22px
```

**Coins badge:**
```
background:  #F2F5FA
border:      1px solid #E3E8F0
border-radius: 8px
padding:     5px 12px
coin icon:   #5A9600
value:       12.5px DM Mono 600 #5A9600
separator:   #C8D0DC
@handle:     11.5px #96A0B0
```

**Bell button:**
```
32×32px, background #F2F5FA, border 1px solid #E3E8F0, border-radius 8px
notification dot: 6×6px #74C200, border 1.5px solid #FFFFFF
```

### Main Content Area
```
background:   #F2F5FA
padding:      22px 24px
overflow-y:   auto
```

---

## Screens

### 01 · Home Feed

**Stats strip** — 4 equal cards in a row:
```
Card: background #FFFFFF, border 1px solid #E3E8F0, border-radius 10px, padding 12px 14px
Label: 10px DM Mono uppercase ls 0.09em #96A0B0, margin-bottom 5px
Value: 22px DM Mono 700, tabular-nums, line-height 1
  - Coins value: #5A9600 (accent)
  - Others: #0F1624 (text)
Sub:   10.5px DM Mono #96A0B0, margin-top 3px
```

**Filter bar** — pill buttons:
```
Active:   background #5A9600, color #FFFFFF, border 1px solid #5A9600
Inactive: background transparent, color #5A6478, border 1px solid #E3E8F0
padding:  5px 13px, border-radius 6px, font-size 12px
```

**Dividers:**
```
Label: 10.5px DM Mono uppercase ls 0.1em #96A0B0
Line:  1px solid #E3E8F0
margin: 20px 0 14px
```

**Match cards** — 3-column grid, gap 12px:
```
Rest:  background #FFFFFF, border 1px solid #E3E8F0, shadow 0 1px 3px rgba(15,22,36,0.04)
Hover: background #FAFBFD, border 1px solid #D4DCE8, shadow 0 2px 12px rgba(15,22,36,0.07)
border-radius: 12px, padding: 18px 18px 16px
```

Match card internal:
```
Competition / kickoff: 10.5px DM Mono #96A0B0
Flag: 22px emoji
Team name: 13px 600 #0F1624
Team code: 9.5px DM Mono #96A0B0
VS label: 10px DM Mono #C8D0DC
```

**Sentiment bar:**
```
Track: height 5px, border-radius 999px, background #EDF0F6
Home (green): rgba(90,150,0,0.7)
Draw (gray):  #C8D0DC
Away (blue):  rgba(53,96,216,0.65)
Labels: 12.5px DM Mono 600, tabular-nums
  - Home: #5A9600
  - Draw: #96A0B0
  - Away: #3560D8
Sub labels: 9px uppercase ls 0.08em #96A0B0
```

**Prediction buttons (unpredicted):**
```
border: 1px solid {color}38
color: accent / text3 / blue respectively
padding: 4px 9px, border-radius 6px, font-size 10px DM Mono 600
```

**Predicted badge:**
```
background: {pickColor}12, border: 1px solid {pickColor}30
padding: 4px 10px, border-radius 6px
font: 10.5px DM Mono 700
```

---

### 02 · Match Prediction

**Hero card:**
```
background: #FFFFFF, border 1px solid #E3E8F0, border-radius 14px
padding: 28px 32px, shadow 0 1px 4px rgba(15,22,36,0.05)
Team name: Syne 24px 800 #0F1624
Team code: 12px DM Mono #96A0B0
```

**Prediction cards** — 3-column flex, gap 14px:
```
Rest:     background #FFFFFF, border 1.5px solid #E3E8F0
Hover:    background #FAFBFD
Selected: background {opt.bg}, border 1.5px solid {opt.borderColor}
          shadow: 0 0 24px {color}18, 0 2px 12px rgba(15,22,36,0.08)
Dimmed:   opacity 0.35
border-radius: 14px, padding: 28px 24px
```

Option colours (light mode):
```
Home Win: #5A9600 / rgba(90,150,0,0.06) border rgba(90,150,0,0.35)
Draw:     #7A8898 / rgba(122,136,152,0.04) border rgba(122,136,152,0.28)
Away Win: #3560D8 / rgba(53,96,216,0.05) border rgba(53,96,216,0.35)
```

Large % number: 46px DM Mono 500, colour = option colour when selected else `#0F1624`

**Locked-in banner:**
```
background: rgba(90,150,0,0.08), border: 1px solid rgba(90,150,0,0.22)
border-radius: 10px, padding: 10px 14px
icon + text: #5A9600 13px 600
```

**Recent activity chips:**
```
background: #FFFFFF, border: 1px solid #E3E8F0, border-radius: 20px, padding: 5px 10px
username: 11px #5A6478
pick label: 10px DM Mono 700 {pickColor}
time: 9.5px DM Mono #96A0B0
```

---

### 03 · Leaderboard

**Period tabs** — same pill button pattern as filters above.

**Table container:**
```
background: #FFFFFF, border: 1px solid #E3E8F0, border-radius: 12px
shadow: 0 1px 4px rgba(15,22,36,0.05)
```

**Table header row:**
```
background: #F2F5FA, border-bottom: 1px solid #E3E8F0
font: 10.5px DM Mono uppercase ls 0.1em
color: #96A0B0 (default), #5A9600 (sorted column)
```

**Data rows:**
```
border-bottom: 1px solid #EDF0F6
Top 3: background from MEDAL_BG map (gold/silver/bronze tints)
Me row: background rgba(90,150,0,0.08)
```

**Rank column:**
- Top 3: emoji medal (🥇🥈🥉)
- Others: `#rank` 12px DM Mono #96A0B0
- Me: `#rank` in #5A9600

**Avatar circles:**
- Me: 28×28 gradient `linear(135deg, #74C200, #3560D8)`, white text
- Top 3: gradient from medal colour tints
- Others: `#EDF0F6` bg, `#96A0B0` text

**Username:**
- Me: 13px 600 `#5A9600`
- Top 3: 13px 500 medal colour
- Others: 13px 400 `#0F1624`

**Win rate colour:**
- ≥70%: `#5A9600`
- ≥60%: `#7AAA30`
- <60%: `#96A0B0`

**Ellipsis separator:**
```
border-top/bottom: 1px solid #EDF0F6
text: 10.5px DM Mono #C8D0DC centred
flanked by 1px solid #E3E8F0 lines
```

---

### 04 · Private Leagues

**Create League button:**
```
background: #5A9600, color: #FFFFFF, border: none
padding: 9px 16px, border-radius: 8px, font: 13px 600
```

**League cards** — 3-column grid:
```
Rest:  background #FFFFFF, border 1px solid #E3E8F0, shadow 0 1px 3px rgba(15,22,36,0.04)
Hover: background #FAFBFD, border 1px solid #D4DCE8, shadow 0 2px 12px rgba(15,22,36,0.08)
border-radius: 12px, padding: 20px
```

Rank number colour: medal colour (top 3) else `#96A0B0`

**Create League modal:**
```
Backdrop: rgba(15,22,36,0.45) + backdrop-filter blur(4px)
Card: #FFFFFF, border 1px solid #E3E8F0, border-radius 16px, shadow 0 12px 40px rgba(15,22,36,0.16)
Input: background #F2F5FA, border 1px solid #E3E8F0
Submit (active): background #5A9600, color #FFFFFF
Submit (inactive): background #EDF0F6, color #C8D0DC
Invite code: DM Mono 16px 600 #5A9600
```

---

### 05 · League Detail

**League header card** — same hero card style as match page.

**Invite code block:**
```
background: #F2F5FA, border: 1px solid #E3E8F0, border-radius: 10px
code: 15px DM Mono 600 #5A9600
Copy button (rest): background #FFFFFF, border 1px solid #E3E8F0, color #96A0B0
Copy button (copied): background rgba(90,150,0,0.08), border rgba(90,150,0,0.22), color #5A9600
```

**Nested table / members panel** — same card style as leaderboard.

---

### 06 · Admin Panel

**Stats strip** — same 4-card pattern, colours:
```
Total:    #0F1624
Settled:  #5A9600
Pending:  #5A6478
Affected: #3560D8
```

**Table rows:**
```
Hover: background #F2F5FA
Saved: background rgba(90,150,0,0.08)
"vs" badge: background #F2F5FA, border 1px solid #E3E8F0, 10px DM Mono #96A0B0
```

**Result badges:**
```
Home Win: color #5A9600, bg rgba(90,150,0,0.09), border rgba(90,150,0,0.22)
Draw:     color #7A8898, bg rgba(122,136,152,0.09), border rgba(122,136,152,0.22)
Away Win: color #3560D8, bg rgba(53,96,216,0.09), border rgba(53,96,216,0.22)
```

**Dropdown (select):**
```
background: #FFFFFF, border: 1px solid #E3E8F0
color: option colour when selected, #96A0B0 when empty
appearance: none (custom arrow needed)
```

**Save button:**
```
Active:   background #5A9600, color #FFFFFF
Inactive: background #EDF0F6, color #C8D0DC
Saved:    background rgba(90,150,0,0.08), border rgba(90,150,0,0.22), text #5A9600
```

---

## Interactions

| Trigger | Behaviour |
|---|---|
| Match card hover | bg `#FAFBFD`, border `#D4DCE8`, shadow increase |
| Prediction card click | Toggle selected state; dimmed cards opacity 0.35; locked banner appears |
| Prediction card re-click | Deselects (toggle) |
| Leaderboard column header click | Sort by that column; second click reverses order |
| Create League button | Modal overlay with blur backdrop |
| Invite code Copy button | 2s "Copied!" state then revert |
| Save Result button | 600ms loading state → "Saved" confirmation badge |
| Join League toggle | Inline code input slides in next to button |

---

## Assets

| File | Usage |
|---|---|
| `uploads/logo.png` | Sidebar logo — 128px wide on `#161616` bg |
| `uploads/logo.ico` | Favicon |

---

## Files in This Bundle

| File | Purpose |
|---|---|
| `footymarkt-light.html` | Live reference — open in browser |
| `fm-shared-light.jsx` | Logo, sidebar, topbar, page shell, sentiment bar, tags, dividers |
| `fm-home-light.jsx` | Home feed + match cards |
| `fm-match-light.jsx` | Match prediction + prediction cards |
| `fm-leaderboard-light.jsx` | Leaderboard table |
| `fm-leagues-light.jsx` | Leagues list, league detail, create modal |
| `fm-admin-light.jsx` | Admin match results table |
| `fm-app-light.jsx` | Showcase entry (wraps all 6 screens) |

---

## Integration Notes

### Implementing the theme switch

If you have an existing dark mode and want to add light mode as a toggle:

```tsx
// 1. Define both token sets
const themes = {
  dark:  { bg: '#0f0f0f', card: '#141414', accent: '#00ff87', ... },
  light: { bg: '#F2F5FA', card: '#FFFFFF', accent: '#5A9600', ... },
};

// 2. Apply via CSS custom properties or a React context
// 3. Sidebar bg is always #161616 regardless of theme
```

### Preserving the logo

The `logo.png` has white text — it only works on dark surfaces. Keep the sidebar dark in both themes, or provide an alternate logo asset with dark text for a fully light sidebar variant.
