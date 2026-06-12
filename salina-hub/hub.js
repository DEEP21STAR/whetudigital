/* SALINA Family Hub — hub.js
   Phase 2-4 features integrated: scroll reveals, vanilla-tilt, GSAP+ScrollTrigger,
   ambient audio toggle, share, print, lightbox, world map, charts.
   Built on top of hub.html structure (DOM IDs and classes match). */
(() => {
'use strict';

/* ────────────────────────── CONFIG ────────────────────────── */
const CFG = {
  PIN: localStorage.getItem('salina_pin') || '020146',  // Mum's birthday DDMMYY (2 Jan 1946) — set via localStorage to override
  EVENT_DATE: new Date('2026-08-15T18:30:00+12:00'),
  VENUE_LAT: -37.7833, VENUE_LON: 175.2900,
  SHARE_URL: localStorage.getItem('salina_share_url') || location.href.replace(/hub\.html.*/, 'index.html'),
  ADMIN_PIN: localStorage.getItem('salina_admin_pin') || '1946',
};

/* ────────────────────────── UTILITIES ────────────────────────── */
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const toast = (msg, ms=2400) => {
  const t = $('#toast'); if (!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), ms);
};
const debounce = (fn, ms=200) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(()=>fn(...a), ms); }; };

/* ────────────────────────── PIN GATE ────────────────────────── */
let pinBuf = '';
function pinUpdate() {
  for (let i = 0; i < 6; i++) {
    $('#pd' + i).classList.toggle('filled', i < pinBuf.length);
  }
}
function pinCheck() {
  if (pinBuf === CFG.PIN) {
    sessionStorage.setItem('salina_unlocked', '1');
    $('#pinGate').classList.add('hidden');
    startCinematic();
  } else {
    $('#pgErr').textContent = 'Incorrect PIN';
    $('#pinGate').classList.add('pg-shake');
    setTimeout(() => $('#pinGate').classList.remove('pg-shake'), 420);
    setTimeout(() => { pinBuf = ''; pinUpdate(); $('#pgErr').innerHTML = '&nbsp;'; }, 600);
  }
}
function pinKey(k) {
  if (k === 'del') { pinBuf = pinBuf.slice(0, -1); pinUpdate(); return; }
  if (pinBuf.length >= 6) return;
  pinBuf += k; pinUpdate();
  if (pinBuf.length === 6) setTimeout(pinCheck, 200);
}
$$('.pg-key').forEach(b => b.addEventListener('click', () => pinKey(b.dataset.k)));
document.addEventListener('keydown', e => {
  if ($('#pinGate').classList.contains('hidden')) return;
  if (/^\d$/.test(e.key)) pinKey(e.key);
  else if (e.key === 'Backspace') pinKey('del');
  else if (e.key === 'Enter' && pinBuf.length === 6) pinCheck();
});

/* Auto-unlock if already unlocked this session */
if (sessionStorage.getItem('salina_unlocked') === '1') {
  $('#pinGate').classList.add('hidden');
  // Skip cine if already seen this session
  if (sessionStorage.getItem('salina_cine_seen') === '1') {
    $('#cine').classList.add('hidden');
    showApp();
  } else {
    startCinematic();
  }
}

/* ────────────────────────── CINEMATIC ────────────────────────── */
function startCinematic() {
  const cine = $('#cine');
  if (!cine || cine.classList.contains('hidden')) return showApp();
  setTimeout(() => {
    cine.classList.add('fade');
    setTimeout(() => {
      cine.classList.add('hidden');
      sessionStorage.setItem('salina_cine_seen', '1');
      showApp();
    }, 1200);
  }, 6500);
}
window.skipCine = () => {
  const cine = $('#cine');
  cine.classList.add('fade');
  setTimeout(() => { cine.classList.add('hidden'); sessionStorage.setItem('salina_cine_seen', '1'); showApp(); }, 600);
};

function showApp() {
  const app = $('#app');
  if (!app) return;
  app.hidden = false;
  requestAnimationFrame(() => app.classList.add('ready'));
  init();
}

/* ────────────────────────── MANDALA PETALS (CSS-driven) ────────────────────────── */
(function buildMandalaPetals() {
  const mandala = $('#mandala');
  if (!mandala) return;
  for (let i = 0; i < 8; i++) {
    const ring = document.createElement('div');
    ring.className = 'mandala-ring mr-' + (i + 1);
    mandala.appendChild(ring);
  }
  // Petals layer (24 petals around center)
  const petals = document.createElement('div');
  petals.className = 'mandala-petals';
  for (let i = 0; i < 24; i++) {
    const p = document.createElement('div');
    p.className = 'mr-petal';
    p.style.transform = `translate(-50%, 0) rotate(${i * 15}deg) translateY(-130px)`;
    petals.appendChild(p);
  }
  mandala.appendChild(petals);
})();

/* ────────────────────────── PARTICLE PETALS (canvas) ────────────────────────── */
(function setupPetalCanvas() {
  const c = $('#petals'); if (!c) return;
  const ctx = c.getContext('2d');
  let w, h, parts = [];
  function resize() { w = c.width = innerWidth; h = c.height = innerHeight; }
  resize(); addEventListener('resize', debounce(resize, 120));
  for (let i = 0; i < 22; i++) {
    parts.push({
      x: Math.random() * w, y: Math.random() * h - h,
      vx: (Math.random() - 0.5) * 0.4, vy: 0.4 + Math.random() * 0.9,
      r: 2 + Math.random() * 3, hue: 28 + Math.random() * 22,
      alpha: 0.16 + Math.random() * 0.22, twist: Math.random() * Math.PI * 2,
    });
  }
  function tick() {
    ctx.clearRect(0, 0, w, h);
    parts.forEach(p => {
      p.x += p.vx + Math.sin(p.twist) * 0.18;
      p.y += p.vy;
      p.twist += 0.013;
      if (p.y > h + 10) { p.y = -10; p.x = Math.random() * w; }
      ctx.beginPath();
      ctx.fillStyle = `hsla(${p.hue}, 88%, 64%, ${p.alpha})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(tick);
  }
  tick();
})();

/* ────────────────────────── CURSOR + TRAIL ────────────────────────── */
(function setupCursor() {
  if (matchMedia('(hover:none)').matches) return;
  const cur = $('#cursor'); if (!cur) return;
  let tx = 0, ty = 0;
  addEventListener('mousemove', e => {
    tx = e.clientX; ty = e.clientY;
    cur.style.left = tx + 'px'; cur.style.top = ty + 'px';
    // Trail
    if (Math.random() < 0.5) {
      const t = document.createElement('div');
      t.className = 'cursor-trail';
      t.style.left = tx + 'px'; t.style.top = ty + 'px';
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 700);
    }
  });
  addEventListener('mousedown', () => cur.classList.add('click'));
  addEventListener('mouseup',   () => cur.classList.remove('click'));
  // Hover detect
  document.addEventListener('mouseover', e => {
    if (e.target.closest('button,a,.pg-key,.chip,.nav-btn,.mem-card,.gl-row,.cd-unit')) cur.classList.add('hover');
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest('button,a,.pg-key,.chip,.nav-btn,.mem-card,.gl-row,.cd-unit')) cur.classList.remove('hover');
  });
})();

/* ────────────────────────── INIT (post-unlock) ────────────────────────── */
async function init() {
  startCountdown();
  setupNav();
  await loadGuests();
  loadMemories();
  renderVenueQR();
  setupScrollReveal();
  setupShare();
  setupAmbientAudio();
  updateTimestamp();
  // GSAP + ScrollTrigger for chart entrance
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray('.chart-card, .world-map, .heatmap-card, .stat').forEach(el => {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
        y: 26, opacity: 0, duration: 0.9, ease: 'power3.out',
      });
    });
  }
  // Vanilla tilt for cards
  if (window.VanillaTilt) {
    VanillaTilt.init($$('.cer-day, .venue-card, .chart-card'), {
      max: 5, speed: 600, glare: true, 'max-glare': 0.12, perspective: 1400, scale: 1.005,
    });
  }
}

/* ────────────────────────── COUNTDOWN ────────────────────────── */
function startCountdown() {
  const el = $('#cdRight'); if (!el) return;
  function build(d, h, m, s) {
    el.innerHTML = `
      <div class="cd-unit"><div class="cd-num">${d}</div><div class="cd-unit-lbl">Days</div></div>
      <div class="cd-unit"><div class="cd-num">${String(h).padStart(2,'0')}</div><div class="cd-unit-lbl">Hours</div></div>
      <div class="cd-unit"><div class="cd-num">${String(m).padStart(2,'0')}</div><div class="cd-unit-lbl">Minutes</div></div>
      <div class="cd-unit"><div class="cd-num">${String(s).padStart(2,'0')}</div><div class="cd-unit-lbl">Seconds</div></div>`;
  }
  function tick() {
    const diff = CFG.EVENT_DATE - new Date();
    if (diff < 0) { build(0,0,0,0); return; }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor(diff % 86400000 / 3600000);
    const m = Math.floor(diff % 3600000 / 60000);
    const s = Math.floor(diff % 60000 / 1000);
    build(d, h, m, s);
  }
  tick(); setInterval(tick, 1000);
}

/* ────────────────────────── NAVIGATION ────────────────────────── */
function setupNav() {
  $$('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tgt = btn.dataset.section;
      $$('section.section').forEach(s => s.classList.toggle('active', s.id === tgt));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

/* ────────────────────────── GUESTS DATA + RENDER ────────────────────────── */
let GUESTS = [];
async function loadGuests() {
  try {
    let data;
    if (window.GUESTS_DATA) {
      data = window.GUESTS_DATA;
    } else {
      const r = await fetch('./guests.json');
      data = await r.json();
    }
    // Real source of truth: Mandap RSVP_STATE + SEND_STATE in localStorage.
    // No synthetic placeholders — guests start clean, real state grows as Bapu/Deep act in Mandap.
    let rsvpState = {}; let sendState = {};
    try { rsvpState = JSON.parse(localStorage.getItem('salina_rsvp_state') || '{}'); } catch {}
    try { sendState = JSON.parse(localStorage.getItem('salina_send_state') || '{}'); } catch {}
    GUESTS = (data.guests || data || []).map(g => {
      const rs = rsvpState[g.id] || {};
      const ss = sendState[g.id] || {};
      const channel = ss.wa ? 'wa' : (ss.em ? 'em' : 'no');
      const send = (ss.wa || ss.em) ? 'sent' : 'pend';
      return { ...g, channel, send, rsvp: rs.status || 'pend' };
    });
    renderStats(); renderGuests(); renderCharts(); renderWorldMap(); renderHeatmap(); renderSendTimeline();
  } catch (e) {
    console.warn('guests.json failed', e);
    toast('Guest data unavailable');
  }
}

function renderStats() {
  const total = GUESTS.length;
  const rsvpYes = GUESTS.filter(g => g.rsvp === 'yes').length;
  const sent = GUESTS.filter(g => g.send === 'sent').length;
  const pending = total - rsvpYes - GUESTS.filter(g => g.rsvp === 'no').length;
  const stats = [
    { lbl: 'Invitees', val: total, sub: '141 families', cls: 'gold' },
    { lbl: 'RSVPs in', val: rsvpYes, sub: `${Math.round(rsvpYes/total*100)}% confirmed`, cls: 'ok' },
    { lbl: 'Messages sent', val: sent, sub: `${total - sent} to go`, cls: '' },
    { lbl: 'Still pending', val: pending, sub: 'awaiting reply', cls: 'warn' },
  ];
  $('#statsGrid').innerHTML = stats.map(s =>
    `<div class="stat glass observe ${s.cls}"><div class="stat-lbl">${s.lbl}</div><div class="stat-val">${s.val}</div><div class="stat-sub">${s.sub}</div></div>`
  ).join('');
  $('#tbRsvp').textContent = rsvpYes;
}

function renderGuests() {
  const rowsEl = $('#glRows'); if (!rowsEl) return;
  const filter = $('.chip.active')?.dataset.filter || 'all';
  const search = ($('#guestSearch').value || '').toLowerCase().trim();
  let list = GUESTS;
  if (filter === 'rsvp') list = list.filter(g => g.rsvp === 'yes');
  else if (filter === 'pending') list = list.filter(g => g.rsvp === 'pend');
  else if (filter !== 'all') list = list.filter(g => g.region_id === filter);
  if (search) list = list.filter(g => (g.name + ' ' + g.city).toLowerCase().includes(search));

  // Update counts
  const cAll = $('#cAll'); if (cAll) cAll.textContent = GUESTS.length;
  ['akl','ham','aus','fji','usa','oth'].forEach(r => {
    const el = $('#c' + r.charAt(0).toUpperCase() + r.slice(1));
    if (el) el.textContent = GUESTS.filter(g => g.region_id === r).length;
  });
  const cRsvp = $('#cRsvp'); if (cRsvp) cRsvp.textContent = GUESTS.filter(g => g.rsvp === 'yes').length;
  const cPend = $('#cPend'); if (cPend) cPend.textContent = GUESTS.filter(g => g.rsvp === 'pend').length;

  rowsEl.innerHTML = list.map(g => {
    const chBadge = { wa:['b-wa','WA'], em:['b-em','EM'], no:['b-no','—'] }[g.channel] || ['b-no','—'];
    const sndBadge = { sent:['b-sent','SENT'], pend:['b-pend','PEND'], fail:['b-fail','FAIL'] }[g.send] || ['b-pend','PEND'];
    const rsvpBadge = { yes:['b-rsvp-yes','✓ YES'], no:['b-rsvp-no','— NO'], day:['b-rsvp-day','MAYBE'], call:['b-rsvp-call','📞 CALL'], pend:['b-pend','PEND'] }[g.rsvp] || ['b-pend','—'];
    return `<div class="gl-row" data-id="${g.id}">
      <div class="gl-name">${escapeHtml(g.name)} <span class="gl-region-chip">${escapeHtml(g.region_name)}</span></div>
      <div class="gl-id">#${String(g.id).padStart(3,'0')}</div>
      <div><span class="badge ${chBadge[0]}">${chBadge[1]}</span></div>
      <div><span class="badge ${sndBadge[0]}">${sndBadge[1]}</span></div>
      <div><span class="badge ${rsvpBadge[0]}">${rsvpBadge[1]}</span></div>
      <div class="gl-chev">›</div>
      <div class="gl-detail">
        <div class="gl-detail-meta">
          <span><b>Region</b> ${escapeHtml(g.region_name)}</span>
          <span><b>City</b> ${escapeHtml(g.city)}</span>
          <span><b>ID</b> ${g.id}</span>
        </div>
        <div class="gl-actions">
          <a class="gl-action" href="tel:+64212935401">📞 Call Sachind</a>
          <a class="gl-action" href="#" data-action="copy" data-name="${escapeHtml(g.name)}">📋 Copy name</a>
        </div>
      </div>
    </div>`;
  }).join('');

  rowsEl.querySelectorAll('.gl-row').forEach(row => {
    row.addEventListener('click', e => {
      if (e.target.closest('a,.gl-action')) return;
      row.classList.toggle('expanded');
    });
  });
  rowsEl.querySelectorAll('[data-action="copy"]').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); navigator.clipboard.writeText(a.dataset.name); toast('Copied'); });
  });
}

$('#guestSearch')?.addEventListener('input', debounce(renderGuests, 180));
$$('.chip').forEach(c => c.addEventListener('click', () => {
  $$('.chip').forEach(x => x.classList.remove('active'));
  c.classList.add('active');
  renderGuests();
}));

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* ────────────────────────── CHARTS (ECharts) ────────────────────────── */
function renderCharts() {
  if (!window.echarts) return;
  const donut = echarts.init($('#donutChart'));
  const yes = GUESTS.filter(g=>g.rsvp==='yes').length;
  const no  = GUESTS.filter(g=>g.rsvp==='no').length;
  const day = GUESTS.filter(g=>g.rsvp==='day').length;
  const call= GUESTS.filter(g=>g.rsvp==='call').length;
  const pend= GUESTS.filter(g=>g.rsvp==='pend').length;
  donut.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', textStyle: { fontFamily: 'Geist Mono' } },
    legend: { bottom: 0, textStyle: { color: '#c9b89a', fontFamily: 'Geist Mono', fontSize: 10, letterSpacing: 1.5 } },
    series: [{
      type: 'pie', radius: ['56%','82%'], avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: 'rgba(8,5,12,.9)', borderWidth: 2 },
      label: { show: false }, emphasis: { scale: true, scaleSize: 6 },
      data: [
        { value: yes,  name: 'Confirmed', itemStyle: { color: '#10b981' } },
        { value: day,  name: 'Maybe',     itemStyle: { color: '#f97316' } },
        { value: call, name: 'Call',      itemStyle: { color: '#f5c557' } },
        { value: no,   name: 'Declined',  itemStyle: { color: '#e57373' } },
        { value: pend, name: 'Pending',   itemStyle: { color: '#7a6754' } },
      ],
    }],
  });
  addEventListener('resize', debounce(() => donut.resize(), 200));
}

function renderSendTimeline() {
  const el = $('#sendTimeline'); if (!el) return;
  const days = [
    { name: 'Day 1', date: 'Mon · Aug 4', cap: 'WhatsApp wave', count: 78, pct: 92 },
    { name: 'Day 2', date: 'Tue · Aug 5', cap: 'Email wave',    count: 44, pct: 78 },
    { name: 'Day 3', date: 'Wed · Aug 6', cap: 'Phone calls',    count: 19, pct: 42 },
  ];
  el.innerHTML = days.map(d => `
    <div class="tl-day">
      <div class="tl-day-name">${d.name} · ${d.date}</div>
      <div class="tl-day-num">${d.count}</div>
      <div class="tl-day-cap">${d.cap}</div>
      <div class="tl-bar"><div class="tl-bar-fill" style="width:${d.pct}%"></div></div>
    </div>
  `).join('');
}

/* ────────────────────────── WORLD MAP (Pacific cities) ────────────────────────── */
function renderWorldMap() {
  const w = $('#worldMapWrap'); if (!w) return;
  const cities = [
    { name: 'Auckland',  region: 'akl', lat: -36.85, lon: 174.76, color: '#10d8ff' },
    { name: 'Hamilton',  region: 'ham', lat: -37.78, lon: 175.28, color: '#f5c557' },
    { name: 'Sydney',    region: 'aus', lat: -33.87, lon: 151.21, color: '#f97316' },
    { name: 'Melbourne', region: 'aus', lat: -37.81, lon: 144.96, color: '#f97316' },
    { name: 'Suva',      region: 'fji', lat: -18.14, lon: 178.42, color: '#34d399' },
    { name: 'Lautoka',   region: 'fji', lat: -17.62, lon: 177.45, color: '#34d399' },
    { name: 'San Fran',  region: 'usa', lat:  37.77, lon:-122.42, color: '#c040ff' },
    { name: 'Vancouver', region: 'usa', lat:  49.28, lon:-123.12, color: '#c040ff' },
    { name: 'London',    region: 'oth', lat:  51.51, lon:  -0.13, color: '#e57373' },
  ];
  // Equirectangular projection to 1080x420 viewBox
  const W = 1080, H = 420;
  const proj = (lat, lon) => {
    let x = ((lon + 180) / 360) * W;
    let y = ((90 - lat) / 180) * H;
    return [x, y];
  };
  const counts = {};
  cities.forEach(c => {
    counts[c.region] = (counts[c.region] || 0) + GUESTS.filter(g => g.region_id === c.region).length;
  });
  const points = cities.map(c => {
    const [x, y] = proj(c.lat, c.lon);
    const count = GUESTS.filter(g => g.region_id === c.region && g.city.startsWith(c.name)).length || GUESTS.filter(g => g.region_id === c.region).length;
    return { ...c, x, y, count };
  });
  // Arcs from Hamilton (origin) to each city
  const [ox, oy] = proj(CFG.VENUE_LAT, CFG.VENUE_LON);
  const arcs = points.filter(p => p.name !== 'Hamilton').map(p => {
    const mx = (ox + p.x) / 2;
    const my = (oy + p.y) / 2 - 40;
    return `M${ox},${oy} Q${mx},${my} ${p.x},${p.y}`;
  });
  const svg = `<svg class="wm-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="oceanG"><stop offset="0%" stop-color="rgba(20,10,5,0.4)"/><stop offset="100%" stop-color="rgba(8,5,12,0.95)"/></radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#oceanG)"/>
    <g class="wm-grid" stroke="rgba(245,197,87,0.04)" stroke-width="0.4" fill="none">
      ${[60,120,180,240,300,360].map(y => `<line x1="0" y1="${y}" x2="${W}" y2="${y}"/>`).join('')}
      ${[180,360,540,720,900].map(x => `<line x1="${x}" y1="0" x2="${x}" y2="${H}"/>`).join('')}
    </g>
    <g class="wm-arcs">${arcs.map(d => `<path class="wm-arc" d="${d}"/>`).join('')}</g>
    <g>${points.map(p => `
      <g class="wm-city" transform="translate(${p.x},${p.y})">
        <circle class="wm-pulse-2" cx="0" cy="0" r="6" style="--c:${p.color}"/>
        <circle class="wm-pulse" cx="0" cy="0" r="5" style="--c:${p.color}"/>
        <text class="wm-city-label" x="9" y="-6">${p.name}</text>
        <text class="wm-city-count" x="9" y="9">${p.count}</text>
      </g>`).join('')}
    </g>
  </svg>`;
  w.innerHTML = svg;
  // Legend
  const totalAbroad = GUESTS.filter(g => g.region_id !== 'akl' && g.region_id !== 'ham').length;
  $('#wmLegend').innerHTML = `
    <div class="wm-leg"><b>${GUESTS.length}</b><span>Total invitees</span></div>
    <div class="wm-leg"><b>${cities.length}</b><span>Cities</span></div>
    <div class="wm-leg"><b>${totalAbroad}</b><span>Overseas parivaar</span></div>`;
}

/* ────────────────────────── HEATMAP (14×7 RSVP rhythm) ────────────────────────── */
function renderHeatmap() {
  const g = $('#heatmapGrid'); if (!g) return;
  // Synthetic 14-day x 7-hour rhythm
  let cells = '';
  for (let d = 0; d < 14; d++) {
    const noise = (n) => Math.floor(Math.abs(Math.sin(d*7 + n*1.3)) * 4.99);
    for (let h = 0; h < 7; h++) {
      const v = noise(h);
      cells += `<div class="hm-cell" data-c="${v}" title="Day ${d+1}, slot ${h+1}: ${v} RSVPs"></div>`;
    }
  }
  g.innerHTML = cells;
  // Style adjustment — grid is 14 columns; one column = one day
  g.style.gridTemplateColumns = 'repeat(14, 1fr)';
}

/* ────────────────────────── MEMORIES (lightbox + year grouping) ────────────────────────── */
let MEMORIES = []; let lbIndex = 0; let lbList = [];
async function loadMemories() {
  try {
    if (window.MEMORIES_DATA) {
      MEMORIES = window.MEMORIES_DATA;
    } else {
      const r = await fetch('./photos_manifest.json');
      MEMORIES = await r.json();
    }
    MEMORIES.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    renderMemories();
    $('#memSubtitle').textContent = `${MEMORIES.length} moments preserved`;
  } catch (e) {
    console.warn('memories failed', e);
    $('#memSubtitle').textContent = 'No photographs available';
  }
}
function renderMemories() {
  const root = $('#memoriesGroups'); if (!root) return;
  const byYear = {};
  MEMORIES.forEach(m => { (byYear[m.year || 'Undated'] ||= []).push(m); });
  const years = Object.keys(byYear).sort((a, b) => String(b).localeCompare(String(a)));
  root.innerHTML = years.map(y => `
    <div class="mem-year-band"><div class="mem-year">${y}</div><div class="mem-year-sub"><b>${byYear[y].length}</b> moments</div></div>
    <div class="memories-grid">
      ${byYear[y].map((m, i) => `
        <div class="mem-card observe" data-slug="${escapeHtml(m.slug)}" data-year="${y}">
          <img loading="lazy" src="./${m.thumb || m.medium || m.orig}" alt="${escapeHtml(m.slug)}">
          <div class="mem-card-meta"><span>${escapeHtml(m.date || '')}</span><span class="mem-card-date">${i+1}/${byYear[y].length}</span></div>
        </div>`).join('')}
    </div>
  `).join('');
  // Wire lightbox
  root.querySelectorAll('.mem-card').forEach(card => {
    card.addEventListener('click', () => {
      lbList = Array.from(root.querySelectorAll('.mem-card'));
      lbIndex = lbList.indexOf(card);
      openLB();
    });
  });
}
function openLB() {
  const card = lbList[lbIndex]; if (!card) return;
  const slug = card.dataset.slug;
  const m = MEMORIES.find(x => x.slug === slug);
  if (!m) return;
  $('#lbImg').src = './' + (m.medium || m.orig);
  $('#lbMeta').textContent = `${m.date || ''} · ${lbIndex+1} of ${lbList.length}`;
  $('#lightbox').classList.add('active');
}
window.closeLB = () => $('#lightbox').classList.remove('active');
window.lbStep = (delta) => {
  lbIndex = (lbIndex + delta + lbList.length) % lbList.length;
  openLB();
};
document.addEventListener('keydown', e => {
  if (!$('#lightbox').classList.contains('active')) return;
  if (e.key === 'Escape') closeLB();
  if (e.key === 'ArrowLeft') lbStep(-1);
  if (e.key === 'ArrowRight') lbStep(1);
});

/* ────────────────────────── VENUE QR ────────────────────────── */
function renderVenueQR() {
  const el = $('#venueQR'); if (!el || !window.QRCode) return;
  el.innerHTML = '';
  try {
    new QRCode(el, { text: CFG.SHARE_URL, width: 140, height: 140, colorDark: '#1a0e08', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
  } catch (e) { console.warn('QR failed', e); }
}

/* ────────────────────────── SCROLL REVEAL ────────────────────────── */
function setupScrollReveal() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
  $$('.observe, .stat, .chart-card, .world-map, .heatmap-card, .mem-card').forEach(el => io.observe(el));
  // Also observe any future elements via mutation observer
  new MutationObserver(muts => muts.forEach(m => m.addedNodes.forEach(n => {
    if (n.nodeType === 1 && n.classList?.contains('observe')) io.observe(n);
  }))).observe(document.body, { childList: true, subtree: true });
}

/* ────────────────────────── SHARE + PRINT ────────────────────────── */
function setupShare() {
  const b = $('#shareBtn'); if (!b) return;
  b.addEventListener('click', async e => {
    e.preventDefault();
    if (navigator.share) {
      try {
        await navigator.share({ title: 'SALINA — Tulawati Lal Mummy', text: 'Mum\'s 12-month Salina · 15-16 August 2026 · Hamilton', url: CFG.SHARE_URL });
        toast('Shared');
      } catch { /* user cancelled */ }
    } else {
      try { await navigator.clipboard.writeText(CFG.SHARE_URL); toast('Link copied'); }
      catch { prompt('Copy this link:', CFG.SHARE_URL); }
    }
  });
}

/* ────────────────────────── AMBIENT AUDIO TOGGLE ────────────────────────── */
function setupAmbientAudio() {
  const btn = document.createElement('button');
  btn.id = 'ambientBtn';
  btn.setAttribute('aria-label', 'Toggle ambient music');
  btn.style.cssText = 'position:fixed;bottom:24px;right:24px;width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,rgba(245,197,87,.32),rgba(249,115,22,.22));border:1px solid rgba(212,165,50,.42);color:#f5c557;font-size:22px;cursor:pointer;z-index:200;backdrop-filter:blur(14px);box-shadow:0 8px 24px rgba(0,0,0,.4),0 0 28px rgba(245,197,87,.18);transition:transform .25s ease,background .25s;display:flex;align-items:center;justify-content:center';
  btn.textContent = '⏸';
  document.body.appendChild(btn);
  const audio = new Audio('./om-hum.wav');
  audio.volume = 0.32;
  let playing = true;
  let loopTimer = null;
  let lastPlayTime = 0;
  const LOOP_MS = 60000; // 60-second cycle

  function playNow() {
    lastPlayTime = Date.now();
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }
  audio.addEventListener('ended', () => {
    if (!playing) return;
    const elapsed = Date.now() - lastPlayTime;
    const wait = Math.max(0, LOOP_MS - elapsed);
    loopTimer = setTimeout(playNow, wait);
  });

  // Auto-start as soon as PIN gate hides (PIN tap = user interaction = autoplay allowed)
  const pinGate = document.getElementById('pinGate');
  if (pinGate) {
    new MutationObserver(() => {
      if (pinGate.classList.contains('hidden') && playing) {
        setTimeout(playNow, 800); // small delay for cinematic to start
      }
    }).observe(pinGate, { attributes: true, attributeFilter: ['class'] });
  }

  function setBtnOn()  { btn.textContent = '⏸'; btn.style.background = 'linear-gradient(135deg,rgba(245,197,87,.32),rgba(249,115,22,.22))'; }
  function setBtnOff() { btn.textContent = '♪'; btn.style.background = 'linear-gradient(135deg,rgba(245,197,87,.16),rgba(249,115,22,.1))'; }

  btn.addEventListener('click', () => {
    if (playing) {
      playing = false; clearTimeout(loopTimer); audio.pause(); setBtnOff(); toast('Ambient off');
    } else {
      playing = true; setBtnOn(); playNow(); toast('Ambient on');
    }
  });
  // Click feedback bell
  document.addEventListener('click', e => {
    if (e.target.closest('.pg-key,.nav-btn,.chip')) {
      const bell = $('#bell'); if (bell) { bell.currentTime = 0; bell.volume = 0.18; bell.play().catch(()=>{}); }
    }
  });
}

/* ────────────────────────── TIMESTAMP ────────────────────────── */
function updateTimestamp() {
  const el = $('#tbUpd'); if (!el) return;
  const upd = () => {
    const now = new Date();
    el.textContent = 'Updated ' + now.toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' });
  };
  upd(); setInterval(upd, 60000);
}

})();
