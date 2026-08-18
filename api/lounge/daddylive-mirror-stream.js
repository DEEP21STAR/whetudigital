// Alternate DaddyLive-family mirror resolver (2026-08-18) -- MUST run on the
// Node runtime, not Edge, same reason as fallback-stream.js: launching a
// browser needs a real process, which Edge's V8-isolate sandbox can't do.
//
// Why this exists: dlhd.st (skystream.js) is the PRIMARY DaddyLive domain and
// needs no browser -- its watch.php -> iframe -> atob() chain is plain HTML,
// resolvable with fetch() alone. Two sibling domains confirmed live
// 2026-08-17 (daddylives.sbs, daddylivetv.sbs) share the EXACT SAME
// channel-ID scheme (data-stream-id matches dlhd.st's ids 1:1, verified
// against Sky Sport NZ's 588-596 range) but return "Invalid token" on a
// direct watch.php hit -- they need a real browser click-through, which
// produces a JS-generated stream-proxy.php?t=...&token=... URL with no
// static formula. That's what @sparticuz/chromium + playwright-core are for
// here, same pattern as fallback-stream.js's embed.st resolve step.
//
// This is tier 3 in Lounge's Sky Sport fallback chain: dlhd.st (skystream.js)
// -> streamed.pk by title match (fallback-stream.js) -> these mirrors by the
// SAME channel id (this file). Wired into lounge.html's playChannel() right
// before it gives up and shows an error.
export const config = { runtime: 'nodejs', maxDuration: 60 };

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
// Both tried in order per request -- if the first mirror is itself down or
// its own chain breaks, the second gets a real attempt rather than the whole
// tier failing on one domain's bad day.
const MIRRORS = ['https://daddylives.sbs', 'https://daddylivetv.sbs'];
const MASTER_TTL_MS = 90 * 1000; // same short TTL as skystream.js/fallback-stream.js -- these tokens are short-lived

const g = globalThis;
const masterCache = g.__loungeDaddyMirrorMaster || (g.__loungeDaddyMirrorMaster = new Map());

async function resolveMirrorMaster(id) {
  const cacheKey = String(id);
  const cached = masterCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < MASTER_TTL_MS) return cached;

  // Lazy imports, same reasoning as fallback-stream.js: a request that never
  // reaches this function (the two cheaper tiers already succeeded) never
  // pays Chromium's cold-start cost.
  //
  // REAL BUG, fixed 2026-08-19: this and fallback-stream.js were both dead in
  // production since deploy -- every request 502'd with "error while loading
  // shared libraries: libnss3.so: cannot open shared object file". Root cause
  // confirmed via @sparticuz/chromium's own GitHub issue #427: the maintainer
  // states the AL2023 shared-library bundle (libnss3/libnspr4/etc) was only
  // brought current as of v140 -- package.json here was pinned to ^131.0.1,
  // which resolves to a version predating that fix. Bumped to ^149.0.0
  // (paired with playwright-core ^1.62.1, both current) in the root
  // package.json. Not a code bug in this file -- a stale dependency pin.
  const chromium = (await import('@sparticuz/chromium')).default;
  const { chromium: pwChromium } = await import('playwright-core');

  const browser = await pwChromium.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });
  try {
    const ctx = await browser.newContext({ userAgent: UA });
    const page = await ctx.newPage();
    let master = null;
    let refererBase = null;
    let lastError = null;

    for (const base of MIRRORS) {
      master = null;
      const watchUrl = `${base}/watch.php?id=${id}`;
      page.removeAllListeners('response');
      page.on('response', (res) => {
        if (!master && res.url().includes('.m3u8')) master = res.url();
      });
      try {
        await page.goto(watchUrl, { waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForTimeout(2500);
      } catch (e) {
        lastError = e;
      }
      if (master) { refererBase = base; break; }
    }
    if (!master) throw lastError || new Error('no m3u8 request seen on either mirror');

    const masterRes = await page.request.get(master, { headers: { Referer: `${refererBase}/` } });
    if (!masterRes.ok()) throw new Error(`master fetch HTTP ${masterRes.status()}`);
    const masterBody = await masterRes.text();
    const lines = masterBody.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
    if (!lines.length) throw new Error('mirror master playlist had no variants');
    const mediaUrl = new URL(lines[0], master).href;

    const mediaRes = await page.request.get(mediaUrl, { headers: { Referer: master } });
    if (!mediaRes.ok()) throw new Error(`media fetch HTTP ${mediaRes.status()}`);
    const mediaBody = await mediaRes.text();
    const out = mediaBody.split('\n').map(line => {
      const s = line.trim();
      if (s && !s.startsWith('#') && !s.startsWith('http')) return new URL(s, mediaUrl).href;
      return line;
    }).join('\n');

    const entry = { ts: Date.now(), playlist: out };
    masterCache.set(cacheKey, entry);
    return entry;
  } finally {
    await browser.close();
  }
}

// Named exports, not `export default function handler(req)` -- confirmed
// live 2026-08-17 on fallback-stream.js that Vercel's Node.js runtime
// silently discards a Response from the default-export form.
export function OPTIONS() {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*' } });
}

export async function GET(req) {
  const headers = { 'Access-Control-Allow-Origin': '*' };
  const url = new URL(req.url, 'http://localhost'); // Node runtime hands back a relative path, same fix as fallback-stream.js
  const id = (url.searchParams.get('id') || '').trim();
  if (!/^\d+$/.test(id)) {
    return new Response(JSON.stringify({ error: 'numeric id required, e.g. /api/lounge/daddylive-mirror-stream?id=588' }), {
      status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { playlist } = await resolveMirrorMaster(id);
    return new Response(playlist, {
      status: 200,
      headers: { ...headers, 'Content-Type': 'application/vnd.apple.mpegurl', 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    masterCache.delete(String(id));
    return new Response(JSON.stringify({ error: `${e.name || 'Error'}: ${e.message || e}` }), {
      status: 502, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
}
