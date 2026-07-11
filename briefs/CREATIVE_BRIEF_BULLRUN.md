# CREATIVE BRIEF — BULLRUN
**WDS-SGM Product Brief v1.0 · 2026-05-15**

---

## Product DNA
- **What:** Trading / market dashboard — price tracking, portfolio, momentum indicators
- **Who:** Deep (personal finance monitoring)
- **Feels like:** A trading floor meets a sports stadium — aggressive, momentum-driven, kinetic

---

## Motion Personality
| Dimension | Value |
|---|---|
| Speed | **Fast** — 150–200ms transitions. Kinetic. Never waits. |
| Character | **Aggressive + Urgent** — bulls charge, they don't stroll |
| Energy Level | **9/10** — always feels like something is happening |
| Signature Move | Gold particle explosion → BULLRUN blazes → charging bull god rays |
| Rest State | Gold aurora pulses like a heartbeat, ticker streams below |

---

## Colour Ownership
| Token | Value | Usage |
|---|---|---|
| `--accent` | `#FFB300` | Bull gold — primary brand |
| `--red` | `#FF1744` | Down / loss / sell |
| `--green` | `#00E676` | Up / gain / buy |
| `--bg` | `#0A0800` | Dark gold-tinted background |

---

## Cinematic Intro Config
```js
WhetuIntro({
  word:     'BULLRUN',
  accent:   '#FFB300',
  bg:       '#0A0800',
  subtitle: 'MARKET DASHBOARD',
  rings: [
    { pct:0.32, color:'#FFB300', glow:'rgba(255,179,0,',  track:'rgba(255,179,0,0.09)' },
    { pct:0.22, color:'#FF1744', glow:'rgba(255,23,68,',  track:'rgba(255,23,68,0.07)'  },
    { pct:0.13, color:'#00E676', glow:'rgba(0,230,118,',  track:'rgba(0,230,118,0.06)' }
  ],
  onEnter: enterDashboard
});
```

---

## Key Animated Moments
1. **Price tick** — green flash on up, red flash on down (150ms CSS transition)
2. **Portfolio card** — number counter cascades on load, delta arrows animate in
3. **Live ticker** — horizontal scroll marquee, green/red colored values
4. **Chart entry** — ApexCharts area chart draws in from left (1200ms)
5. **All-time high** — gold particle burst from the stat card
