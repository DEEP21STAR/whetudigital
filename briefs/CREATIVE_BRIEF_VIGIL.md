# CREATIVE BRIEF — VIGIL
**WDS-SGM Product Brief v1.0 · 2026-05-15**

---

## Product DNA
- **What:** System monitoring + status dashboard — health dots, Alt+1-5 tab switching, 5-tab iframe panel
- **Who:** Deep (personal operations monitoring — PHOENIX, AI GURU, services, ZENITH)
- **Feels like:** Mission control — calm, watchful, always-on. A heartbeat on every screen.

---

## Motion Personality
| Dimension | Value |
|---|---|
| Speed | **Slow pulse** — 350–400ms transitions. Steady, calming. |
| Character | **Watchful + Calm** — presence without anxiety |
| Energy Level | **5/10 rest, 9/10 on alert** — escalates with system state |
| Signature Move | Steady health dot pulse → status escalation → alert burst |
| Rest State | All-green aurora breathes in slow wave, services listed quietly |

---

## Colour Ownership
| Token | Value | Usage |
|---|---|---|
| `--accent` | `#00E676` | Health green — primary status |
| `--amber` | `#FFB300` | Warning / degraded state |
| `--red` | `#FF1744` | Critical / down |
| `--blue` | `#00B0FF` | Info / normal operations |
| `--bg` | `#030F06` | Deep green-tinted black |

---

## Cinematic Intro Config
```js
WhetuIntro({
  word:     'VIGIL',
  accent:   '#00E676',
  bg:       '#030F06',
  subtitle: 'SYSTEM MONITOR',
  rings: [
    { pct:0.32, color:'#00E676', glow:'rgba(0,230,118,',  track:'rgba(0,230,118,0.09)' },
    { pct:0.22, color:'#FFB300', glow:'rgba(255,179,0,',   track:'rgba(255,179,0,0.07)' },
    { pct:0.13, color:'#FF1744', glow:'rgba(255,23,68,',   track:'rgba(255,23,68,0.06)' }
  ],
  onEnter: enterDashboard
});
```

---

## Key Animated Moments
1. **Health dot** — constant 3s ease-in-out pulse, color reflects live status
2. **Service card escalation** — green → amber → red with CSS transitions on data attribute change
3. **Alert entry** — alert cards slide in from right with shake + accent border flash
4. **Tab switch (Alt+1-5)** — View Transition API crossfade, active tab glows
5. **Metric uptick** — count-up animation when values change (not just on load)
6. **All-clear state** — subtle rainbow aurora drift when all services green

---

## WDS-SGM Score Targets
| Dimension | Target |
|---|---|
| Cinematic Intro | 8.5 |
| Colour Personality | 9.0 — green ownership = health brand |
| State-Aware Living UI | 9.5 — this IS the product |
| Motion Hierarchy | 8.5 |
| Grain + Texture | 8.0 |
| Parallax Depth | 8.5 |
| **TARGET OVERALL** | **9.0+** |
