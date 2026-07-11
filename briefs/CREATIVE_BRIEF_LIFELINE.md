# CREATIVE BRIEF — LIFELINE
**WDS-SGM Product Brief v1.0 · 2026-05-15**

---

## Product DNA
- **What:** T1 offline failsafe + T2 personal debug dashboard — emergency protocols, system recovery
- **Who:** Deep (personal use) — mission-critical, zero tolerance for failure
- **Feels like:** A military ops dashboard — urgent, mission-critical, life-or-death clarity

---

## Motion Personality
| Dimension | Value |
|---|---|
| Speed | **Snappy** — 120–150ms transitions. Zero hesitation. |
| Character | **Alert + Mission-Critical** — every pixel says "I will not fail" |
| Energy Level | **8/10 normal, 10/10 on alert** |
| Signature Move | Red pulse particle assembly → LIFELINE blazes — the word itself is the warning |
| Rest State | Steady teal aurora pulse, health indicators breathing calmly |

---

## Colour Ownership
| Token | Value | Usage |
|---|---|---|
| `--accent` | `#FF1744` | Emergency red — primary |
| `--teal` | `#00BCD4` | Medical/stable state colour |
| `--amber` | `#FFB300` | Warning / degraded |
| `--green` | `#00E676` | Nominal / all-clear |
| `--bg` | `#0A0305` | Deep red-tinted black |

---

## Cinematic Intro Config
```js
WhetuIntro({
  word:     'LIFELINE',
  accent:   '#FF1744',
  bg:       '#0A0305',
  subtitle: 'EMERGENCY PROTOCOL',
  phases:   { auto: 8000 },    // faster intro — this is emergency software
  rings: [
    { pct:0.32, color:'#FF1744', glow:'rgba(255,23,68,',  track:'rgba(255,23,68,0.09)'  },
    { pct:0.22, color:'#FFB300', glow:'rgba(255,179,0,',  track:'rgba(255,179,0,0.07)'  },
    { pct:0.13, color:'#00BCD4', glow:'rgba(0,188,212,',  track:'rgba(0,188,212,0.06)'  }
  ],
  onEnter: enterDashboard
});
```

---

## Key Animated Moments
1. **All-clear** — teal aurora, green dots, calm breathing pulse
2. **Warning state** — amber escalation, pulse quickens (CSS animation-duration halves)
3. **Critical state** — red flash every 3s, border strobe, alert card pops to top
4. **Recovery protocol** — progress bar fills with teal color as services restore
5. **46/46 tests** — displayed as achievement badge on load

---

## WDS-SGM Score Target: 9.0+
Status: BUILT 2026-05-14. All features shipped, 46/46 tests pass.
Retrofit Phase 3: apply grain + depth CSS, add cinematic intro, SGMDS SEAL.
