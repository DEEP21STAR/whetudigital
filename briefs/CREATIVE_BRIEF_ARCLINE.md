# CREATIVE BRIEF — ARCLINE NZ
**WDS-SGM Product Brief v1.0 · 2026-05-15**

---

## Product DNA
- **What:** NZ electrical project management — CoC/ESC/RoI generation, 7-year vault, EWRB-native
- **Who:** Registered NZ electricians (EWRB-certified), compliance-focused professionals
- **Feels like:** A precision instrument — surgical, authoritative, built to EWRB standard

---

## Motion Personality
| Dimension | Value |
|---|---|
| Speed | **Measured** — 280–320ms transitions. Confident, never rushed. |
| Character | **Precise + Authoritative** — every click feels certified |
| Energy Level | **7/10** — professional restraint, powerful when needed |
| Signature Move | Electric arc particles → ARCLINE solid neon → circuit-board god rays |
| Rest State | Cool blue aurora pulses slowly like a live panel |

---

## Colour Ownership
| Token | Value | Usage |
|---|---|---|
| `--accent` | `#00D4FF` | Electric blue — primary brand, glow, CoC accents |
| `--accent-deep` | `#0080FF` | Deep blue for authority states |
| `--green` | `#00E676` | Compliance passed / active status |
| `--amber` | `#FFB300` | Pending / requires attention |
| `--red` | `#FF1744` | Failed / overdue / expired |
| `--bg` | `#030B12` | Deep navy background |

---

## Cinematic Intro Config
```js
WhetuIntro({
  word:     'ARCLINE',
  accent:   '#00D4FF',
  bg:       '#030B12',
  subtitle: 'NZ ELECTRICAL PM',
  rings: [
    { pct:0.32, color:'#00D4FF', glow:'rgba(0,212,255,',  track:'rgba(0,212,255,0.09)' },
    { pct:0.22, color:'#00E676', glow:'rgba(0,230,118,',  track:'rgba(0,230,118,0.07)' },
    { pct:0.13, color:'#FFB300', glow:'rgba(255,179,0,',  track:'rgba(255,179,0,0.06)' }
  ],
  onEnter: enterDashboard
});
```

---

## Key Animated Moments
1. **CoC generation** — progress bar fills with electric arc effect, DONE state triggers confetti burst
2. **7-year vault** — document cards float in with stagger (120ms), vault door close animation
3. **Job status cards** — live state escalation (pending→amber→green on completion)
4. **EWRB compliance ticker** — scrolling compliance status, green when all current
5. **Certificate expiry** — amber pulse 90 days out, red pulse on expiry
6. **Tab navigation** — View Transition API slide between CoC / ESC / RoI / Vault

---

## WDS-SGM Score Targets
| Dimension | Target |
|---|---|
| Cinematic Intro | 9.0 |
| Colour Personality | 9.0 — electric blue owns NZ electrical space |
| Motion Hierarchy | 9.0 — state-aware compliance escalation |
| Typography | 8.5 |
| Grain + Texture | 8.5 — `.whetu-grain-heavy` on CoC document cards |
| Parallax Depth | 9.0 |
| State-Aware Living UI | 9.5 — compliance states are the core product |
| Mobile Responsiveness | 8.0 |
| **TARGET OVERALL** | **9.2+** |

---

## SGMDS Retrofit Priority (Phase 3 — highest conviction product)
1. Apply `whetu-intro.js` (ARCLINE word + blue rings)
2. Add `data-product="arcline"` to parallax container
3. Wire `whetu-grain.css` to all document cards + panels
4. State-aware CSS: `[data-status="compliant"]` → green glow, `[data-status="expired"]` → red pulse
5. View Transitions on tab switches (CoC/ESC/RoI/Vault)
6. SGMDS SEAL embedded at file top before shipping
