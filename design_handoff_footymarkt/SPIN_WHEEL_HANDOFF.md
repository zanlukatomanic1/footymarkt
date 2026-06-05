# Handoff: FootyMarkt — Daily Spin Wheel

## Overview
A daily reward spin wheel for FootyMarkt. Users spin once per day to win bonus points (50–500). The wheel uses a Canvas-based renderer with a wooden ring frame, 18 glowing gold bulbs, 8 alternating red/cream segments, a smooth ease-out spin animation, and a result overlay card.

## About the Design File
`spin-wheel.html` is a **high-fidelity self-contained HTML prototype** — design reference only, not production code. Recreate it in your app's stack (React, React Native, Next.js, Flutter, etc.) using its existing component patterns. The Canvas approach works well on web; on React Native use `react-native-canvas` or a library like `react-native-fortune-wheel`.

---

## Fidelity
**High-fidelity.** All colors, dimensions, easing curves, animation timings, and copy are final. Match them as closely as your target platform allows.

---

## Component: `<SpinWheel>`

### Props / Config
```typescript
interface SpinSegment {
  label: string       // display value, e.g. "500"
  points: number      // numeric value awarded on win
  fill: string        // segment background color
  text: string        // label text color
}

interface SpinWheelProps {
  segments: SpinSegment[]
  onResult: (segment: SpinSegment) => void   // called after spin settles
  disabled?: boolean                          // e.g. already spun today
  size?: number                               // canvas size in px, default 520
}
```

### Current Segments (8 total, 45° each)
```typescript
const DAILY_SPIN_SEGMENTS: SpinSegment[] = [
  { label: '500', points: 500, fill: '#C91920', text: '#FFFFFF' },
  { label: '100', points: 100, fill: '#F3ECE0', text: '#B81218' },
  { label: '200', points: 200, fill: '#C91920', text: '#FFFFFF' },
  { label: '50',  points: 50,  fill: '#F3ECE0', text: '#B81218' },
  { label: '300', points: 300, fill: '#C91920', text: '#FFFFFF' },
  { label: '100', points: 100, fill: '#F3ECE0', text: '#B81218' },
  { label: '50',  points: 50,  fill: '#C91920', text: '#FFFFFF' },
  { label: '100', points: 100, fill: '#F3ECE0', text: '#B81218' },
];
```

---

## Canvas Geometry
All values assume a 520×520 canvas (`cx = cy = 260`):

| Constant    | Value (px) | Purpose                          |
|-------------|-----------|----------------------------------|
| `OUTER_R`   | 248       | Outer edge of wooden ring        |
| `INNER_R`   | 196       | Inner edge of ring / segment rim |
| `HUB_R`     | 50        | Centre wood hub radius           |
| `BULB_POS`  | 227       | Radial position of bulb centres  |
| `BULB_SZ`   | 9.5       | Bulb circle radius               |
| `N_BULBS`   | 18        | Number of bulbs                  |
| `N_SEGS`    | 8         | Segments                         |
| `SLICE`     | 45°       | Degrees per segment              |

Scale all values proportionally if changing the canvas size.

---

## Drawing Pipeline
Each frame calls these in order:

```
clearRect()
  → drawWoodRing()      static, behind everything
  → drawSegments()      clipped to INNER_R, rotates with `angle`
  → drawHub()           static wood centre cap
  → drawBulbs()         static position, brightness animated during spin
  → drawPointer()       static red triangle at 12 o'clock
```

### 1 · Wood Ring (`drawWoodRing`)
- Fill a circle at `OUTER_R` with a radial gradient:
  ```
  center offset (-55,-55), inner stop r=14
  0%   #D49050
  18%  #C07838
  45%  #9A4E18
  72%  #7A3A10
  88%  #9A4E18
  100% #6B3210
  ```
- Clip to circle, draw 16 diagonal lines across for grain effect:
  `rgba(0,0,0, 0.04–0.09)`, lineWidth 1.2–2
- Add a top-left radial highlight: `rgba(255,210,110,0.28)` → transparent
- Outer stroke: `#2E1406`, lineWidth 6
- Inner stroke at `INNER_R`: `rgba(30,10,0,0.45)`, lineWidth 2.5

### 2 · Segments (`drawSegments`)
- **Clip** the canvas to a circle of radius `INNER_R - 1` before drawing
- `ctx.translate(cx, cy)` then `ctx.rotate(angle)` — all segments rotate together
- Segment `i` spans angles: `startA = -π/2 + i * SLICE`, `endA = startA + SLICE`
- Draw pie slice: `moveTo(0,0)` → `arc(0,0, INNER_R, startA, endA)` → `closePath`
- Stroke dividers: `rgba(0,0,0,0.22)`, lineWidth 2
- Cream segments get a subtle radial shimmer: `rgba(255,255,255,0.22)` → transparent
- **Text position:** `radius = INNER_R * 0.62` (≈ 122px) from centre along `midAngle`
- **Text rotation:** `ctx.rotate(midAngle + π/2)` — reads radially outward
- Font: `700 29px 'Oswald', 'Arial Black', sans-serif`
- Text shadow: `rgba(0,0,0,0.45)` blur 4, offset (1.5, 1.5)

### 3 · Hub (`drawHub`)
- Radial gradient circle at `HUB_R`:
  ```
  0%   #D4904A
  30%  #A05520
  65%  #7A3A10
  100% #521E06
  ```
- 7 grain lines clipped inside
- Highlight: top-left radial `rgba(255,210,120,0.42)` → transparent
- Border: `#2E1406`, lineWidth 3.5
- Inner ring: `rgba(255,200,100,0.18)`, lineWidth 1.5, radius `HUB_R - 11`

### 4 · Bulbs (`drawBulbs`)
- 18 bulbs evenly spaced at `BULB_POS` radius, starting at 12 o'clock (`-π/2`)
- Each bulb has: outer glow radial gradient + body radial gradient + stroke
- **Idle:** `bright = 1.0` — all fully lit
- **Spinning:** odd/even bulbs alternate between `bright = 1.0` and `bright = 0.35`
  every 140ms (toggle `bulbTick` counter in the animation loop)
- Glow outer radius: `BULB_SZ * 2.8` ≈ 26.6px, `rgba(255,240,140,0.55 * bright)`
- Body gradient (inner highlight → warm amber → dark amber):
  ```
  0%   rgba(255,255,235, 0.92*b+0.04)  — specular highlight
  35%  rgba(255, 230*b+20, 55*b, 1)    — warm yellow
  80%  rgba(195*b+25, 128*b+8, 0, 1)   — amber
  100% rgba(130*b+18, 78*b, 0, 1)      — dark rim
  ```

### 5 · Pointer (`drawPointer`)
- Downward-pointing triangle centred at `cx`, tip at `cy - INNER_R + 6`
- Base at `cy - OUTER_R + 18`, half-width 15px
- Fill: horizontal linear gradient `#E82020 → #FF5848 → #E82020`
- Stroke: `#ffffff`, lineWidth 2.5
- Drop shadow: `rgba(0,0,0,0.5)` blur 8, offsetY 3

---

## Spin Animation

### Trigger
User taps the **SPIN button** or clicks within `HUB_R` of canvas centre.

### Parameters
```javascript
const rotations  = 6 + Math.random() * 4       // 6–10 full revolutions
const extraAngle = Math.random() * 2 * Math.PI  // random landing position
const deltaAngle = rotations * 2π + extraAngle
const duration   = 4800 + Math.random() * 1800  // 4.8–6.6 seconds
```

### Easing
```javascript
// Ease-out quartic — fast launch, smooth decelerate
function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4);
}

// In the rAF loop:
const t     = Math.min(elapsed / duration, 1);
angle       = startAngle + deltaAngle * easeOutQuart(t);
```

### Winner Detection
After animation ends, compute which segment sits under the 12 o'clock pointer:
```javascript
function getWinnerIndex(angle, N, SLICE) {
  // "unwind" the rotation back to [0, 2π), then find segment
  const norm = ((-(angle % (Math.PI * 2))) + Math.PI * 200) % (Math.PI * 2);
  return Math.floor(norm / SLICE) % N;
}
```

---

## Result Modal

Appears **350ms after spin settles** (gives wheel time to visually stop).

| Property | Value |
|---|---|
| Backdrop | `rgba(0,0,0,0.6)`, covers full screen |
| Card bg | `linear-gradient(160deg, #7B3A10, #A0521C 50%, #7B3A10)` |
| Card border | `4px solid #FFD700` |
| Card radius | 22px |
| Card shadow | `0 0 60px rgba(255,180,0,0.35), 0 20px 60px rgba(0,0,0,0.6)` |
| Entry animation | scale from `0.85` → `1.0`, spring cubic-bezier `(0.34,1.56,0.64,1)`, 350ms |
| "You Won!" label | `#FFD700`, Oswald 15px/600, ls 5px, uppercase |
| Points number | `#FFFFFF`, Oswald 88px/700 |
| "POINTS" unit | `#FFD700`, Oswald 28px/600, ls 4px |
| CTA button | gradient `#FFD93D → #FF9500`, radius 50px, Oswald 18px/700 |

---

## SPIN Button

```
background:   linear-gradient(180deg, #FFD93D 0%, #FF9500 45%, #E07000 100%)
border:       none
border-radius: 50px
padding:      14px 52px
font:         700 22px Oswald, letter-spacing 3px
color:        #FFFFFF
text-shadow:  0 2px 6px rgba(0,0,0,0.45)
box-shadow:   0 6px 0 #A05000, 0 8px 20px rgba(0,0,0,0.35),
              inset 0 1px 0 rgba(255,255,255,0.45)
```

- **Hover:** `translateY(-2px)`, shadow bottom increased to 8px
- **Active (press):** `translateY(3px)`, shadow bottom reduced to 2px
- **Disabled:** `opacity: 0.55`, `cursor: not-allowed`
- Disable during spin; re-enable after result is shown

---

## State Machine

```
IDLE
  ↓ user taps SPIN (not disabled)
SPINNING
  → disable SPIN button
  → start rAF loop, flash bulbs every 140ms
  ↓ easing reaches t=1
SETTLING
  → stop rAF, reset bulbTick
  → compute winner
  ↓ 350ms delay
RESULT_SHOWN
  → show modal with winner points
  ↓ user taps "CLAIM REWARD"
IDLE (or DISABLED if daily limit reached)
```

**Daily limit:** Track last spin timestamp server-side. Pass `disabled={alreadySpunToday}` to disable the button and show a "Come back tomorrow" message.

---

## Typography

```
Font family:  'Oswald' (Google Fonts, weights 600/700)
              fallback: 'Arial Black', Arial, sans-serif
Import:       https://fonts.googleapis.com/css2?family=Oswald:wght@600;700
```

---

## Integration Notes

### Web (React)
```tsx
// SpinWheel.tsx
import { useEffect, useRef } from 'react';

export function SpinWheel({ segments, onResult, disabled }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Port the draw* functions from spin-wheel.html into a class or hooks
  // Use useEffect to draw initial frame
  // Expose a spin() function via useImperativeHandle or a ref
}
```

### React Native
Use `react-native-fortune-wheel` or `expo-canvas` as the rendering base, then apply the same segment data, colors, and easing curve. The wooden ring texture can be an asset image overlay instead of Canvas gradients.

### Recommended libraries
| Platform | Library |
|---|---|
| Web/React | Pure Canvas (port directly from design file) |
| React Native | `react-native-fortune-wheel` + custom styles |
| Flutter | `fortune_wheel` package |

---

## Files

| File | Purpose |
|---|---|
| `spin-wheel.html` | Complete self-contained prototype — open in browser to see live |
| `SPIN_WHEEL_HANDOFF.md` | This document |
