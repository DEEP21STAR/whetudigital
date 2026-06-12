/* SALINA Mandap — admin sanctum for Bapu + Deep
   PIN: 1946 (shared). RSVP CRUD, invitation links, bulk send, settings, activity log, CSV export. */
(() => {
'use strict';
const MANDAP_PIN = (window.salinaCfg && window.salinaCfg.ADMIN_PIN) || localStorage.getItem('salina_admin_pin') || '1946';
const RSVP_KEY = 'salina_rsvp_state';
const SEND_KEY = 'salina_send_state';
const LOG_KEY  = 'salina_admin_log';
const SETTINGS_KEY = 'salina_admin_settings';

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toast = m => { if (window.wuToast) window.wuToast(m); else console.log(m); };

/* ─────────── STATE ─────────── */
function loadJson(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function saveJson(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
let RSVP_STATE = loadJson(RSVP_KEY, {});      // {guestId: {status, ts, by}}
let SEND_STATE = loadJson(SEND_KEY, {});      // {guestId: {wa: ts, em: ts}}
let ADMIN_LOG  = loadJson(LOG_KEY, []);       // [{ts, who, action, detail}]
let SETTINGS   = loadJson(SETTINGS_KEY, {
  eventDate: '2026-08-15T18:30:00+12:00',
  venue: '14 Beaumont Street, Hamilton East, Hamilton 3216',
  phone: '+64212935401',
  ambientVol: 0.32,
});
let WHO = null;  // 'Bapu' or 'Deep' depending on which PIN entered (TODO multi-PIN)

/* ─────────── LOG ─────────── */
function log(action, detail = '') {
  ADMIN_LOG.unshift({ ts: new Date().toISOString(), who: WHO || 'Admin', action, detail });
  if (ADMIN_LOG.length > 500) ADMIN_LOG.length = 500;
  saveJson(LOG_KEY, ADMIN_LOG);
  const logEl = $('#mdpLog');
  if (logEl) renderLog();
}

/* ─────────── PIN GATE ─────────── */
let pinBuf = '';
function showMandapPinGate() {
  const gate = $('#mandapPinGate');
  if (!gate) return;
  pinBuf = '';
  $$('#mandapPinGate .mdp-pd').forEach(d => d.classList.remove('filled'));
  $('#mdpPinErr').innerHTML = '&nbsp;';
  gate.classList.add('active');
  setTimeout(() => $('#mandapPinGate .mdp-pad-key[data-k="1"]')?.focus(), 100);
}
function hideMandapPinGate() { $('#mandapPinGate').classList.remove('active'); }
function mandapPinKey(k) {
  if (k === 'del') { pinBuf = pinBuf.slice(0, -1); }
  else if (pinBuf.length < 4) { pinBuf += k; }
  $$('#mandapPinGate .mdp-pd').forEach((d, i) => d.classList.toggle('filled', i < pinBuf.length));
  if (pinBuf.length === 4) setTimeout(checkMandapPin, 180);
}
function checkMandapPin() {
  if (pinBuf === MANDAP_PIN) {
    WHO = (sessionStorage.getItem('mandap_who') || prompt('Who is entering? (Bapu / Deep)', 'Deep') || 'Admin').trim();
    sessionStorage.setItem('mandap_who', WHO);
    sessionStorage.setItem('mandap_unlocked', '1');
    hideMandapPinGate();
    showMandapSection();
    log('Mandap entered');
    toast(`Mandap unlocked · welcome ${WHO}`);
  } else {
    $('#mdpPinErr').textContent = 'Wrong PIN';
    $('#mandapPinGate .mdp-pad').classList.add('shake');
    setTimeout(() => $('#mandapPinGate .mdp-pad').classList.remove('shake'), 380);
    setTimeout(() => { pinBuf = ''; $$('#mandapPinGate .mdp-pd').forEach(d => d.classList.remove('filled')); $('#mdpPinErr').innerHTML = '&nbsp;'; }, 600);
  }
}

/* ─────────── NAV INTEGRATION ─────────── */
function openMandap() {
  if (sessionStorage.getItem('mandap_unlocked') === '1') {
    WHO = sessionStorage.getItem('mandap_who') || 'Admin';
    showMandapSection();
  } else {
    showMandapPinGate();
  }
}
function showMandapSection() {
  $$('section.section').forEach(s => s.classList.remove('active'));
  $('#mandap').classList.add('active');
  $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.section === 'mandap'));
  renderAll();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ─────────── RSVP TRACKER ─────────── */
const RSVP_CYCLE = ['pend', 'yes', 'day', 'call', 'no'];
const RSVP_LABEL = { pend: '— pending', yes: '✓ confirmed', day: 'maybe', call: '📞 call', no: 'declined' };
const RSVP_CLASS = { pend: 'b-pend', yes: 'b-rsvp-yes', day: 'b-rsvp-day', call: 'b-rsvp-call', no: 'b-rsvp-no' };

function getGuests() { return (window.GUESTS_DATA && window.GUESTS_DATA.guests) || []; }
function rsvpOf(id) { return (RSVP_STATE[id] && RSVP_STATE[id].status) || 'pend'; }
function cycleRsvp(id) {
  const cur = rsvpOf(id);
  const next = RSVP_CYCLE[(RSVP_CYCLE.indexOf(cur) + 1) % RSVP_CYCLE.length];
  RSVP_STATE[id] = { status: next, ts: new Date().toISOString(), by: WHO };
  saveJson(RSVP_KEY, RSVP_STATE);
  log('RSVP', `Guest #${id} → ${next}`);
  if (next === 'yes') confettiBurst();
  renderRsvpTracker();
  renderStatsBanner();
}

function renderRsvpTracker() {
  const wrap = $('#mdpRsvpRows');
  if (!wrap) return;
  const filter = $('.mdp-rsvp-chip.active')?.dataset.f || 'all';
  const search = $('#mdpRsvpSearch').value.toLowerCase().trim();
  let list = getGuests();
  if (filter === 'pend')      list = list.filter(g => rsvpOf(g.id) === 'pend');
  else if (filter === 'yes')  list = list.filter(g => rsvpOf(g.id) === 'yes');
  else if (filter === 'maybe')list = list.filter(g => ['day','call'].includes(rsvpOf(g.id)));
  else if (filter === 'no')   list = list.filter(g => rsvpOf(g.id) === 'no');
  if (search) list = list.filter(g => (g.name + ' ' + (g.city||'')).toLowerCase().includes(search));

  wrap.innerHTML = list.map(g => {
    const status = rsvpOf(g.id);
    const lbl = RSVP_LABEL[status];
    const cls = RSVP_CLASS[status];
    const meta = RSVP_STATE[g.id];
    const tsTxt = meta?.ts ? new Date(meta.ts).toLocaleString('en-NZ', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) : '—';
    const byTxt = meta?.by || '—';
    return `<div class="mdp-rsvp-row" data-id="${g.id}">
      <div class="mdp-rsvp-name">${esc(g.name)}<span class="mdp-rsvp-region">${esc(g.region_name||'')}</span></div>
      <div class="mdp-rsvp-meta">${tsTxt} · by ${esc(byTxt)}</div>
      <button class="mdp-rsvp-pill ${cls}" data-id="${g.id}">${lbl}</button>
    </div>`;
  }).join('');
  wrap.querySelectorAll('.mdp-rsvp-pill').forEach(b => b.addEventListener('click', () => cycleRsvp(parseInt(b.dataset.id, 10))));
}

/* ─────────── INVITATION LINKS ─────────── */
function inviteUrlFor(g) {
  const base = location.origin + location.pathname.replace(/hub\.html$/, 'index.html');
  return `${base}?g=${encodeURIComponent(g.name)}&id=${g.id}`;
}
function renderInviteLinks() {
  const wrap = $('#mdpInviteGrid');
  if (!wrap) return;
  const list = getGuests();
  wrap.innerHTML = list.slice(0, 200).map(g => {
    const url = inviteUrlFor(g);
    const sent = SEND_STATE[g.id] || {};
    const waSent = sent.wa ? '✓' : '·';
    const emSent = sent.em ? '✓' : '·';
    return `<div class="mdp-invite-card" data-id="${g.id}">
      <div class="mdp-invite-name">${esc(g.name)}</div>
      <div class="mdp-invite-region">${esc(g.region_name||'')}</div>
      <div class="mdp-invite-actions">
        <button class="mdp-btn-mini" data-act="copy" data-url="${esc(url)}">📋 Copy</button>
        <button class="mdp-btn-mini" data-act="wa" data-name="${esc(g.name)}" data-url="${esc(url)}" data-id="${g.id}">💬 WhatsApp <span class="mdp-tick">${waSent}</span></button>
        <button class="mdp-btn-mini" data-act="em" data-name="${esc(g.name)}" data-url="${esc(url)}" data-id="${g.id}">✉ Email <span class="mdp-tick">${emSent}</span></button>
        <button class="mdp-btn-mini" data-act="qr" data-url="${esc(url)}">▦ QR</button>
      </div>
    </div>`;
  }).join('');
  wrap.querySelectorAll('button').forEach(b => b.addEventListener('click', handleInviteAction));
}

async function handleInviteAction(e) {
  const b = e.currentTarget;
  const act = b.dataset.act;
  if (act === 'copy') {
    await navigator.clipboard.writeText(b.dataset.url); toast('Link copied'); log('Copied invite', b.dataset.url);
  } else if (act === 'wa') {
    const msg = `Namaste ${b.dataset.name}, you're invited to Mum (Tulawati Lal Mummy)'s 12-month Salina, 15-16 August 2026 in Hamilton. Details + RSVP: ${b.dataset.url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    SEND_STATE[b.dataset.id] = { ...(SEND_STATE[b.dataset.id]||{}), wa: new Date().toISOString() };
    saveJson(SEND_KEY, SEND_STATE);
    log('WhatsApp sent', b.dataset.name);
    renderInviteLinks();
  } else if (act === 'em') {
    const subj = encodeURIComponent('Mum\'s 12-month Salina · 15-16 August 2026');
    const body = encodeURIComponent(`Namaste ${b.dataset.name},\n\nYou're warmly invited to Mum (Tulawati Lal Mummy)'s 12-month Salina ceremony, held over two days:\n\n  • Saturday 15 August 2026 — Geeta & Kirtan, 6:30 PM\n  • Sunday 16 August 2026 — Pundit Pooja, 10:30 AM\n\n14 Beaumont Street, Hamilton East, Hamilton 3216.\n\nDetails + RSVP:\n${b.dataset.url}\n\nWith love & blessings,\nThe Lal parivaar`);
    window.open(`mailto:?subject=${subj}&body=${body}`, '_blank');
    SEND_STATE[b.dataset.id] = { ...(SEND_STATE[b.dataset.id]||{}), em: new Date().toISOString() };
    saveJson(SEND_KEY, SEND_STATE);
    log('Email opened', b.dataset.name);
    renderInviteLinks();
  } else if (act === 'qr') {
    showQrModal(b.dataset.url);
  }
}

/* ─────────── QR MODAL ─────────── */
function showQrModal(url) {
  const m = $('#mdpQrModal');
  $('#mdpQrUrl').textContent = url;
  const target = $('#mdpQrTarget');
  target.innerHTML = '';
  if (window.QRCode) {
    new QRCode(target, { text: url, width: 240, height: 240, colorDark: '#1a0e08', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
  } else { target.textContent = 'QRCode lib not loaded'; }
  m.classList.add('active');
  log('QR shown', url);
}
function hideQrModal() { $('#mdpQrModal').classList.remove('active'); }
window.mandapHideQr = hideQrModal;
window.mandapCopyQrUrl = async () => {
  await navigator.clipboard.writeText($('#mdpQrUrl').textContent); toast('Link copied');
};

/* ─────────── BULK ACTIONS ─────────── */
function bulkMark(ch) {
  const list = getGuests();
  const filter = $('.mdp-rsvp-chip.active')?.dataset.f || 'all';
  const targets = filter === 'all' ? list : list.filter(g => {
    if (filter === 'pend') return rsvpOf(g.id) === 'pend';
    if (filter === 'yes') return rsvpOf(g.id) === 'yes';
    if (filter === 'maybe') return ['day','call'].includes(rsvpOf(g.id));
    if (filter === 'no') return rsvpOf(g.id) === 'no';
    return true;
  });
  if (!confirm(`Mark ${ch.toUpperCase()} sent for ${targets.length} guests?`)) return;
  const now = new Date().toISOString();
  targets.forEach(g => { SEND_STATE[g.id] = { ...(SEND_STATE[g.id]||{}), [ch]: now }; });
  saveJson(SEND_KEY, SEND_STATE);
  log(`Bulk mark ${ch}`, `${targets.length} guests`);
  renderInviteLinks();
  toast(`Marked ${targets.length} ${ch.toUpperCase()} sent`);
}
window.mandapBulkMark = bulkMark;

/* ─────────── STATS BANNER ─────────── */
function renderStatsBanner() {
  const banner = $('#mdpStatsBanner');
  if (!banner) return;
  const total = getGuests().length;
  let yes=0, no=0, maybe=0, call=0, pend=0;
  getGuests().forEach(g => {
    const s = rsvpOf(g.id);
    if (s==='yes') yes++; else if (s==='no') no++; else if (s==='day') maybe++; else if (s==='call') call++; else pend++;
  });
  const waSent = Object.values(SEND_STATE).filter(s => s.wa).length;
  const emSent = Object.values(SEND_STATE).filter(s => s.em).length;
  banner.innerHTML = `
    <div class="mdp-stat" data-c="ok"><div class="mdp-stat-num">${yes}</div><div class="mdp-stat-lbl">Confirmed</div></div>
    <div class="mdp-stat" data-c="warn"><div class="mdp-stat-num">${maybe+call}</div><div class="mdp-stat-lbl">Maybe / Call</div></div>
    <div class="mdp-stat" data-c="muted"><div class="mdp-stat-num">${pend}</div><div class="mdp-stat-lbl">Pending</div></div>
    <div class="mdp-stat" data-c="err"><div class="mdp-stat-num">${no}</div><div class="mdp-stat-lbl">Declined</div></div>
    <div class="mdp-stat" data-c="gold"><div class="mdp-stat-num">${waSent}</div><div class="mdp-stat-lbl">WhatsApp Sent</div></div>
    <div class="mdp-stat" data-c="gold"><div class="mdp-stat-num">${emSent}</div><div class="mdp-stat-lbl">Email Sent</div></div>
    <div class="mdp-stat" data-c="ok"><div class="mdp-stat-num">${total}</div><div class="mdp-stat-lbl">Total Invitees</div></div>`;
  // Also update topbar RSVP count
  const tbRsvp = $('#tbRsvp'); if (tbRsvp) tbRsvp.textContent = yes;
}

/* ─────────── ACTIVITY LOG ─────────── */
function renderLog() {
  const el = $('#mdpLog');
  if (!el) return;
  if (ADMIN_LOG.length === 0) { el.innerHTML = '<div class="mdp-log-empty">No activity yet</div>'; return; }
  el.innerHTML = ADMIN_LOG.slice(0, 50).map(e => {
    const t = new Date(e.ts);
    const tStr = t.toLocaleString('en-NZ', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit', second:'2-digit' });
    return `<div class="mdp-log-row"><span class="mdp-log-time">${tStr}</span><span class="mdp-log-who">${esc(e.who)}</span><span class="mdp-log-act">${esc(e.action)}</span><span class="mdp-log-det">${esc(e.detail||'')}</span></div>`;
  }).join('');
}

/* ─────────── SETTINGS ─────────── */
function renderSettings() {
  const root = $('#mdpSettings');
  if (!root) return;
  root.innerHTML = `
    <div class="mdp-set-grid">
      <label>Family hub PIN<input type="text" id="setFamPin" maxlength="6" placeholder="020146" value="${esc(localStorage.getItem('salina_pin') || '')}"></label>
      <label>Mandap admin PIN<input type="text" id="setAdmPin" maxlength="4" placeholder="1946" value="${esc(localStorage.getItem('salina_admin_pin') || '')}"></label>
      <label>Event date<input type="datetime-local" id="setDate" value="${esc(SETTINGS.eventDate.slice(0,16))}"></label>
      <label>Venue<input type="text" id="setVenue" value="${esc(SETTINGS.venue)}"></label>
      <label>Contact phone<input type="text" id="setPhone" value="${esc(SETTINGS.phone)}"></label>
      <label>Ambient default volume<input type="range" id="setVol" min="0" max="1" step="0.05" value="${SETTINGS.ambientVol}"></label>
    </div>
    <div class="mdp-set-actions">
      <button class="mdp-btn" onclick="mandapSaveSettings()">Save settings</button>
      <button class="mdp-btn danger" onclick="mandapResetAll()">⚠ Reset all RSVPs + send state</button>
      <button class="mdp-btn" onclick="mandapExport()">⬇ Export CSV</button>
    </div>`;
}
window.mandapSaveSettings = () => {
  const fam = $('#setFamPin').value.trim(); if (fam) localStorage.setItem('salina_pin', fam);
  const adm = $('#setAdmPin').value.trim(); if (adm) localStorage.setItem('salina_admin_pin', adm);
  SETTINGS.eventDate = $('#setDate').value + ':00+12:00';
  SETTINGS.venue = $('#setVenue').value;
  SETTINGS.phone = $('#setPhone').value;
  SETTINGS.ambientVol = parseFloat($('#setVol').value);
  saveJson(SETTINGS_KEY, SETTINGS);
  log('Settings saved');
  toast('Settings saved · reload to apply event date');
};
window.mandapResetAll = () => {
  if (!confirm('Reset ALL RSVPs and send state? This cannot be undone.')) return;
  RSVP_STATE = {}; SEND_STATE = {};
  saveJson(RSVP_KEY, RSVP_STATE); saveJson(SEND_KEY, SEND_STATE);
  log('RESET all RSVPs + send state');
  renderAll();
  toast('Reset complete');
};

/* ─────────── EXPORT CSV ─────────── */
window.mandapExport = () => {
  const list = getGuests();
  const head = ['ID','Name','Region','City','RSVP_Status','RSVP_Updated','RSVP_By','WA_Sent','Email_Sent'];
  const rows = list.map(g => {
    const r = RSVP_STATE[g.id] || {};
    const s = SEND_STATE[g.id] || {};
    return [g.id, g.name, g.region_name||'', g.city||'', r.status||'pend', r.ts||'', r.by||'', s.wa||'', s.em||''];
  });
  const csv = [head, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `salina-rsvp-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
  log('Export CSV', `${rows.length} rows`);
  toast('CSV downloaded');
};

/* ─────────── CONFETTI ─────────── */
function confettiBurst() {
  const c = $('#confetti'); if (!c) return;
  const ctx = c.getContext('2d');
  c.width = innerWidth; c.height = innerHeight;
  const N = 80, parts = [];
  const colors = ['#f5c557','#f97316','#e8724a','#10b981','#c040ff','#fff3d6'];
  for (let i = 0; i < N; i++) {
    parts.push({
      x: innerWidth * 0.5 + (Math.random()-0.5)*60,
      y: innerHeight * 0.5,
      vx: (Math.random()-0.5)*12, vy: -8 - Math.random()*8,
      r: 4 + Math.random()*5, color: colors[i % colors.length],
      alpha: 1, rot: Math.random()*6,
    });
  }
  let frames = 0;
  function tick() {
    ctx.clearRect(0, 0, c.width, c.height);
    parts.forEach(p => {
      p.vy += 0.42; p.x += p.vx; p.y += p.vy; p.rot += 0.18; p.alpha -= 0.012;
      if (p.alpha <= 0) return;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.r/2, -p.r/2, p.r, p.r*1.4);
      ctx.restore();
    });
    frames++;
    if (frames < 200) requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, c.width, c.height);
  }
  tick();
}

/* ─────────── RENDER ALL ─────────── */
function renderAll() {
  renderStatsBanner();
  renderRsvpTracker();
  renderInviteLinks();
  renderLog();
  renderSettings();
  const whoEl = $('#mdpWhoami'); if (whoEl) whoEl.textContent = WHO || 'Admin';
}

/* ─────────── WIRE UP ─────────── */
function wire() {
  // Nav: hijack the Mandap button click
  document.addEventListener('click', e => {
    const navBtn = e.target.closest('[data-section="mandap"]');
    if (navBtn) { e.preventDefault(); e.stopPropagation(); openMandap(); }
  }, true);

  // PIN gate keys
  $$('#mandapPinGate .mdp-pad-key').forEach(b => b.addEventListener('click', () => mandapPinKey(b.dataset.k)));
  $('#mdpCloseGate')?.addEventListener('click', hideMandapPinGate);
  // Hardware keyboard for PIN gate
  document.addEventListener('keydown', e => {
    if (!$('#mandapPinGate')?.classList.contains('active')) return;
    if (/^\d$/.test(e.key)) mandapPinKey(e.key);
    else if (e.key === 'Backspace') mandapPinKey('del');
    else if (e.key === 'Escape') hideMandapPinGate();
  });

  // RSVP search + chips
  $('#mdpRsvpSearch')?.addEventListener('input', () => renderRsvpTracker());
  $$('.mdp-rsvp-chip').forEach(c => c.addEventListener('click', () => {
    $$('.mdp-rsvp-chip').forEach(x => x.classList.remove('active'));
    c.classList.add('active');
    renderRsvpTracker();
  }));

  // QR modal close
  $('#mdpQrModal')?.addEventListener('click', e => {
    if (e.target.id === 'mdpQrModal' || e.target.classList.contains('mdp-qr-close')) hideQrModal();
  });
}

// Wait for DOM and existing app to be ready
function init() {
  if (!$('#mandap')) {
    // hub.html not yet injected with Mandap UI; try again shortly
    setTimeout(init, 200); return;
  }
  wire();
  // If already unlocked this session, hot-render
  if (sessionStorage.getItem('mandap_unlocked') === '1') {
    WHO = sessionStorage.getItem('mandap_who') || 'Admin';
    renderAll();
  }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else { init(); }

})();
