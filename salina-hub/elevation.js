/* SALINA Elevation — cinematic depth, Bapu-friendly UX, surprise extras */
(() => {
'use strict';

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

/* ──────────────────────────────────────────────────────────
   A. FORCE-RENDER FIX — Overview shouldn't be invisible
   The .stat / .chart-card / .world-map / .heatmap-card have
   opacity:0 by default waiting for IntersectionObserver to
   add .visible. Belt-and-braces: also add .visible on a small
   delay so even if IO never fires, the content shows.
────────────────────────────────────────────────────────── */
function forceReveal() {
  $$('.stat, .chart-card, .world-map, .heatmap-card, .mem-card, .observe').forEach(el => {
    el.classList.add('visible');
  });
}
// Run repeatedly during initial period to catch elements added by render functions
let revealTicks = 0;
const revealLoop = setInterval(() => {
  forceReveal();
  if (++revealTicks > 30) clearInterval(revealLoop); // ~6 seconds total
}, 200);

/* ──────────────────────────────────────────────────────────
   B. CINEMATIC MEMORIES
   - Auto-play slideshow toggle
   - Ken Burns drift on visible memory cards
   - Year banners parallax
   - Lightbox: slow-zoom, ambient swell when shown
────────────────────────────────────────────────────────── */
function enhanceMemories() {
  const root = $('#memoriesGroups');
  if (!root) return;
  // Add a slideshow button if not already there
  if ($('#memSlideshowBtn')) return;
  const subtitle = $('#memSubtitle');
  if (!subtitle) return;
  const head = subtitle.parentElement.parentElement;
  const ctrl = document.createElement('div');
  ctrl.className = 'mem-controls';
  ctrl.style.cssText = 'display:flex;gap:10px;justify-content:flex-end;margin-top:8px;flex-wrap:wrap';
  ctrl.innerHTML = `
    <button id="memSlideshowBtn" class="mdp-btn">▶ Cinematic slideshow</button>
    <button id="memShuffleBtn" class="mdp-btn">🔀 Memory of the moment</button>
  `;
  head.appendChild(ctrl);
  $('#memSlideshowBtn').addEventListener('click', startSlideshow);
  $('#memShuffleBtn').addEventListener('click', showRandomMemoryCard);

  // Apply Ken Burns drift to each .mem-card img
  $$('.mem-card img').forEach((img, i) => {
    img.style.transition = 'transform 12s ease-in-out';
    img.style.transformOrigin = ['top left','top right','bottom left','bottom right','center'][i % 5];
    setTimeout(() => { img.style.transform = 'scale(1.08)'; }, 200 + i*30);
  });
}

let slideshowTimer = null;
let slideshowIdx = 0;
function startSlideshow() {
  const cards = $$('.mem-card');
  if (!cards.length) return;
  if (slideshowTimer) { stopSlideshow(); return; }
  $('#memSlideshowBtn').textContent = '⏸ Pause slideshow';
  // Boot ambient music if available + open lightbox
  cards[slideshowIdx].click();
  slideshowTimer = setInterval(() => {
    slideshowIdx = (slideshowIdx + 1) % cards.length;
    // Use lbStep through the existing lightbox
    if (typeof window.lbStep === 'function') {
      window.lbStep(1);
    } else {
      cards[slideshowIdx].click();
    }
  }, 5000);
}
function stopSlideshow() {
  if (slideshowTimer) { clearInterval(slideshowTimer); slideshowTimer = null; }
  const b = $('#memSlideshowBtn'); if (b) b.textContent = '▶ Cinematic slideshow';
}
// Stop slideshow when lightbox closes
const origCloseLB = window.closeLB;
window.closeLB = function() {
  stopSlideshow();
  if (origCloseLB) origCloseLB();
};

/* ──────────────────────────────────────────────────────────
   C. RANDOM MEMORY OF THE MOMENT floating card on Overview
────────────────────────────────────────────────────────── */
function showRandomMemoryCard() {
  const mems = window.MEMORIES_DATA || [];
  if (!mems.length) return;
  const m = mems[Math.floor(Math.random() * mems.length)];
  // Build modal
  let modal = $('#memOfMomentModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'memOfMomentModal';
    modal.style.cssText = `
      position:fixed;inset:0;z-index:9450;background:rgba(0,0,0,.94);display:flex;
      align-items:center;justify-content:center;flex-direction:column;gap:18px;padding:28px;
      backdrop-filter:blur(20px);animation:lbIn .5s ease-out;cursor:pointer
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', () => modal.remove());
  }
  modal.innerHTML = `
    <div style="font-family:var(--mono,monospace);font-size:11px;color:var(--gold2,#f5c557);letter-spacing:4px;text-transform:uppercase;animation:cineUp 1s ease-out forwards;opacity:0">A memory of Mum</div>
    <img src="./${m.medium || m.thumb || m.orig}" style="max-width:84vw;max-height:64vh;border-radius:16px;box-shadow:0 30px 80px rgba(0,0,0,.7),0 0 100px rgba(245,197,87,.2);animation:memInScale 1.4s var(--ease,ease-out) forwards;opacity:0;transform:scale(.92)" alt="">
    <div style="font-family:var(--serif,serif);font-size:clamp(16px,2.2vw,22px);color:var(--gold3,#fff3d6);font-style:italic;letter-spacing:.5px;animation:cineUp 1.2s ease-out .8s forwards;opacity:0">${m.date || ''}</div>
    <div style="font-family:var(--mono,monospace);font-size:10px;color:var(--muted,#7a6754);letter-spacing:3px;text-transform:uppercase;animation:cineUp 1s ease-out 1.6s forwards;opacity:0">Click anywhere to dismiss</div>
  `;
  // Add the keyframe if not present
  if (!$('#memInScaleKf')) {
    const s = document.createElement('style');
    s.id = 'memInScaleKf';
    s.textContent = '@keyframes memInScale {0%{opacity:0;transform:scale(.88)}100%{opacity:1;transform:scale(1)}}';
    document.head.appendChild(s);
  }
}
window.salinaShowRandomMemory = showRandomMemoryCard;

/* ──────────────────────────────────────────────────────────
   D. CINEMATIC INTRO MUM'S BIRTHDATE (in cine-dates element)
   Display her birthdate + age years she touched lives
────────────────────────────────────────────────────────── */
function enhanceCinematic() {
  const dates = $('.cine-dates');
  if (dates && !dates.dataset.enhanced) {
    dates.dataset.enhanced = '1';
    dates.innerHTML = '02 January 1946 — 28 August 2025 · 79 years of love · Salina 15-16 August 2026';
  }
}

/* ──────────────────────────────────────────────────────────
   E. BAPU UX in Mandap — panel descriptions + greeting
────────────────────────────────────────────────────────── */
function bapuFriendly() {
  // Add a friendly greeting line when Mandap unlocks
  const hero = $('.mdp-hero');
  if (hero && !$('#mdpGreeting')) {
    const greet = document.createElement('div');
    greet.id = 'mdpGreeting';
    greet.style.cssText = `
      margin-top:14px;padding:14px 18px;background:rgba(245,197,87,.06);
      border:1px solid rgba(245,197,87,.2);border-radius:12px;
      font-family:var(--serif,serif);font-size:15px;color:var(--gold3,#fff3d6);
      font-style:italic;letter-spacing:.3px;line-height:1.5;position:relative;z-index:1
    `;
    const who = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('mandap_who')) || 'parivaar';
    const friendlyName = (who === 'Bapu') ? 'Bapu' : (who === 'Deep' ? 'Deep' : who);
    const intro = (who === 'Bapu')
      ? `Namaste Bapu 🙏 — this is your private area to manage Mum\'s Salina. Below you have four panels:`
      : `Namaste ${friendlyName} — your sanctum below. Four panels for everything:`;
    greet.innerHTML = `${intro}
      <ul style="margin:10px 0 0 18px;font-family:var(--sans,sans-serif);font-style:normal;font-size:13px;color:var(--text,#f0e6d3);line-height:1.7">
        <li><b style="color:var(--gold2,#f5c557)">RSVP Tracker</b> — tap any person to change if they\'re coming (Pending → Confirmed → Maybe → Call → Declined).</li>
        <li><b style="color:var(--gold2,#f5c557)">Invitation Links</b> — get each guest\'s personal link to send by WhatsApp, email, or QR code.</li>
        <li><b style="color:var(--gold2,#f5c557)">Activity Log</b> — see what you and Deep have done today.</li>
        <li><b style="color:var(--gold2,#f5c557)">Settings · Export</b> — change PINs, event details, download the guest list.</li>
      </ul>`;
    hero.appendChild(greet);
  }
}
// Hook into Mandap unlock — observe section becoming active
const mandapObs = new MutationObserver(() => {
  if ($('#mandap.active')) bapuFriendly();
});
mandapObs.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });

/* ──────────────────────────────────────────────────────────
   F. SECTION TRANSITIONS — slide in (was just opacity)
────────────────────────────────────────────────────────── */
const sectionTransitionCSS = `
  section.section{opacity:0;transform:translateY(14px);transition:opacity .55s cubic-bezier(.22,1,.36,1),transform .55s cubic-bezier(.22,1,.36,1)}
  section.section.active{display:block;opacity:1;transform:translateY(0);animation:sectionIn .65s cubic-bezier(.22,1,.36,1)}
  @keyframes sectionIn{0%{opacity:0;transform:translateY(24px) scale(.99)}100%{opacity:1;transform:translateY(0) scale(1)}}
`;
const ssTag = document.createElement('style');
ssTag.textContent = sectionTransitionCSS;
document.head.appendChild(ssTag);

/* ──────────────────────────────────────────────────────────
   G. AUDIO CHIMES on important events
────────────────────────────────────────────────────────── */
function tinyChime(freq=820, dur=0.18, gain=0.06) {
  try {
    const ac = window._salinaAC || (window._salinaAC = new (window.AudioContext || window.webkitAudioContext)());
    const o = ac.createOscillator(); const g = ac.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.value = gain;
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    o.connect(g).connect(ac.destination);
    o.start(); o.stop(ac.currentTime + dur);
  } catch {}
}
// Chime on PIN unlock (family + admin)
document.addEventListener('click', e => {
  if (e.target.closest('.pg-key, .mdp-pad-key')) {
    tinyChime(720, 0.08, 0.025);
  }
});

/* ──────────────────────────────────────────────────────────
   H. AMBIENT BOOT — show "Memory of the moment" 4s after app loads
────────────────────────────────────────────────────────── */
function appReadyHook() {
  if (window._salinaMomShown) return;
  setTimeout(() => {
    if ($('#app.ready') && (window.MEMORIES_DATA || []).length && !$('#memOfMomentModal')) {
      window._salinaMomShown = true;
      showRandomMemoryCard();
    }
  }, 4500);
}
new MutationObserver(() => { if ($('#app.ready')) appReadyHook(); })
  .observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });

/* ──────────────────────────────────────────────────────────
   I. WORLD MAP fallback if empty
────────────────────────────────────────────────────────── */
function checkWorldMap() {
  const wrap = $('#worldMapWrap');
  if (!wrap) return;
  if (!wrap.innerHTML.trim() && typeof window.GUESTS_DATA !== 'undefined') {
    // Try kicking off a re-render
    const placeholder = document.createElement('div');
    placeholder.style.cssText = 'padding:48px;text-align:center;color:var(--text2,#c9b89a);font-family:var(--mono,monospace);font-size:12px;letter-spacing:2px;text-transform:uppercase';
    placeholder.textContent = 'Map building…';
    wrap.appendChild(placeholder);
  }
}
setTimeout(checkWorldMap, 2500);

/* ──────────────────────────────────────────────────────────
   J. MEMORIES ENHANCEMENTS on first memories section view
────────────────────────────────────────────────────────── */
const memObs = new MutationObserver(() => {
  if ($('#memories.active')) {
    setTimeout(enhanceMemories, 100);
    memObs.disconnect();
  }
});
memObs.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });

// Apply cinematic enhance soon after DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', enhanceCinematic);
} else { enhanceCinematic(); }

})();
