# CREATIVE BRIEF — MIMI PT
**WDS-SGM Product Brief v1.0 · 2026-05-15**

---

## Product DNA
- **What:** Personal training dashboard for Mimi (PT business owner + clients)
- **Who:** Fitness professional + 4 premium clients (Ana, Sarah, Jordan, Taylor)
- **Feels like:** Walking into a high-end boutique gym at midnight — powerful, feminine, electric

---

## Motion Personality
| Dimension | Value |
|---|---|
| Speed | **Fast** — 180–220ms transitions. Explosive on interactions. |
| Character | **Empowering + Celebratory** — every action feels like a win |
| Energy Level | **9/10** — high energy, never frantic |
| Signature Move | Particle assembly → solid neon text → god rays |
| Rest State | Aurora breathes, ambient sparks drift upward |

---

## Colour Ownership
| Token | Value | Usage |
|---|---|---|
| `--accent` | `#FF006E` | Hot pink — primary brand, glow, rings |
| `--accent-light` | `#FF69B4` | Hover states, secondary highlights |
| `--gold` | `#FFD700` | Premium tier, achievements |
| `--green` | `#00FFB3` | Health/progress indicators |
| `--bg` | `#07050F` | Deepest background |

---

## Cinematic Intro Config
```js
WhetuIntro({
  word:     'MIMI',
  accent:   '#FF006E',
  bg:       '#07050F',
  subtitle: 'PERSONAL TRAINER',
  rings: [
    { pct:0.32, color:'#FF006E', glow:'rgba(255,0,110,',  track:'rgba(255,0,110,0.09)' },
    { pct:0.22, color:'#FFD700', glow:'rgba(255,215,0,',   track:'rgba(255,215,0,0.07)' },
    { pct:0.13, color:'#00FFB3', glow:'rgba(0,255,179,',   track:'rgba(0,255,179,0.06)' }
  ],
  logoHtml: '<svg><!-- MIMI hexagon --></svg>',
  onEnter:  enterDashboard
});
```

---

## Key Animated Moments
1. **Client card select** — border blazes, client data slides in from right (280ms, easeOutExpo)
2. **Stat card hover** — translateY(-5px) + accent glow ramp (220ms)
3. **Exercise card entry** — stagger 80ms, scale 0.95→1 + opacity 0→1
4. **Calendar appointment** — pulse ring animation on today's date
5. **Revenue total** — count-up on app enter (1200ms easeOutCubic)
6. **View toggle (Business/Client)** — panels cross-fade 240ms

---

## WDS-SGM Score Targets
| Dimension | Current | Target |
|---|---|---|
| Cinematic Intro | 9.0 | 9.0 ✅ |
| Colour Personality | 8.5 | 9.0 |
| Motion Hierarchy | 7.5 | 9.0 |
| Typography | 7.0 | 8.5 |
| Grain + Texture | 3.0 | 8.0 — add `.whetu-grain` to all cards |
| Parallax Depth | 8.0 | 9.0 ✅ (wired) |
| State-Aware Living UI | 5.0 | 8.5 — client state escalation |
| Mobile Responsiveness | 6.0 | 8.0 |
| **OVERALL** | **4.1/10** | **9.0+** |

---

## Next Retrofit Steps
1. Add `.whetu-grain` to all `.stat-card`, `.panel`, `.tier-card`
2. Add `data-product="mimi"` to `.whetu-parallax-bg`
3. Client state-aware cards: overdue = amber escalation, active = green pulse
4. View Transition API on Business/Client toggle
5. SGMDS SEAL comment at top of file
