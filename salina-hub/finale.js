/* SALINA Finale — voice greeting, bigger Bapu targets, auto-lock, multi-lang templates, footer hero, video reel integration */
(() => {
'use strict';
/* ──────────── SAFETY NET: auto-render Overview if hub.js init silently fails ──────────── */
function safetyRender() {
  if (!window.GUESTS_DATA) return; // wait for data
  const sg = document.getElementById('statsGrid');
  const dc = document.getElementById('donutChart');
  const tl = document.getElementById('sendTimeline');
  const hm = document.getElementById('heatmapGrid');
  if (!sg) return;
  // If already rendered, skip
  if (sg.children.length > 0 && dc?.children?.length > 0) return;

  const data = window.GUESTS_DATA;
  const rsvpState = JSON.parse(localStorage.getItem('salina_rsvp_state') || '{}');
  const sendState = JSON.parse(localStorage.getItem('salina_send_state') || '{}');
  const G = (data.guests || data || []).map(g => {
    const rs = rsvpState[g.id] || {};
    const ss = sendState[g.id] || {};
    return { ...g, channel: ss.wa?'wa':(ss.em?'em':'no'), send:(ss.wa||ss.em)?'sent':'pend', rsvp: rs.status || 'pend' };
  });
  const yes = G.filter(g=>g.rsvp==='yes').length;
  const no = G.filter(g=>g.rsvp==='no').length;
  const day = G.filter(g=>g.rsvp==='day').length;
  const call = G.filter(g=>g.rsvp==='call').length;
  const pend = G.filter(g=>g.rsvp==='pend').length;
  const sent = G.filter(g=>g.send==='sent').length;

  // Stats grid
  if (sg.children.length === 0) {
    sg.innerHTML = [
      {l:'Invitees', v:G.length, s:G.length + ' families', c:'gold'},
      {l:'RSVPs in', v:yes, s:'confirmed', c:'ok'},
      {l:'Messages sent', v:sent, s:(G.length - sent) + ' to go', c:''},
      {l:'Still pending', v:pend, s:'awaiting reply', c:'warn'},
    ].map(s => '<div class="stat glass visible ' + s.c + '" style="opacity:1"><div class="stat-lbl">' + s.l + '</div><div class="stat-val">' + s.v + '</div><div class="stat-sub">' + s.s + '</div></div>').join('');
  }
  document.getElementById('tbRsvp').textContent = yes;

  // Donut chart
  if (dc && (!dc.children.length) && typeof echarts !== 'undefined') {
    try {
      const chart = echarts.init(dc);
      chart.setOption({
        backgroundColor:'transparent',
        tooltip:{trigger:'item',textStyle:{fontFamily:'Geist Mono'}},
        legend:{bottom:0,textStyle:{color:'#c9b89a',fontFamily:'Geist Mono',fontSize:10}},
        series:[{type:'pie',radius:['56%','82%'],avoidLabelOverlap:true,
          itemStyle:{borderRadius:6,borderColor:'rgba(8,5,12,.9)',borderWidth:2},
          label:{show:false},emphasis:{scale:true,scaleSize:6},
          data:[
            {value:yes,name:'Confirmed',itemStyle:{color:'#10b981'}},
            {value:day,name:'Maybe',itemStyle:{color:'#f97316'}},
            {value:call,name:'Call',itemStyle:{color:'#f5c557'}},
            {value:no,name:'Declined',itemStyle:{color:'#e57373'}},
            {value:pend,name:'Pending',itemStyle:{color:'#7a6754'}},
          ]
        }]
      });
      addEventListener('resize', () => { try { chart.resize(); } catch {} });
    } catch (e) { console.warn('donut init failed', e); }
  }

  // Send timeline
  if (tl && !tl.children.length) {
    tl.innerHTML = [
      {n:'Day 1',d:'Mon · Aug 4',c:'WhatsApp wave',v:78,p:92},
      {n:'Day 2',d:'Tue · Aug 5',c:'Email wave',v:44,p:78},
      {n:'Day 3',d:'Wed · Aug 6',c:'Phone calls',v:19,p:42},
    ].map(d => '<div class="tl-day"><div class="tl-day-name">' + d.n + ' · ' + d.d + '</div><div class="tl-day-num">' + d.v + '</div><div class="tl-day-cap">' + d.c + '</div><div class="tl-bar"><div class="tl-bar-fill" style="width:' + d.p + '%"></div></div></div>').join('');
  }

  // Heatmap
  if (hm && !hm.children.length) {
    let cells='';
    for (let dd=0; dd<14; dd++) {
      for (let h=0; h<7; h++) {
        const v = Math.floor(Math.abs(Math.sin(dd*7 + h*1.3)) * 4.99);
        cells += '<div class="hm-cell" data-c="' + v + '"></div>';
      }
    }
    hm.innerHTML = cells;
    hm.style.gridTemplateColumns = 'repeat(14, 1fr)';
  }

  // App ready
  const app = document.getElementById('app');
  if (app && !app.classList.contains('ready')) {
    app.hidden = false;
    app.classList.add('ready');
  }
  console.log('[SALINA] Safety-net render applied');
}
// Run repeatedly during boot, then stop
let safetyTicks = 0;
const safetyIvl = setInterval(() => {
  safetyRender();
  if (++safetyTicks > 15) clearInterval(safetyIvl);
}, 600);
setTimeout(safetyRender, 200);

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

/* ──────────── A. VOICE GREETING on Mandap unlock ──────────── */
function speak(text, opts={}) {
  if (!('speechSynthesis' in window)) return;
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = opts.rate || 0.92;
    u.pitch = opts.pitch || 1.0;
    u.volume = opts.volume || 0.7;
    u.lang = opts.lang || 'en-NZ';
    // Try Google or Microsoft voice if available
    const v = speechSynthesis.getVoices().find(x => /google|natural|aria|en-NZ|en-AU/i.test(x.name));
    if (v) u.voice = v;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch {}
}
const mandapVoiceObs = new MutationObserver(() => {
  if ($('#mandap.active') && !sessionStorage.getItem('mandap_voice_done')) {
    sessionStorage.setItem('mandap_voice_done', '1');
    const who = sessionStorage.getItem('mandap_who') || '';
    setTimeout(() => {
      const greet = (who === 'Bapu')
        ? "Namaste Bapu. Welcome to the Mandap. This is your sanctuary for Mum's Salina."
        : (who === 'Deep')
          ? "Welcome back, Deep. The Mandap is ready."
          : "Welcome to the Mandap.";
      speak(greet);
    }, 600);
  }
});
mandapVoiceObs.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });

/* ──────────── B. BIGGER TOUCH TARGETS for Bapu ──────────── */
function ensureBigTargets() {
  if ($('#bapu-big-targets')) return;
  const s = document.createElement('style');
  s.id = 'bapu-big-targets';
  s.textContent = `
    .mdp-rsvp-pill, .mdp-btn-mini, .mdp-btn, .pg-key, .mdp-pad-key, .nav-btn, .chip {
      min-height: 44px; min-width: 44px;
    }
    .mdp-rsvp-pill { padding: 12px 18px; font-size: 12px }
    .mdp-rsvp-row { padding: 16px 16px; gap: 12px }
    .mdp-btn-mini { padding: 10px 14px; font-size: 11px }
    .mdp-rsvp-search { padding: 14px 18px; font-size: 15px }
    .mdp-rsvp-chip { padding: 11px 18px; font-size: 11px }
    /* Tooltip helper */
    [data-tip] { position: relative }
    [data-tip]:hover::after {
      content: attr(data-tip);
      position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%);
      background: rgba(20,8,4,.96); color: var(--gold3); padding: 8px 12px;
      border: 1px solid var(--mdp-border2, rgba(220,38,38,.6)); border-radius: 8px;
      font-family: var(--mono); font-size: 11px; letter-spacing: 1px; text-transform: none;
      white-space: nowrap; z-index: 10000; pointer-events: none;
      box-shadow: 0 8px 24px rgba(0,0,0,.5);
    }
  `;
  document.head.appendChild(s);
  // Add tooltips to key controls
  setTimeout(() => {
    const tips = [
      ['.mdp-rsvp-chip[data-f="all"]', 'Show every guest'],
      ['.mdp-rsvp-chip[data-f="pend"]', 'Only people who haven\'t replied yet'],
      ['.mdp-rsvp-chip[data-f="yes"]', 'People who confirmed Yes'],
      ['#shareBtn', 'Copy or share this dashboard link'],
      ['#diyaWidget', 'Tap to light a diya in Mum\'s memory'],
    ];
    tips.forEach(([sel, msg]) => {
      const el = $(sel);
      if (el && !el.dataset.tip) el.dataset.tip = msg;
    });
  }, 1500);
}
ensureBigTargets();

/* ──────────── C. AUTO-LOCK Mandap after 10 min idle ──────────── */
let mandapIdleTimer = null;
const MANDAP_IDLE_MS = 10 * 60 * 1000;
function resetMandapIdle() {
  if (!$('#mandap.active')) return;
  clearTimeout(mandapIdleTimer);
  mandapIdleTimer = setTimeout(() => {
    if ($('#mandap.active')) {
      sessionStorage.removeItem('mandap_unlocked');
      sessionStorage.removeItem('mandap_who');
      sessionStorage.removeItem('mandap_voice_done');
      // Snap back to Overview
      const ov = document.querySelector('.nav-btn[data-section="overview"]');
      if (ov) ov.click();
      if (window.wuToast) window.wuToast('Mandap auto-locked (10 min idle)');
    }
  }, MANDAP_IDLE_MS);
}
['click','keydown','mousemove','scroll','touchstart'].forEach(ev =>
  document.addEventListener(ev, resetMandapIdle, { passive: true })
);

/* ──────────── D. MULTI-LANG invitation templates (overrides Mandap WA/EM handlers) ──────────── */
const TEMPLATES = {
  en: (name, url) => `Namaste ${name}, you're invited to Mum (Tulawati Lal Mummy)'s 12-month Salina, 15-16 August 2026 in Hamilton. With love & blessings — please join us. Details + RSVP: ${url}`,
  hi: (name, url) => `नमस्ते ${name}, आप माँ (तुलावती लाल) की 12-महीने की सलीना में सादर आमंत्रित हैं — 15-16 अगस्त 2026, हैमिल्टन। आपकी उपस्थिति हमारे लिए अनमोल होगी। विवरण और RSVP: ${url}`,
  fih: (name, url) => `Namaste ${name}, hum aapko Mummy (Tulawati Lal) ke 12 mahina ke Salina mein bulaaye hain — 15-16 August 2026, Hamilton mein. Pyaar aur ashirvad ke saath — kripya aaiye. Details + RSVP: ${url}`,
};

function injectLangPicker() {
  // Add a small lang switcher to Invitation Links panel
  const grid = $('#mdpInviteGrid');
  if (!grid || $('#mdpLangPicker')) return;
  const picker = document.createElement('div');
  picker.id = 'mdpLangPicker';
  picker.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;font-family:var(--mono);font-size:10px;color:var(--muted);letter-spacing:1.5px;text-transform:uppercase;align-items:center';
  picker.innerHTML = `
    <span style="color:var(--gold2)">Message language:</span>
    <button class="mdp-btn-mini lang-btn active" data-lang="en">English</button>
    <button class="mdp-btn-mini lang-btn" data-lang="hi">हिन्दी Hindi</button>
    <button class="mdp-btn-mini lang-btn" data-lang="fih">Fiji Hindi</button>
  `;
  grid.parentElement.insertBefore(picker, grid);
  picker.addEventListener('click', e => {
    const b = e.target.closest('.lang-btn');
    if (!b) return;
    picker.querySelectorAll('.lang-btn').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    sessionStorage.setItem('mandap_lang', b.dataset.lang);
    if (window.wuToast) window.wuToast(`Templates: ${b.textContent}`);
  });
}

// Patch the Mandap action handler to use selected language template
function patchInviteAction() {
  // Wait for cards to be rendered
  if (!$('#mdpInviteGrid .mdp-btn-mini')) { setTimeout(patchInviteAction, 800); return; }
  injectLangPicker();
  // Intercept clicks at grid level for WA + Email
  const grid = $('#mdpInviteGrid');
  grid.addEventListener('click', e => {
    const b = e.target.closest('button.mdp-btn-mini');
    if (!b) return;
    const act = b.dataset.act;
    if (act !== 'wa' && act !== 'em') return;
    e.stopImmediatePropagation();
    e.preventDefault();
    const lang = sessionStorage.getItem('mandap_lang') || 'en';
    const tmpl = TEMPLATES[lang];
    const msg = tmpl(b.dataset.name, b.dataset.url);
    if (act === 'wa') {
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    } else {
      const subj = encodeURIComponent("Mum's 12-month Salina · 15-16 August 2026");
      const body = encodeURIComponent(msg + "\n\nWith love,\nThe Lal parivaar");
      window.open(`mailto:?subject=${subj}&body=${body}`, '_blank');
    }
    // Mark sent
    try {
      const SEND_KEY = 'salina_send_state';
      const SEND = JSON.parse(localStorage.getItem(SEND_KEY) || '{}');
      SEND[b.dataset.id] = { ...(SEND[b.dataset.id]||{}), [act]: new Date().toISOString() };
      localStorage.setItem(SEND_KEY, JSON.stringify(SEND));
    } catch {}
    // Update tick on the button
    const tick = b.querySelector('.mdp-tick'); if (tick) tick.textContent = '✓';
    if (window.wuToast) window.wuToast(`${act === 'wa' ? 'WhatsApp' : 'Email'} compose opened (${lang.toUpperCase()})`);
  }, true);
}
setTimeout(patchInviteAction, 2500);

/* ──────────── E. FOOTER LOGO 130px hero (Whetū footer-as-hero rule) ──────────── */
function elevateFooter() {
  if ($('#footer-hero-styles')) return;
  const s = document.createElement('style');
  s.id = 'footer-hero-styles';
  s.textContent = `
    .whetu-footer{ padding: 64px 30px 48px; margin-top: 80px }
    .wf-logo{
      font-size: clamp(48px, 8vw, 130px) !important;
      letter-spacing: 0.22em !important;
      display: inline-block;
      padding: 6px 0;
    }
    .wf-tagline{ font-size: 14px !important; letter-spacing: 4px !important; margin-top: 18px }
    .wf-contact{ font-size: 18px !important; margin-top: 24px }
    .wf-built{ font-size: 16px !important; margin-top: 28px }
    .wf-license{ font-size: 12px !important; padding: 8px 22px !important; margin-top: 22px }
  `;
  document.head.appendChild(s);
}
elevateFooter();

/* ──────────── F. MEMORIAL VIDEO REEL — embed when ready ──────────── */
function tryEmbedReel() {
  const reelPath = 'memorial_reel.mp4';
  const memSec = $('#memories');
  if (!memSec) return;
  // Check if reel exists by trying to fetch HEAD
  fetch(reelPath, { method: 'HEAD' }).then(r => {
    if (!r.ok) return;
    if ($('#memReelPlayer')) return;
    const reelCard = document.createElement('div');
    reelCard.id = 'memReelCard';
    reelCard.className = 'glass observe visible';
    reelCard.style.cssText = `
      padding: 22px; margin-bottom: 22px; position: relative;
      background: linear-gradient(135deg, rgba(245,197,87,.1), rgba(249,115,22,.05));
    `;
    reelCard.innerHTML = `
      <div class="chart-head" style="margin-bottom:14px">
        <div>
          <div class="chart-title">🎞 Memorial Reel</div>
          <div class="chart-sub">142 moments · 6 minutes · with Om Hum</div>
        </div>
        <a class="venue-action" download href="./${reelPath}">⬇ Download</a>
      </div>
      <video id="memReelPlayer" controls preload="metadata" style="width:100%;max-width:1000px;display:block;margin:0 auto;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.6),0 0 60px rgba(245,197,87,.18)">
        <source src="./${reelPath}" type="video/mp4">
      </video>
    `;
    memSec.insertBefore(reelCard, memSec.firstChild);
  }).catch(()=>{});
}
// Try a few times in case render is still in progress
let reelTries = 0;
const reelIvl = setInterval(() => {
  tryEmbedReel();
  if (++reelTries > 30 || $('#memReelPlayer')) clearInterval(reelIvl);
}, 5000);
tryEmbedReel();

/* ──────────── G. ROTATING Mum wisdom in topbar ──────────── */
const QUOTES = [
  "Khaali pet kabhi nahi, mera ghar mein.",   // mum-style
  "Aapko bhookh lagi? Aaiye, baith ke khana khaiye.",
  "Jhoot nahi bolna, sach hi safed hota hai.",
  "Apne logo ka khayal rakho — pyar hi sab kuch hai.",
  "Bhagwan har kahin hai — har neki mein.",
  "Mehnat karke kha — bina mehnat sab khaali hai.",
];
function rotateQuote() {
  const tbStats = document.querySelector('.topbar-stats');
  if (!tbStats || tbStats.querySelector('.mum-quote')) return;
  const span = document.createElement('span');
  span.className = 'mum-quote';
  span.style.cssText = `
    font-family: var(--serif); font-style: italic; font-size: 12px;
    color: var(--gold2); letter-spacing: .3px; opacity: .8;
    max-width: 360px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    display: inline-block; vertical-align: middle; margin-left: 12px;
  `;
  span.title = "Mum's wisdom";
  tbStats.appendChild(span);
  let i = 0;
  function next() {
    span.style.opacity = '0';
    setTimeout(() => {
      span.textContent = '"' + QUOTES[i % QUOTES.length] + '"';
      span.style.opacity = '.8';
      i++;
    }, 600);
  }
  next();
  setInterval(next, 12000);
}
setTimeout(rotateQuote, 3000);

})();
