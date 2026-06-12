/* whetu_upgrade.js — Universal Whetū Digital dashboard upgrade pack
   Additive only — doesn't override existing app behaviour.
   Features:
   - Scroll reveals via IntersectionObserver (any .wu-reveal element)
   - Floating share button (Web Share API + clipboard fallback)
   - Toast helper (window.wuToast)
   - Print enhancements (auto class on print)
   - Keyboard shortcut: Shift+S = share, Shift+P = print
*/
(() => {
'use strict';
if (window.__WHETU_UPGRADE__) return; window.__WHETU_UPGRADE__ = true;

/* Inject styles */
const css = `
  .wu-share-btn{position:fixed;bottom:24px;right:24px;width:52px;height:52px;border-radius:50%;
    background:linear-gradient(135deg,rgba(245,197,87,.16),rgba(249,115,22,.1));
    border:1px solid rgba(212,165,50,.42);color:#f5c557;font-size:20px;cursor:pointer;
    z-index:9990;backdrop-filter:blur(14px);box-shadow:0 8px 24px rgba(0,0,0,.4),0 0 28px rgba(245,197,87,.18);
    transition:transform .25s ease,background .25s;display:flex;align-items:center;justify-content:center;font-family:inherit}
  .wu-share-btn:hover{transform:scale(1.08);background:linear-gradient(135deg,rgba(245,197,87,.28),rgba(249,115,22,.18))}
  .wu-share-btn:active{transform:scale(.94)}
  .wu-toast{position:fixed;bottom:90px;right:24px;z-index:9991;padding:12px 20px;
    background:linear-gradient(135deg,rgba(20,10,5,.95),rgba(34,18,8,.88));
    border:1px solid rgba(212,165,50,.42);border-radius:12px;color:#f5c557;
    font-family:'Geist Mono',monospace;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;
    backdrop-filter:blur(14px);box-shadow:0 14px 50px rgba(0,0,0,.5);
    transform:translateY(140%);transition:transform .5s cubic-bezier(.34,1.56,.64,1)}
  .wu-toast.show{transform:translateY(0)}
  .wu-reveal{opacity:0;transform:translateY(22px);transition:opacity .8s cubic-bezier(.22,1,.36,1),transform .8s cubic-bezier(.22,1,.36,1)}
  .wu-reveal.wu-visible{opacity:1;transform:translateY(0)}
  @media print {
    .wu-share-btn,.wu-toast{display:none!important}
    body{background:#fff!important;color:#1a0e08!important}
  }
`;
const style = document.createElement('style');
style.id = 'whetu-upgrade-styles';
style.textContent = css;
document.head.appendChild(style);

/* Toast helper */
const toastEl = document.createElement('div');
toastEl.className = 'wu-toast';
document.body.appendChild(toastEl);
window.wuToast = function(msg, ms = 2400) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastEl._t);
  toastEl._t = setTimeout(() => toastEl.classList.remove('show'), ms);
};

/* Share button */
function setupShare() {
  const btn = document.createElement('button');
  btn.className = 'wu-share-btn';
  btn.setAttribute('aria-label', 'Share this dashboard');
  btn.title = 'Share (Shift+S)';
  btn.innerHTML = '⌁';
  btn.addEventListener('click', async () => {
    const url = location.href;
    const title = document.title;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        wuToast('Shared');
      } catch (e) { /* user cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        wuToast('Link copied');
      } catch {
        prompt('Copy this link:', url);
      }
    }
  });
  document.body.appendChild(btn);
}

/* Scroll reveals */
function setupReveal() {
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('wu-visible');
        io.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  document.querySelectorAll('.wu-reveal').forEach(el => io.observe(el));
  // Auto-tag candidates that don't already have reveal behaviour
  // Heuristic: card-like elements with class containing 'card', 'panel', 'tile'
  const auto = document.querySelectorAll('[class*="card"]:not(.wu-reveal),[class*="panel"]:not(.wu-reveal),[class*="tile"]:not(.wu-reveal)');
  // Only auto-apply to elements with no existing opacity/transform styling to avoid clashes
  auto.forEach(el => {
    const cs = getComputedStyle(el);
    if (cs.opacity === '1' && cs.transform === 'none') {
      el.classList.add('wu-reveal');
      io.observe(el);
    }
  });
  // Re-observe on DOM mutations
  new MutationObserver(muts => muts.forEach(m => m.addedNodes.forEach(n => {
    if (n.nodeType === 1 && n.classList?.contains('wu-reveal')) io.observe(n);
  }))).observe(document.body, { childList: true, subtree: true });
}

/* Keyboard shortcuts */
function setupKeys() {
  document.addEventListener('keydown', e => {
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.shiftKey && (e.key === 'S' || e.key === 's')) {
      e.preventDefault();
      document.querySelector('.wu-share-btn')?.click();
    } else if (e.shiftKey && (e.key === 'P' || e.key === 'p')) {
      e.preventDefault();
      window.print();
    }
  });
}

/* Init when DOM ready */
function init() {
  setupShare();
  setupReveal();
  setupKeys();
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
