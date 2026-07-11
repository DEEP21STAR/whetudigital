/*!
 * whetu-intro.js — Whetū Digital Cinematic Intro Engine v1.0
 * © 2026 Whetū Digital. MIT License.
 *
 * Extracted from MIMI PT v3. Build once, configure per product.
 *
 * Usage:
 *   import { WhetuIntro } from './lib/whetu-intro.js';
 *
 *   WhetuIntro({
 *     word:     'ARCLINE',
 *     accent:   '#00D4FF',
 *     subtitle: 'NZ ELECTRICAL PM',
 *     onEnter:  () => showDashboard()
 *   });
 *
 * Full config reference at bottom of file.
 */

export function WhetuIntro(cfg = {}) {

  // ── Config + defaults ────────────────────────────────────────────────────
  const C = {
    word:      cfg.word      || 'WHETU',
    font:      cfg.font      || "'Bebas Neue', sans-serif",
    accent:    cfg.accent    || '#7B61FF',
    bg:        cfg.bg        || '#05050F',
    subtitle:  cfg.subtitle  || '',
    enterText: cfg.enterText || 'ENTER',
    logoHtml:  cfg.logoHtml  || '',
    ptclCount: cfg.ptclCount || 480,
    rings:     cfg.rings     || [
      { pct:0.32, color:'#7B61FF', glow:'rgba(123,97,255,', track:'rgba(123,97,255,0.09)' },
      { pct:0.22, color:'#FFD700', glow:'rgba(255,215,0,',  track:'rgba(255,215,0,0.07)'  },
      { pct:0.13, color:'#00FFB3', glow:'rgba(0,255,179,',  track:'rgba(0,255,179,0.06)'  }
    ],
    onEnter:   cfg.onEnter   || (() => {}),
  };

  const PH = Object.assign({
    ringStart: 350, ring1done: 1900, ring2done: 2300, ring3done: 2700,
    burst: 3050, collapse: 3550, impact: 5350, glow: 5950, enter: 6750, auto: 12000
  }, cfg.phases || {});

  // ── Parse accent hex → r,g,b ─────────────────────────────────────────────
  const _hex = C.accent.replace('#','');
  const AR = parseInt(_hex.slice(0,2),16);
  const AG = parseInt(_hex.slice(2,4),16);
  const AB = parseInt(_hex.slice(4,6),16);
  const _bgHex = C.bg.replace('#','');
  const BGR = parseInt(_bgHex.slice(0,2),16);
  const BGG = parseInt(_bgHex.slice(2,4),16);
  const BGB = parseInt(_bgHex.slice(4,6),16);

  // Derive particle hue from accent
  const _r = AR/255, _g = AG/255, _b = AB/255;
  const _max = Math.max(_r,_g,_b), _min = Math.min(_r,_g,_b);
  let _hBase = 0;
  if (_max !== _min) {
    const d = _max - _min;
    if (_max === _r)      _hBase = ((_g - _b)/d + (_g<_b?6:0)) * 60;
    else if (_max === _g) _hBase = ((_b - _r)/d + 2) * 60;
    else                  _hBase = ((_r - _g)/d + 4) * 60;
  }

  // ── Build DOM ────────────────────────────────────────────────────────────
  const root = document.createElement('div');
  root.id = 'whetu-intro';
  root.style.cssText = `position:fixed;inset:0;z-index:9999;background:${C.bg};overflow:hidden;`;

  const logoBlock = C.logoHtml
    ? `<div id="wti-logo" style="position:absolute;left:50%;top:calc(44% - 245px);
         transform:translateX(-50%);opacity:0;width:95px;height:95px;">${C.logoHtml}</div>`
    : '';

  root.innerHTML = `
    <canvas id="wti-canvas" style="position:absolute;inset:0;width:100%;height:100%"></canvas>
    <div id="wti-ui" style="position:absolute;inset:0;pointer-events:none">
      ${logoBlock}
      <div id="wti-sub" style="position:absolute;width:100%;text-align:center;
        top:calc(44% + 158px);font-size:0.9rem;letter-spacing:0.48em;
        text-transform:uppercase;color:rgba(255,255,255,0.72);opacity:0;
        text-shadow:0 0 20px ${C.accent}bb;font-family:${C.font};pointer-events:none"></div>
      <button id="wti-enter" style="position:absolute;left:50%;top:calc(44% + 248px);
        transform:translateX(-50%);padding:14px 52px;
        border:2px solid ${C.accent};background:transparent;color:${C.accent};
        font-family:${C.font};font-size:1.35rem;letter-spacing:0.25em;
        cursor:pointer;border-radius:4px;opacity:0;pointer-events:auto;
        text-shadow:0 0 10px ${C.accent};box-shadow:0 0 24px ${C.accent}26;
        transition:color .3s,background .3s,box-shadow .3s;"
        onmouseover="this.style.background='${C.accent}';this.style.color='#fff';this.style.boxShadow='0 0 55px ${C.accent}80'"
        onmouseout="this.style.background='transparent';this.style.color='${C.accent}';this.style.boxShadow='0 0 24px ${C.accent}26'"
      >${C.enterText}</button>
    </div>`;

  document.body.appendChild(root);

  // ── Canvas ────────────────────────────────────────────────────────────────
  const CANVAS = root.querySelector('#wti-canvas');
  const CX     = CANVAS.getContext('2d');
  let CW = CANVAS.width  = window.innerWidth;
  let CH = CANVAS.height = window.innerHeight;
  window.addEventListener('resize', () => {
    CW = CANVAS.width  = window.innerWidth;
    CH = CANVAS.height = window.innerHeight;
  });

  const logoEl  = root.querySelector('#wti-logo');
  const subEl   = root.querySelector('#wti-sub');
  const enterEl = root.querySelector('#wti-enter');

  // ── Text pixel sampling ──────────────────────────────────────────────────
  let textHomes = null, textSampled = false, _fontSize = 200;

  function sampleWordPixels() {
    _fontSize = Math.min(Math.floor(CW * 0.42), 460);
    const fh  = Math.ceil(_fontSize * 1.3);
    const off = document.createElement('canvas');
    off.width = CW; off.height = fh;
    const c   = off.getContext('2d');
    c.font = `900 ${_fontSize}px ${C.font}`;
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(C.word, CW / 2, fh / 2);
    const img = c.getImageData(0, 0, CW, fh);
    const pts = [], stride = 4, ancY = CH * 0.44;
    for (let y = 0; y < fh; y += stride)
      for (let x = 0; x < CW; x += stride)
        if (img.data[(y * CW + x) * 4 + 3] > 128)
          pts.push({ x, y: ancY + (y - fh / 2) });
    for (let i = pts.length - 1; i > 0; i--) {
      const j = 0 | (Math.random() * (i + 1));
      const t = pts[i]; pts[i] = pts[j]; pts[j] = t;
    }
    return pts.slice(0, 600);
  }

  function assignHomes() {
    if (textSampled) return;
    textSampled = true;
    textHomes   = sampleWordPixels();
    for (let i = 0; i < PTCLS.length; i++)
      PTCLS[i].home = textHomes[i % textHomes.length];
  }
  document.fonts.ready.then(assignHomes);

  // ── Particle class ────────────────────────────────────────────────────────
  class Ptcl {
    constructor() {
      this.home  = null;
      this.delay = Math.random() * 620;
      this.r     = 0.8 + Math.random() * 1.0;
      this.hue   = _hBase + (Math.random() - 0.5) * 40;
      this.lit   = 72 + Math.random() * 26;
      this.br    = 0.75 + Math.random() * 0.25;
      this.bph   = Math.random() * 6.2832;
      this.state = 'idle';
      this.x     = CW / 2 + (Math.random() - 0.5) * 24;
      this.y     = CH / 2 + (Math.random() - 0.5) * 24;
      this.vx    = 0; this.vy = 0; this._beat = 1;
      const ang  = Math.random() * 6.2832;
      const spd  = 8 + Math.random() * 20;
      this._bvx  = Math.cos(ang) * spd;
      this._bvy  = Math.sin(ang) * spd;
    }
    triggerBurst() {
      if (this.state !== 'idle') return;
      this.state = 'burst'; this.vx = this._bvx; this.vy = this._bvy;
    }
    update(e, collapseAt) {
      if (this.state === 'idle') return;
      const cx = CW / 2, cy = CH / 2;
      if (this.state === 'burst') {
        const dx = cx - this.x, dy = cy - this.y, d = Math.sqrt(dx*dx+dy*dy)||1;
        this.vx += (dx/d)*0.06; this.vy += (dy/d)*0.06;
        this.vx *= 0.975; this.vy *= 0.975;
        this.x  += this.vx; this.y += this.vy;
      } else if (this.state === 'homing' && this.home) {
        const dt = e - collapseAt - this.delay;
        if (dt < 0) return;
        const dx = this.home.x - this.x, dy = this.home.y - this.y;
        this.vx = (this.vx + dx*0.065)*0.82;
        this.vy = (this.vy + dy*0.065)*0.82;
        this.x += this.vx; this.y += this.vy;
        if (dx*dx+dy*dy < 2 && this.vx*this.vx+this.vy*this.vy < 0.2) {
          this.state = 'home'; this.x = this.home.x; this.y = this.home.y; this.vx = this.vy = 0;
        }
      } else if (this.state === 'home') {
        this._beat = 1 + 0.07 * Math.sin(e * 0.0024 + this.bph);
      }
    }
    draw(glow) {
      if (this.state === 'idle') return;
      const sz = this.r * (this.state === 'home' ? this._beat : 0.9);
      CX.globalAlpha = this.br;
      if (glow && this.state === 'home') { CX.shadowBlur = 5; CX.shadowColor = `hsl(${this.hue},100%,85%)`; }
      CX.fillStyle = `hsl(${this.hue},100%,${this.lit}%)`;
      CX.beginPath(); CX.arc(this.x, this.y, sz, 0, 6.2832); CX.fill();
      CX.shadowBlur = 0; CX.globalAlpha = 1;
    }
  }

  const PTCLS  = Array.from({ length: C.ptclCount }, () => new Ptcl());
  const SWRINGS = [];

  class SwRing {
    constructor(cx,cy,spd,col) { this.x=cx;this.y=cy;this.r=0;this.spd=spd;this.col=col;this.op=0.85; }
    step() { this.r+=this.spd; this.op-=0.011; }
    draw() {
      if(this.op<=0)return;
      CX.save();CX.globalAlpha=this.op;CX.strokeStyle=this.col;CX.lineWidth=2.5;
      CX.beginPath();CX.arc(this.x,this.y,this.r,0,6.2832);CX.stroke();CX.restore();
    }
    get dead(){return this.op<=0;}
  }

  // ── Activity rings ────────────────────────────────────────────────────────
  function drawRings(e, cx, cy) {
    const base = Math.min(CW, CH);
    const rcfg = [
      { ...C.rings[0], startAt: PH.ringStart,       doneAt: PH.ring1done },
      { ...C.rings[1], startAt: PH.ringStart + 300, doneAt: PH.ring2done },
      { ...C.rings[2], startAt: PH.ringStart + 650, doneAt: PH.ring3done },
    ];
    for (const cfg of rcfg) {
      if (e < cfg.startAt) continue;
      const prog = Math.min((e-cfg.startAt)/(cfg.doneAt-cfg.startAt), 1);
      const s = -Math.PI/2, end = s + prog * Math.PI*2;
      const isBurst = e >= PH.burst;
      let r = base * cfg.pct;
      if (isBurst) { const bt = Math.min((e-PH.burst)/280,1); r*=(1-bt); if(r<2)continue; }
      const baseA = isBurst ? Math.max(1-(e-PH.burst)/280,0) : 1;
      const lw = Math.max(base*0.012,8), headR = Math.max(base*0.024,16);
      CX.save(); CX.strokeStyle=cfg.track; CX.lineWidth=lw; CX.lineCap='round';
      CX.beginPath(); CX.arc(cx,cy,r,0,Math.PI*2); CX.stroke(); CX.restore();
      CX.save(); CX.shadowBlur=22; CX.shadowColor=cfg.color;
      CX.strokeStyle=cfg.color; CX.lineWidth=lw; CX.lineCap='round'; CX.globalAlpha=baseA;
      CX.beginPath(); CX.arc(cx,cy,r,s,end); CX.stroke(); CX.restore();
      if (prog<1 && !isBurst) {
        const hx=cx+Math.cos(end)*r, hy=cy+Math.sin(end)*r;
        const gr=CX.createRadialGradient(hx,hy,0,hx,hy,headR);
        gr.addColorStop(0,cfg.glow+'1)'); gr.addColorStop(.4,cfg.glow+'.5)'); gr.addColorStop(1,cfg.glow+'0)');
        CX.save(); CX.globalAlpha=baseA; CX.fillStyle=gr;
        CX.beginPath(); CX.arc(hx,hy,headR,0,6.2832); CX.fill(); CX.restore();
      }
      if (prog>=1 && !isBurst) {
        const fa=e-cfg.doneAt;
        if (fa<500) {
          CX.save(); CX.globalAlpha=Math.max(0,1-fa/500)*0.55;
          CX.shadowBlur=50; CX.shadowColor=cfg.color;
          CX.strokeStyle=cfg.color; CX.lineWidth=lw*1.8; CX.lineCap='round';
          CX.beginPath(); CX.arc(cx,cy,r,0,Math.PI*2); CX.stroke(); CX.restore();
        }
      }
    }
  }

  // ── God rays ─────────────────────────────────────────────────────────────
  function drawRays(cx, cy, t, alpha) {
    if (alpha < 0.01) return;
    CX.save(); CX.globalCompositeOperation = 'screen';
    const nR = 18, len = Math.hypot(CW, CH) * 1.45;
    for (let i = 0; i < nR; i++) {
      const ang = (i/nR)*6.2832 + t*0.042;
      const w   = 0.046 + (i%3===0 ? 0.028 : 0);
      const grd = CX.createLinearGradient(cx,cy,cx+Math.cos(ang)*len*0.22,cy+Math.sin(ang)*len*0.22);
      const c1  = `rgba(${AR},${AG},${AB},`;
      const c2  = i%2===0 ? c1 : `rgba(${Math.min(AR+30,255)},${AG},${AB},`;
      grd.addColorStop(0,   c2+(alpha*0.55)+')');
      grd.addColorStop(0.5, c2+(alpha*0.04)+')');
      grd.addColorStop(1,   c2+'0)');
      CX.beginPath(); CX.moveTo(cx,cy);
      CX.lineTo(cx+Math.cos(ang-w)*len,cy+Math.sin(ang-w)*len);
      CX.lineTo(cx+Math.cos(ang+w)*len,cy+Math.sin(ang+w)*len);
      CX.closePath(); CX.fillStyle=grd; CX.fill();
    }
    CX.restore();
  }

  // ── Main loop ─────────────────────────────────────────────────────────────
  let T0=null, collapseAt=0, bursted=false, collapsed=false, impacted=false, alive=true;
  const eoc3 = p => 1 - Math.pow(1-p, 3);

  function tick(ts) {
    if (!alive) return;
    if (!T0) T0 = ts;
    const e = ts - T0, cx = CW/2, cy = CH/2;

    if (e > 800 && !textSampled) assignHomes();

    CX.fillStyle = `rgba(${BGR},${BGG},${BGB},0.18)`;
    CX.fillRect(0, 0, CW, CH);

    if (e >= PH.ringStart) drawRings(e, cx, cy);

    const rA = e < PH.burst ? 0
      : e < PH.collapse ? Math.min((e-PH.burst)/600,1)*0.30
      : e < PH.impact   ? Math.max(0.38-(e-PH.collapse)/2200*0.15, 0.23)
      :                   Math.max(0.23-(e-PH.impact)/900*0.21, 0.02);
    drawRays(cx, cy, ts*0.001, rA);

    if (e >= PH.burst && !bursted) {
      bursted = true;
      PTCLS.forEach(p => p.triggerBurst());
      SWRINGS.push(new SwRing(cx,cy,18,C.accent));
      SWRINGS.push(new SwRing(cx,cy,10,'rgba(255,215,0,0.9)'));
      SWRINGS.push(new SwRing(cx,cy,26,'rgba(0,255,179,0.8)'));
      SWRINGS.push(new SwRing(cx,cy,6,'rgba(255,255,255,0.85)'));
    }
    for (let i=SWRINGS.length-1; i>=0; i--) {
      SWRINGS[i].step(); SWRINGS[i].draw();
      if (SWRINGS[i].dead) SWRINGS.splice(i,1);
    }

    if (e >= PH.collapse && !collapsed) {
      collapsed=true; collapseAt=e;
      PTCLS.forEach(p => { if(p.state==='burst') p.state='homing'; });
    }
    if (e >= PH.impact && !impacted) {
      impacted=true;
      SWRINGS.push(new SwRing(cx,cy,11,C.accent));
      SWRINGS.push(new SwRing(cx,cy,6,'#FF69B4'));
      SWRINGS.push(new SwRing(cx,cy,17,'rgba(255,255,255,0.75)'));
    }

    const glowOn = e > PH.impact;
    for (const p of PTCLS) { p.update(e, collapseAt); p.draw(glowOn); }

    if (e > PH.impact && e < PH.impact+380) {
      CX.fillStyle=`rgba(255,255,255,${Math.max(0,1-(e-PH.impact)/380)*0.38})`;
      CX.fillRect(0,0,CW,CH);
    }

    // Solid neon word blazes in after assembly
    if (e > PH.impact && _fontSize > 0) {
      const tF = Math.min(1,(e-PH.impact)/700), ancY = CH*0.44;
      CX.save();
      CX.font=`900 ${_fontSize}px ${C.font}`;
      CX.textAlign='center'; CX.textBaseline='middle';
      CX.globalAlpha=tF*0.40; CX.shadowBlur=70; CX.shadowColor=C.accent;
      CX.fillStyle=C.accent+'55'; CX.fillText(C.word,CW/2,ancY);
      CX.globalAlpha=tF*0.90; CX.shadowBlur=30; CX.shadowColor=C.accent;
      CX.fillStyle=C.accent; CX.fillText(C.word,CW/2,ancY);
      CX.globalAlpha=tF*1.00; CX.shadowBlur=12; CX.shadowColor='#fff';
      CX.fillStyle='rgba(255,255,255,0.88)'; CX.fillText(C.word,CW/2,ancY);
      CX.restore();
    }

    // Logo descends
    if (logoEl && e > PH.burst+100) {
      const ep = eoc3(Math.min((e-PH.burst-100)/1200,1));
      logoEl.style.opacity   = ep;
      logoEl.style.transform = `translateX(-50%) translateY(${(1-ep)*-65}px) scale(${0.68+ep*0.32})`;
    }

    // Subtitle typewriter
    if (C.subtitle && e > PH.glow) {
      const ep = eoc3(Math.min((e-PH.glow)/950,1));
      subEl.style.opacity   = ep;
      subEl.style.transform = `translateY(${(1-ep)*22}px)`;
      if (!subEl.dataset.done) {
        const p2 = Math.min((e-PH.glow)/950,1);
        subEl.textContent = C.subtitle.slice(0,Math.round(p2*C.subtitle.length))+(p2<1?'▌':'');
        if (p2>=1) { subEl.dataset.done='1'; subEl.textContent=C.subtitle; }
      }
    }

    // Enter button
    if (e > PH.enter) {
      const ep = eoc3(Math.min((e-PH.enter)/700,1));
      enterEl.style.opacity   = ep;
      enterEl.style.transform = `translateX(-50%) translateY(${(1-ep)*18}px)`;
    }

    if (e < PH.auto) requestAnimationFrame(tick);
    else _enter();
  }

  function _enter() {
    if (!alive) return;
    alive = false;
    root.style.animation = 'wtiOut 0.8s ease forwards';
    setTimeout(() => { root.remove(); styleTag.remove(); C.onEnter(); }, 800);
  }

  enterEl.addEventListener('click', _enter);

  const styleTag = document.createElement('style');
  styleTag.textContent = '@keyframes wtiOut{to{opacity:0;pointer-events:none}}';
  document.head.appendChild(styleTag);

  requestAnimationFrame(tick);
  setTimeout(() => { if (alive) _enter(); }, PH.auto);

  return { destroy: () => { alive=false; root.remove(); styleTag.remove(); } };
}

/*
 * ── FULL CONFIG REFERENCE ──────────────────────────────────────────────────
 *
 * WhetuIntro({
 *   word:      'ARCLINE',           // assembled from particles (required)
 *   font:      "'Bebas Neue', sans-serif",
 *   accent:    '#00D4FF',           // hex only — drives particle hue + rings + rays
 *   bg:        '#05050F',           // hex only — used for motion-blur clear
 *   subtitle:  'NZ ELECTRICAL PM',  // typewriter text after assembly
 *   enterText: 'ENTER',             // button label
 *   logoHtml:  '<svg>...</svg>',    // injected above particle text (optional)
 *   ptclCount: 480,                 // particle count (use 300 on mobile)
 *   rings: [
 *     { pct:0.32, color:'#00D4FF', glow:'rgba(0,212,255,',  track:'rgba(0,212,255,0.09)' },
 *     { pct:0.22, color:'#FFD700', glow:'rgba(255,215,0,',  track:'rgba(255,215,0,0.07)' },
 *     { pct:0.13, color:'#00FFB3', glow:'rgba(0,255,179,',  track:'rgba(0,255,179,0.06)' }
 *   ],
 *   phases: {                       // override any timing (ms)
 *     auto: 10000                   // earlier auto-advance
 *   },
 *   onEnter: () => showDashboard()
 * });
 *
 * ── PRODUCT QUICK-START CONFIGS ───────────────────────────────────────────
 *
 * ARCLINE (electric blue):
 *   { word:'ARCLINE', accent:'#00D4FF', bg:'#030B12', subtitle:'NZ ELECTRICAL PM' }
 *
 * VIGIL (health green):
 *   { word:'VIGIL', accent:'#00E676', bg:'#030F06', subtitle:'SYSTEM MONITOR' }
 *
 * BULLRUN (gold):
 *   { word:'BULLRUN', accent:'#FFB300', bg:'#0A0800', subtitle:'MARKET DASHBOARD' }
 *
 * CLARITY (violet):
 *   { word:'CLARITY', accent:'#7B61FF', bg:'#05050F', subtitle:'BUSINESS INTELLIGENCE' }
 *
 * LIFELINE (red/teal):
 *   { word:'LIFELINE', accent:'#FF1744', bg:'#0A0305', subtitle:'EMERGENCY PROTOCOL' }
 */
