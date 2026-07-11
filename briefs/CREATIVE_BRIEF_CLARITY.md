# CREATIVE BRIEF — CLARITY
**WDS-SGM Product Brief v1.0 · 2026-05-15**

---

## Product DNA
- **What:** Whetū Digital's flagship business intelligence dashboard — first client-facing SaaS product
- **Who:** NZ SMB owners — non-technical, need clarity not complexity
- **Feels like:** The future of business dashboards — aurora-soft, intelligent, premium NZ design

---

## Motion Personality
| Dimension | Value |
|---|---|
| Speed | **Smooth** — 260–300ms transitions. Elegant, never jarring. |
| Character | **Sophisticated + Welcoming** — premium but approachable |
| Energy Level | **7/10** — elevated but not overwhelming |
| Signature Move | Violet aurora unfolds → CLARITY assembles from particles → data reveals |
| Rest State | Deep violet aurora breathes softly, cards glow at edges |

---

## Colour Ownership
| Token | Value | Usage |
|---|---|---|
| `--accent` | `#7B61FF` | Whetū violet — brand anchor |
| `--accent-light` | `#A78BFA` | Hover, secondary highlights |
| `--pink` | `#C084FC` | Complementary accent |
| `--green` | `#00FFB3` | Positive metrics, success |
| `--bg` | `#05050F` | Whetū standard black |

This IS the Whetū signature colour — no other product uses `#7B61FF` as primary.

---

## Cinematic Intro Config
```js
WhetuIntro({
  word:     'CLARITY',
  accent:   '#7B61FF',
  bg:       '#05050F',
  subtitle: 'BUSINESS INTELLIGENCE',
  rings: [
    { pct:0.32, color:'#7B61FF', glow:'rgba(123,97,255,',  track:'rgba(123,97,255,0.09)' },
    { pct:0.22, color:'#C084FC', glow:'rgba(192,132,252,', track:'rgba(192,132,252,0.07)' },
    { pct:0.13, color:'#00FFB3', glow:'rgba(0,255,179,',   track:'rgba(0,255,179,0.06)'  }
  ],
  onEnter: enterDashboard
});
```

---

## Key Animated Moments
1. **KPI tiles** — stagger entrance 100ms, count-up to values
2. **Chart reveal** — ApexCharts draws with 1s animation from left
3. **Data table rows** — fade in with 60ms stagger
4. **Metric increase** — violet pulse on positive delta
5. **PIN gate** — aurora intensifies as digits entered
6. **Section transitions** — View Transition API (Tab navigation if multi-tab)

---

## WDS-SGM Score Target: 9.2+
This is the product that proves the SGMDS system. Ship at 9.2 or above only.
