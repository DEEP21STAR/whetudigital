# CREATIVE BRIEF — EVENTSPACE PRO
**WDS-SGM Product Brief v1.0 · 2026-05-15**

---

## Product DNA
- **What:** Event marquee/hire management dashboard for Inaal (Events Pro Hire Company)
- **Who:** Inaal (client) — event hire business owner, needs to manage bookings + showcase
- **Feels like:** VIP event backstage — warm, festive, premium hospitality energy

---

## Motion Personality
| Dimension | Value |
|---|---|
| Speed | **Energetic** — 180–220ms transitions. Celebratory, warm. |
| Character | **Festive + Warm** — events should feel like celebrations |
| Energy Level | **8/10** — excitement without chaos |
| Signature Move | Warm orange particles → EVENTS blazes → golden spotlight rays |
| Rest State | Warm aurora pulses like stage lighting, booking cards glow |

---

## Colour Ownership
| Token | Value | Usage |
|---|---|---|
| `--accent` | `#C30B82` | Event magenta — brand anchor |
| `--warm` | `#FF6B35` | Warm orange complement |
| `--gold` | `#FFD700` | VIP / premium events |
| `--bg` | `#08030A` | Deep warm black |

---

## Cinematic Intro Config
```js
WhetuIntro({
  word:     'EVENTS',
  accent:   '#C30B82',
  bg:       '#08030A',
  subtitle: 'EVENTS PRO HIRE',
  rings: [
    { pct:0.32, color:'#C30B82', glow:'rgba(195,11,130,', track:'rgba(195,11,130,0.09)' },
    { pct:0.22, color:'#FF6B35', glow:'rgba(255,107,53,', track:'rgba(255,107,53,0.07)' },
    { pct:0.13, color:'#FFD700', glow:'rgba(255,215,0,',  track:'rgba(255,215,0,0.06)'  }
  ],
  onEnter: enterDashboard
});
```

---

## WDS-SGM Score Target: 8.5+
Product DELIVERED. Retrofit grain + depth CSS on next client touchpoint.
PIN: 1766 (Inaal's number). Contact: 021 146 1766.
