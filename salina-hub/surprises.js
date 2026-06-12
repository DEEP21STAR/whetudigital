/* SALINA Surprises — Light a Diya · Mum's age now · 5-tap easter egg · breathing background · whispered hover names */
(() => {
'use strict';
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

/* ──────────── Light a Diya — interactive memorial counter ──────────── */
function setupDiya() {
  if ($('#diyaWidget')) return;
  // Wait until app is ready
  if (!$('#app.ready')) { setTimeout(setupDiya, 500); return; }
  let count = parseInt(localStorage.getItem('salina_diya_count') || '0', 10);
  const last = parseInt(localStorage.getItem('salina_diya_last') || '0', 10);
  const widget = document.createElement('div');
  widget.id = 'diyaWidget';
  widget.style.cssText = `
    position:fixed; bottom:90px; left:24px; z-index:180;
    display:flex; align-items:center; gap:10px;
    padding:10px 16px; background:linear-gradient(135deg, rgba(245,197,87,.14), rgba(249,115,22,.08));
    border:1px solid rgba(245,197,87,.4); border-radius:999px;
    backdrop-filter: blur(14px); cursor:pointer; user-select:none;
    box-shadow: 0 6px 22px rgba(0,0,0,.4), 0 0 24px rgba(245,197,87,.18);
    font-family: var(--mono, monospace); font-size:11px; letter-spacing:1.5px;
    color: var(--gold2, #f5c557); text-transform:uppercase;
    transition: transform .25s var(--spring, cubic-bezier(.34,1.56,.64,1));
  `;
  widget.innerHTML = `
    <span id="diyaFlame" style="font-size:22px; display:inline-block; animation: diyaFlicker 1.6s ease-in-out infinite; transform-origin:center bottom; filter: drop-shadow(0 0 14px rgba(249,115,22,.7))">🪔</span>
    <span>Light a diya · <b id="diyaCount" style="font-family:var(--serif,serif); font-size:18px; color:var(--gold3,#fff3d6); letter-spacing:.5px">${count}</b> lit</span>
  `;
  document.body.appendChild(widget);
  // Flicker keyframes
  if (!$('#diyaKf')) {
    const s = document.createElement('style');
    s.id = 'diyaKf';
    s.textContent = `
      @keyframes diyaFlicker {
        0%,100% { transform: scale(1) rotate(-1deg); filter: drop-shadow(0 0 14px rgba(249,115,22,.8)) }
        25% { transform: scale(1.08) rotate(2deg); filter: drop-shadow(0 0 22px rgba(245,197,87,.95)) }
        50% { transform: scale(.96) rotate(-2deg); filter: drop-shadow(0 0 18px rgba(249,115,22,.7)) }
        75% { transform: scale(1.04) rotate(1deg); filter: drop-shadow(0 0 24px rgba(245,197,87,.9)) }
      }
      @keyframes diyaBurst {
        0% { transform: scale(1); }
        50% { transform: scale(1.35) rotate(8deg); filter: drop-shadow(0 0 40px rgba(249,115,22,1)); }
        100% { transform: scale(1) rotate(0); }
      }
    `;
    document.head.appendChild(s);
  }
  widget.addEventListener('click', () => {
    count++;
    localStorage.setItem('salina_diya_count', count);
    localStorage.setItem('salina_diya_last', Date.now());
    $('#diyaCount').textContent = count;
    const flame = $('#diyaFlame');
    flame.style.animation = 'none';
    void flame.offsetWidth; // reflow
    flame.style.animation = 'diyaBurst .6s ease-out, diyaFlicker 1.6s ease-in-out infinite .6s';
    // Floating "+1" 🪔 effect
    const float = document.createElement('div');
    float.textContent = '🪔';
    float.style.cssText = `
      position:fixed; left:${widget.getBoundingClientRect().left + 14}px;
      top:${widget.getBoundingClientRect().top - 10}px;
      z-index:181; font-size:24px; pointer-events:none;
      animation: diyaFloatUp 1.6s ease-out forwards;
    `;
    document.body.appendChild(float);
    setTimeout(() => float.remove(), 1700);
    if (!$('#diyaFloatKf')) {
      const s2 = document.createElement('style');
      s2.id = 'diyaFloatKf';
      s2.textContent = '@keyframes diyaFloatUp { 0%{opacity:1; transform:translateY(0) scale(1)} 100%{opacity:0; transform:translateY(-80px) scale(1.4)} }';
      document.head.appendChild(s2);
    }
    // Milestone toast
    if (count % 10 === 0 && window.wuToast) {
      window.wuToast(`✨ ${count} diyas lit in Mum's memory`);
    }
  });
}
setTimeout(setupDiya, 1500);

/* ──────────── Mum's age now indicator (next to countdown) ──────────── */
function setupAgeIndicator() {
  // Show "She would be turning XX this year" in the cinematic dates line if applicable
  const cd = $('.countdown-banner .cd-left');
  if (!cd || $('#mumAgeNow')) return;
  const born = new Date('1946-01-02');
  const ref = new Date('2026-01-02');
  let age = ref.getFullYear() - born.getFullYear();
  const note = document.createElement('div');
  note.id = 'mumAgeNow';
  note.style.cssText = `
    font-family: var(--mono); font-size: 9.5px; letter-spacing: 2.5px;
    color: var(--gold2); text-transform: uppercase; margin-top: 8px; opacity: .7;
    border-top: 1px dashed rgba(212,165,50,.18); padding-top: 6px;
  `;
  note.innerHTML = `Mum would be <b style="font-family:var(--serif);font-size:14px;color:var(--gold3);font-weight:600">${age}</b> this year · forever in our hearts`;
  cd.appendChild(note);
}
setTimeout(setupAgeIndicator, 1200);

/* ──────────── Easter egg: 5-tap on brand mark = surprise slideshow ──────────── */
(function brandTap() {
  const wait = () => {
    const mark = $('.brand-mark');
    if (!mark) { setTimeout(wait, 500); return; }
    let taps = 0; let lastTap = 0;
    mark.addEventListener('click', () => {
      const now = Date.now();
      if (now - lastTap > 700) taps = 0;
      taps++; lastTap = now;
      if (taps >= 5) {
        taps = 0;
        if (window.wuToast) window.wuToast('✨ Mum\'s memories slideshow…');
        if (typeof window.salinaShowRandomMemory === 'function') {
          window.salinaShowRandomMemory();
          // Cycle 5 more random memories every 4s
          let n = 0;
          const ivl = setInterval(() => {
            const m = $('#memOfMomentModal'); if (m) m.remove();
            window.salinaShowRandomMemory();
            if (++n >= 5) { clearInterval(ivl); }
          }, 5000);
        }
      }
    });
  };
  wait();
})();

/* ──────────── Whispered hover names ──────────── */
function softHoverNames() {
  // Add a soft outline glow when hovering over guest names
  if ($('#hoverNamesKf')) return;
  const s = document.createElement('style');
  s.id = 'hoverNamesKf';
  s.textContent = `
    .gl-name:hover, .mdp-rsvp-name:hover, .mdp-invite-name:hover {
      text-shadow: 0 0 10px rgba(245,197,87,.4);
      transition: text-shadow .3s ease;
    }
  `;
  document.head.appendChild(s);
}
softHoverNames();

/* ──────────── Breathing aurora — orbs gently react to scroll ──────────── */
addEventListener('scroll', () => {
  const y = scrollY;
  $$('.orb').forEach((o, i) => {
    o.style.transform = `translateY(${y * 0.05 * (i + 1) * 0.3}px)`;
  });
}, { passive: true });

/* ──────────── Cinematic "Today" line near countdown — show date ──────────── */
function showToday() {
  const banner = $('.countdown-banner');
  if (!banner || $('#todayBadge')) return;
  const today = new Date().toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long' });
  const badge = document.createElement('div');
  badge.id = 'todayBadge';
  badge.style.cssText = `
    position:absolute; top:14px; right:18px; z-index:1;
    font-family: var(--mono); font-size: 9px; letter-spacing: 2.5px;
    color: var(--text2); text-transform: uppercase; opacity: .55;
  `;
  badge.textContent = today;
  banner.appendChild(badge);
}
setTimeout(showToday, 800);

})();
