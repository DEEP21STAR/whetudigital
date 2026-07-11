# WHETU SUPER GOD MODE DESIGN SYSTEM (SGMDS)
**Version 2.0 · 2026-05-15 · Supersedes v1 Creative Standards**
_One source of truth for every Whetū Digital build going forward._

---

## WHAT THIS IS

The SGMDS is Whetū Digital's competitive moat — a repeatable, scoreable, battle-tested design system that turns functional dashboards into cinematic experiences. Every product built on SGMDS carries the same DNA: grain texture, parallax depth, particle-assembly cinematic intro, colour ownership, motion hierarchy. Clients can feel it before they name it.

**This document governs:**
- How every Whetū Digital product looks and moves
- How products are scored (WDS-SGM Score /10)
- What earns the SGMDS SEAL
- Colour ownership per product (no two products share a primary)
- Creative brief format for every new product
- File locations, CDN stack, and integration checklist

---

## SCORING SYSTEM — WDS-SGM SCORE /10

Every Whetū Digital product gets scored before delivery. A product ships at target score or above. No exceptions.

### 8 Dimensions (1.25pts each = 10.0 total)

| # | Dimension | What is measured |
|---|---|---|
| 1 | **Grain Texture** | Film grain via SVG feTurbulence — visible, atmospheric, correct opacity |
| 2 | **Parallax Depth** | 3-layer mouse-tracking aurora — smooth, product colour, correct layer separation |
| 3 | **Cinematic Intro** | WhetuIntro particle assembly — word blazes, correct accent, subtitle, phase timing |
| 4 | **Colour Ownership** | Product accent colour consistent throughout — no bleed from other products |
| 5 | **Motion Hierarchy** | Entrance stagger, count-ups, hover states — snappy and purposeful, matches brief energy level |
| 6 | **Typography** | Bebas Neue for hero numbers/headings, Inter for body — right weight hierarchy |
| 7 | **Aurora Rest State** | Idle aurora breathing, correct product glow — not static, not distracting |
| 8 | **Whetū Footer** | Footer present, SGMDS badge, correct version stamp, copyright |

### Score Thresholds

| Score | Meaning |
|---|---|
| **9.5–10.0** | MASTER SEAL — this is a Whetū signature product |
| **9.0–9.4** | ELITE SEAL — ships to clients, live on portfolio |
| **8.5–8.9** | STANDARD SEAL — ships, flagged for one polish pass |
| **8.0–8.4** | PROVISIONAL — ships to internal/personal use, not client-facing |
| **< 8.0** | BLOCKED — do not ship. Identify missing dimensions and fix. |

### SGMDS SEAL HTML Comment (required in every file)
```html
<!-- WDS-SGM SCORE: X.X/10 · SEAL: [PRODUCT]-SGMDS-YYYY-MM · Target X.X+ -->
```

---

## COMPONENT LIBRARY

### 1. Grain Texture — `C:\WHETU\lib\whetu-grain.css`

Film grain via SVG `feTurbulence` pseudo-element overlay. Zero JS. Pure CSS.

**Classes:**
| Class | Opacity | Use |
|---|---|---|
| `.whetu-grain` | 0.040 | Standard — most products |
| `.whetu-grain-light` | 0.022 | Subtle — business/professional products (STLRentals) |
| `.whetu-grain-heavy` | 0.065 | Aggressive — emergency/high-drama products (LIFELINE) |

**Apply to:** `<body>` or the outermost container div.

**Inline version (self-contained files):**
```css
.wg::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.038;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23g)' opacity='1'/%3E%3C/svg%3E");
  mix-blend-mode: overlay;
}
```

---

### 2. Parallax Depth — `C:\WHETU\lib\whetu-depth.css`

3-layer mouse-tracking aurora. CSS vars override per product via `data-product` attribute.

**Structure:**
```html
<div class="whetu-parallax-bg" data-product="arcline">
  <div class="whetu-aurora-l1"></div>
  <div class="whetu-aurora-l2"></div>
  <div class="whetu-aurora-l3"></div>
</div>
```

**CSS var overrides by product** (set via `data-product` attribute on `.whetu-parallax-bg`):
| Product | `--wa1` | `--wa2` | `--wa3` |
|---|---|---|---|
| `mimi` | `rgba(255,0,110,.18)` | `rgba(255,200,50,.08)` | `rgba(255,80,180,.06)` |
| `arcline` | `rgba(0,212,255,.18)` | `rgba(0,255,200,.08)` | `rgba(0,150,255,.06)` |
| `vigil` | `rgba(0,230,118,.16)` | `rgba(0,200,100,.07)` | `rgba(50,255,150,.05)` |
| `clarity` | `rgba(123,97,255,.18)` | `rgba(192,132,252,.08)` | `rgba(0,255,179,.06)` |
| `bullrun` | `rgba(255,179,0,.18)` | `rgba(255,140,0,.08)` | `rgba(255,230,0,.05)` |
| `lifeline` | `rgba(255,23,68,.18)` | `rgba(255,179,0,.08)` | `rgba(0,188,212,.06)` |
| `eventspace` | `rgba(195,11,130,.18)` | `rgba(255,107,53,.08)` | `rgba(255,215,0,.06)` |
| `stlrentals` | `rgba(33,150,243,.16)` | `rgba(76,175,80,.07)` | `rgba(255,152,0,.05)` |

**Layer depths:** L1 = 22px, L2 = 11px, L3 = 5px (CSS `translate` via JS mouse tracking).

**Mouse JS one-liner:**
```js
document.addEventListener('mousemove', e => {
  const x = (e.clientX / innerWidth - .5) * 2, y = (e.clientY / innerHeight - .5) * 2;
  document.querySelectorAll('.whetu-aurora-l1').forEach(el => el.style.transform = `translate(${x*22}px,${y*22}px)`);
  document.querySelectorAll('.whetu-aurora-l2').forEach(el => el.style.transform = `translate(${x*11}px,${y*11}px)`);
  document.querySelectorAll('.whetu-aurora-l3').forEach(el => el.style.transform = `translate(${x*5}px,${y*5}px)`);
});
```

---

### 3. Cinematic Intro Engine — `C:\WHETU\lib\whetu-intro.js`

Particle-assembly cinematic intro. Exported function `WhetuIntro(cfg)`.

**Standard config pattern:**
```js
import { WhetuIntro } from '/lib/whetu-intro.js';

WhetuIntro({
  word:       'PRODUCT',          // all caps, displayed word
  accent:     '#XXXXXX',          // product primary colour (hex)
  bg:         '#XXXXXX',          // product background (deep dark)
  subtitle:   'PRODUCT TAGLINE',  // appears below word
  enterText:  'ENTER DASHBOARD',  // CTA button text (optional)
  ptclCount:  220,                // particle count (default 220)
  phases: {
    auto: 12000,                  // ms before auto-enter (8000 for emergency products)
  },
  rings: [                        // 3 rings: primary, secondary, tertiary
    { pct:0.32, color:'#PRIMARY',   glow:'rgba(R,G,B,',  track:'rgba(R,G,B,0.09)'  },
    { pct:0.22, color:'#SECONDARY', glow:'rgba(R,G,B,',  track:'rgba(R,G,B,0.07)'  },
    { pct:0.13, color:'#TERTIARY',  glow:'rgba(R,G,B,',  track:'rgba(R,G,B,0.06)'  }
  ],
  onEnter: enterDashboard         // callback to show main app
});
```

**Phase timeline** (internal — do not change):
| Phase key | Time (ms) | What happens |
|---|---|---|
| `ringStart` | 350 | Shockwave rings begin drawing |
| `ring1done` | 1900 | Outer ring complete |
| `ring3done` | 2600 | All 3 rings drawn |
| `burst` | 3050 | Particles burst outward |
| `collapse` | 3550 | Particles reverse toward word pixel map |
| `impact` | 5350 | Particles arrive at word — screen flash |
| `glow` | 5950 | Word blazes with glow |
| `enter` | 6750 | Enter button fades in |
| `auto` | 12000 | Auto-advance (8000 for emergency) |

---

### 4. Dashboard Template — `C:\WHETU\templates\template_dashboard.html`

Complete GOD MODE starter at 7.5/10 out-of-the-box. Includes:
- PIN gate (iOS-safe numpad, 4-dot display)
- Parallax background (whetu-depth structure)
- Header with logo + title
- 4 hero stat tiles with count-up
- 2-column panel layout
- Data table
- Whetū footer with SGMDS badge
- Mouse parallax JS
- Staggered entrance animation
- GSAP 3.12.5 + Anime.js 4.0.0 CDN

**To use:** Copy template → Replace all `<!-- CUSTOMIZE: -->` markers → Apply product accent colour → Add WhetuIntro config → Adjust score.

---

## COLOUR OWNERSHIP

No two active Whetū Digital products share a primary accent colour. This is sacred.

| Product | Accent | Hex | Background |
|---|---|---|---|
| **CLARITY** | Whetū Violet | `#7B61FF` | `#05050F` |
| **ARCLINE** | Electric Blue | `#00D4FF` | `#040810` |
| **VIGIL** | Sentinel Green | `#00E676` | `#030A05` |
| **MIMI** | Hot Pink | `#FF006E` | `#08000F` |
| **BULLRUN** | Amber Gold | `#FFB300` | `#0A0800` |
| **LIFELINE** | Emergency Red | `#FF1744` | `#0A0305` |
| **EVENTSPACE** | Event Magenta | `#C30B82` | `#08030A` |
| **STLRENTALS** | Trust Blue | `#2196F3` | `#050810` |
| **SALINA** | *(TBD — warm ceremonial)* | TBD | TBD |
| **VOYAGER** | *(sunset teal)* | `#00BCD4` | `#050A10` |

**Rule:** When adding a new product, check this table first. If a colour is taken, shift hue by at least 30°.

---

## PRODUCT REGISTRY

All active products with their current SGMDS status:

| Product | Path | Score | Seal | Brief | Status |
|---|---|---|---|---|---|
| ARCLINE | `C:\ARCLINE\index.html` | 8.0 | PROVISIONAL | `CREATIVE_BRIEF_ARCLINE.md` | Retrofit 2026-05-15 |
| LIFELINE | `C:\LIFELINE\` | ~8.5 | STANDARD | `CREATIVE_BRIEF_LIFELINE.md` | Built 2026-05-14, 46/46 tests |
| MIMI | `C:\MIMI\index.html` | ~8.5 | STANDARD | `CREATIVE_BRIEF_MIMI.md` | Particle intro added 2026-05-16b |
| EVENTSPACE | `C:\EVENTSPACE\index.html` | ~7.5 | PROVISIONAL | `CREATIVE_BRIEF_EVENTSPACE.md` | Retrofit pending |
| CLARITY | `C:\CLARITY\` | TBD | — | `CREATIVE_BRIEF_CLARITY.md` | Target 9.2+ |
| VIGIL | `C:\VIGIL\` | ~7.5 | — | `CREATIVE_BRIEF_VIGIL.md` | Backend 9/10, frontend retrofit pending |
| BULLRUN | `C:\BULLRUN\` | TBD | — | `CREATIVE_BRIEF_BULLRUN.md` | — |
| STLRENTALS | `C:\STLRENTALS\expenditure.html` | 4.0 | — | `CREATIVE_BRIEF_STLRENTALS.md` | v2 awaiting command |
| SALINA | `C:\SALINA\index.html` | TBD | — | — | Built, retrofit pending |

---

## TYPOGRAPHY SYSTEM

| Usage | Font | Weight | Notes |
|---|---|---|---|
| Hero numbers, stat values | Bebas Neue | 400 (display) | Google Fonts CDN |
| Product name / title | Bebas Neue | 400 | All caps, letter-spacing |
| Body text, labels | Inter | 400 | Google Fonts CDN |
| UI labels, nav | Inter | 600 | |
| Headings | Inter | 800 | |

**Google Fonts import (always use this string):**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Bebas+Neue&display=swap" rel="stylesheet" />
```

---

## CDN STACK

Every Whetū Digital product uses this exact CDN stack. No exceptions, no version drift.

```html
<!-- Animation engines -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/4.0.0/anime.min.js"></script>
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Bebas+Neue&display=swap" rel="stylesheet" />
```

**Icons:** Inline SVG only — no icon font CDN. Keep products self-contained and offline-capable.

---

## MOTION PERSONALITY SPEC

Each product has a motion personality defined in its Creative Brief. These values govern all CSS `transition-duration` and `animation-duration`:

| Energy Level | Transition speed | Animation easing | Use for |
|---|---|---|---|
| 10/10 — Emergency | 80–120ms | cubic-bezier(.4,0,.2,1) | LIFELINE alert state |
| 8–9/10 — Snappy | 120–180ms | cubic-bezier(.4,0,.2,1) | MIMI, ARCLINE, EVENTSPACE |
| 7–8/10 — Smooth | 200–260ms | cubic-bezier(.25,.46,.45,.94) | VIGIL, BULLRUN, CLARITY |
| 6/10 — Professional | 250–300ms | ease-in-out | STLRENTALS, standard business |

**Hover lift** (standard on all cards):
```css
transform: translateY(-3px);
box-shadow: 0 8px 32px var(--accent-glow, rgba(123,97,255,.18));
```

**Stagger entrance** (standard on all panels/cards):
```js
anime({ targets: '.panel', translateY: [20, 0], opacity: [0, 1], delay: anime.stagger(80), duration: 500, easing: 'easeOutQuart' });
```

**Count-up** (standard on all stat values):
```js
function countUp(el, target, duration = 1400, prefix = '', suffix = '') {
  const start = performance.now();
  const update = ts => {
    const p = Math.min((ts - start) / duration, 1);
    el.textContent = prefix + Math.round(p * target).toLocaleString() + suffix;
    if (p < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}
```

---

## BUILD CHECKLIST — SGMDS INTEGRATION

When applying SGMDS to any product, check every item:

### Phase 1 — CSS Foundation
- [ ] `whetu-grain.css` linked (or grain CSS inlined for self-contained files)
- [ ] `whetu-depth.css` linked (or depth CSS inlined)
- [ ] `data-product` attribute set on parallax bg div
- [ ] Product accent `--accent` CSS var applied throughout
- [ ] Bebas Neue + Inter fonts loaded
- [ ] Background colour matches product brief

### Phase 2 — Motion
- [ ] Staggered panel entrances (anime.js)
- [ ] Count-up on all stat values
- [ ] Card hover lift + glow
- [ ] Mouse parallax JS wired
- [ ] CSS transitions at correct speed for energy level
- [ ] Aurora breathing pulse active

### Phase 3 — Intro
- [ ] WhetuIntro wired with correct product config
- [ ] Correct accent, bg, word, subtitle
- [ ] Correct 3-ring colours from Creative Brief
- [ ] `onEnter` callback shows dashboard
- [ ] Auto-phase timing correct (8000ms for emergency, 12000ms default)

### Phase 4 — Polish
- [ ] SGMDS SEAL HTML comment added
- [ ] Whetū footer present with score badge
- [ ] Score calculated across 8 dimensions
- [ ] Score meets target from Creative Brief
- [ ] Copyright line: `© {year} Whetū Digital · All rights reserved`

---

## CREATIVE BRIEF FORMAT

Every new product gets a brief at `C:\WHETU\briefs\CREATIVE_BRIEF_[PRODUCT].md` before build starts.

**Required sections:**
1. **Product DNA** — What / Who / Feels like
2. **Motion Personality** — Speed, Character, Energy Level, Signature Move, Rest State
3. **Colour Ownership** — Token table with hex values and usage
4. **Cinematic Intro Config** — Complete `WhetuIntro({...})` ready to paste
5. **Key Animated Moments** — 4–6 specific interaction moments
6. **WDS-SGM Score Target** — Minimum score to ship + current benchmark

---

## SGMDS AS A CLIENT DIFFERENTIATOR

This is not just internal tooling. SGMDS is the deliverable that justifies Whetū Digital's premium.

**What clients get that no other NZ studio offers:**
- A cinematic product launch moment (the intro) — not just a login page
- Colour ownership: their dashboard has an identity, not a template
- Film grain + parallax depth: feels like premium software, not a WordPress theme
- Motion hierarchy: every interaction communicates priority
- A scored, versioned product: clients can see the 8-dimension breakdown
- The SGMDS SEAL: provenance, like a hallmark on gold

**The pitch line:** "Other studios hand you a dashboard. We hand you a product launch."

**Pricing implication:** SGMDS retrofit should be a $500–$2,000 line item on any proposal. New builds on SGMDS start at $3,000.

---

## FILE LOCATIONS

```
C:\WHETU\
├── WHETU_SGMDS.md              ← this file (master document)
├── lib\
│   ├── whetu-grain.css         ← grain texture component
│   ├── whetu-depth.css         ← parallax depth component
│   └── whetu-intro.js          ← cinematic intro engine
├── templates\
│   └── template_dashboard.html ← GOD MODE starter template
└── briefs\
    ├── CREATIVE_BRIEF_ARCLINE.md
    ├── CREATIVE_BRIEF_BULLRUN.md
    ├── CREATIVE_BRIEF_CLARITY.md
    ├── CREATIVE_BRIEF_EVENTSPACE.md
    ├── CREATIVE_BRIEF_LIFELINE.md
    ├── CREATIVE_BRIEF_MIMI.md
    ├── CREATIVE_BRIEF_STLRENTALS.md
    └── CREATIVE_BRIEF_VIGIL.md
```

---

## VERSION HISTORY

| Version | Date | Author | Changes |
|---|---|---|---|
| 2.0 | 2026-05-15 | Deep + Claude Code | Full SGMDS spec — grain, depth, intro, scoring, colour ownership, briefs, template. Supersedes v1. |
| 1.0 | 2026-05 | Deep | Original Creative Standards (informal) |

---

_Whetū Digital — Future-defining digital products for Aotearoa and beyond._
_"Nothing is impossible. Vision is the way of the future."_
