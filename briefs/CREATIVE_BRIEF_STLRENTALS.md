# CREATIVE BRIEF — STLRENTALS
**WDS-SGM Product Brief v1.0 · 2026-05-15**

---

## Product DNA
- **What:** Property management dashboard for Sachind Lal (Deep's father) — NZ rental portfolio tracking
- **Who:** Sachind Lal, property investor — needs clean, trustworthy, professional dashboard
- **Feels like:** A trusted accountant's office reimagined as a premium digital product

---

## Motion Personality
| Dimension | Value |
|---|---|
| Speed | **Moderate** — 250–300ms transitions. Professional, never rushed. |
| Character | **Trustworthy + Clean** — clarity over flair |
| Energy Level | **6/10** — calm professionalism, highlights important numbers |
| Signature Move | Steady panel entries, financial count-ups, property card stagger |
| Rest State | Subtle blue-green aurora, very gentle parallax |

---

## Colour Ownership
| Token | Value | Usage |
|---|---|---|
| `--accent` | `#2196F3` | Trust blue — primary brand |
| `--green` | `#4CAF50` | Positive cashflow, paid rent |
| `--amber` | `#FF9800` | Overdue, pending |
| `--red` | `#F44336` | Negative cashflow, vacancies |
| `--bg` | `#050810` | Deep navy background |

---

## Cinematic Intro Config
```js
WhetuIntro({
  word:     'RENTALS',
  accent:   '#2196F3',
  bg:       '#050810',
  subtitle: 'PROPERTY PORTFOLIO',
  rings: [
    { pct:0.32, color:'#2196F3', glow:'rgba(33,150,243,',  track:'rgba(33,150,243,0.09)' },
    { pct:0.22, color:'#4CAF50', glow:'rgba(76,175,80,',   track:'rgba(76,175,80,0.07)'  },
    { pct:0.13, color:'#FF9800', glow:'rgba(255,152,0,',   track:'rgba(255,152,0,0.06)'  }
  ],
  onEnter: enterDashboard
});
```

---

## Key Animated Moments
1. **Total income** — count-up on load (1400ms), NZD format
2. **Property card** — lift on hover, cashflow badge color-transitions
3. **Expenditure entry** — new row slides in from bottom (200ms)
4. **Overdue rent** — amber pulse on property card until resolved
5. **11 panels** — staggered entrance on app load (100ms delay between panels)

---

## WDS-SGM Score Target: 8.5+
Current benchmark: 4.0/10 (scored 2026-05-11). Priority build when Deep commands STLRentals v2.
