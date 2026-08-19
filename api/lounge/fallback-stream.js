// Sky Sport fallback resolver (2026-08-17) -- MUST run on the Node runtime,
// not Edge. Edge functions are a V8-isolate sandbox with no filesystem and
// no process spawning: they cannot launch a browser or run any binary, full
// stop. That is why this lives in a separate file from skystream.js instead
// of being added to it.
//
// Purpose: when DaddyLive's own CDN dies (confirmed live 2026-08-17: every
// Sky Sport NZ channel AND unrelated DaddyLive channels failed identically
// at the same upstream host -- a genuine outage on their end, not fixable
// by retrying), look for the SAME live event on a second, independent
// provider (streamed.pk) so playback can keep going inside Lounge's own
// player. Deep was explicit: no external browser tab, ever -- this resolves
// entirely server-side and hands back a normal HLS playlist, same shape as
// /api/lounge/skystream, so the frontend can't tell the difference.
//
// Two real findings from testing this live in Python before writing this
// port (C:\NEXUS\nexus_control_relay.py has the original, browser-verified
// version -- keep both in sync if the embed.st chain changes):
//   1. streamed.pk's embed pages (embed.st) run obfuscated JS that issues a
//      fresh, short-lived signed CDN URL per page load -- there is no
//      static formula, so getting the first master .m3u8 genuinely needs a
//      real browser to execute that JS once. That's what
//      @sparticuz/chromium + playwright-core are for here -- a background
//      resolve step inside this function, never a window Deep ever sees.
//   2. The CDN itself (strmd.st / *.workers.dev) blocks plain fetch() with a
//      403 -- it checks the TLS/JA3 handshake, not headers. Rather than
//      bring in a second technology (curl_cffi has no direct Node
//      equivalent), this reuses the SAME already-open browser context's own
//      request API for the master/variant playlist fetches, since that
//      naturally carries a real Chrome TLS fingerprint. CORS on the actual
//      video segments is wide open (Access-Control-Allow-Origin: *,
//      confirmed live) -- so once this hands back a playlist, Deep's own
//      browser fetches segments directly, no proxying, exactly like
//      skystream.js already does for DaddyLive.
export const config = { runtime: 'nodejs', maxDuration: 60 };

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const MATCHES_TTL_MS = 120 * 1000;
const MASTER_TTL_MS = 90 * 1000; // embed.st's signed token is short-lived -- re-resolve often
const STOPWORDS = new Set(['v', 'vs', 'the', 'fc', 'nz', 'live', 'sport', 'sky']);

const g = globalThis;
const matchesCache = g.__loungeFallbackMatches || (g.__loungeFallbackMatches = { ts: 0, data: [] });
const masterCache = g.__loungeFallbackMaster || (g.__loungeFallbackMaster = new Map());

function titleTokens(title) {
  const words = (title || '').toLowerCase().match(/[a-z0-9]+/g) || [];
  return new Set(words.filter(w => w.length >= 3 && !STOPWORDS.has(w)));
}

async function fetchLiveMatches() {
  if (Date.now() - matchesCache.ts < MATCHES_TTL_MS && matchesCache.data.length) return matchesCache.data;
  const res = await fetch('https://streamed.pk/api/matches/live', {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`streamed.pk matches HTTP ${res.status}`);
  const data = await res.json();
  matchesCache.data = data;
  matchesCache.ts = Date.now();
  return data;
}

function findFallbackMatch(skyTitle, matches) {
  const want = titleTokens(skyTitle);
  if (!want.size) return null;
  for (const m of matches) {
    const have = titleTokens(m.title);
    for (const w of want) if (have.has(w)) return m;
  }
  return null;
}

async function resolveFallbackMaster(embedUrl) {
  const cached = masterCache.get(embedUrl);
  if (cached && Date.now() - cached.ts < MASTER_TTL_MS) return cached;

  // Lazy imports: keep these out of the module's top-level scope so a
  // request that never needs a browser (e.g. an unmatched title) never
  // pays Chromium's cold-start cost.
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
    page.on('response', (res) => {
      if (!master && res.url().includes('.m3u8')) master = res.url();
    });
    try {
      await page.goto(embedUrl, { waitUntil: 'networkidle', timeout: 20000 });
    } catch (e) {
      // A slow/ad-heavy embed page can still have fired the request we need.
    }
    await page.waitForTimeout(2500);
    if (!master) throw new Error('no m3u8 request seen on the embed page');
    // Diagnostic (2026-08-19): if embed.st redirects before the player fires
    // its m3u8 request, the CDN's own Referer check expects the POST-redirect
    // page URL, not the one originally requested -- page.url() reflects
    // wherever navigation actually landed.
    const finalPageUrl = page.url();

    // Fetch playlists through the SAME browser context (real TLS
    // fingerprint), then close the browser before returning -- only the
    // resolved text needs to survive, not the browser process.
    // 2026-08-19: added the fuller header set a real in-page XHR/fetch would
    // carry (Origin + Sec-Fetch-*) -- a bare Referer-only request was 403ing,
    // and a plain nginx 403 with no CF-Ray suggests a config check on more
    // than just Referer. Testing this before the more invasive move to an
    // in-page fetch() (which would introduce a real CORS exposure page.request
    // doesn't have).
    const fetchHeaders = {
      Referer: embedUrl,
      Origin: new URL(embedUrl).origin,
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site',
    };
    const masterRes = await page.request.get(master, { headers: fetchHeaders });
    if (!masterRes.ok()) {
      // Temporary rich diagnostics (2026-08-19) -- a bare "HTTP 403" wasn't
      // enough to tell IP-reputation blocking apart from a Referer/header
      // mismatch or an expired signed token. Captures exactly what's needed
      // to tell those apart, then this block comes back out once resolved.
      let bodySnippet = '';
      try { bodySnippet = (await masterRes.text()).slice(0, 300); } catch (e) {}
      const respHeaders = masterRes.headers();
      throw new Error(`master fetch HTTP ${masterRes.status()} | url=${master} | referer=${embedUrl} | finalPageUrl=${finalPageUrl} | server=${respHeaders['server'] || 'n/a'} | cf-ray=${respHeaders['cf-ray'] || 'n/a'} | body=${JSON.stringify(bodySnippet)}`);
    }
    const masterBody = await masterRes.text();
    const lines = masterBody.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
    if (!lines.length) throw new Error('fallback master playlist had no variants');
    const mediaUrl = new URL(lines[0], master).href;

    const mediaRes = await page.request.get(mediaUrl, { headers: fetchHeaders });
    if (!mediaRes.ok()) throw new Error(`media fetch HTTP ${mediaRes.status()}`);
    const mediaBody = await mediaRes.text();
    const out = mediaBody.split('\n').map(line => {
      const s = line.trim();
      if (s && !s.startsWith('#') && !s.startsWith('http')) return new URL(s, mediaUrl).href;
      return line;
    }).join('\n');

    const entry = { ts: Date.now(), playlist: out };
    masterCache.set(embedUrl, entry);
    return entry;
  } finally {
    await browser.close();
  }
}

// Named HTTP-method exports, not `export default function handler(req)`.
// Confirmed live 2026-08-17: Vercel's Node.js runtime (unlike Edge) expects
// this shape -- the default-export form silently discards any Response it
// returns (Vercel logs: "default export returned a Response... returns are
// ignored"), so the function ran to completion every time but never actually
// sent anything back, hanging until the 60s maxDuration timeout regardless
// of what the code did. This is the fix, not a stylistic choice.
export function OPTIONS() {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*' } });
}

export async function GET(req) {
  const headers = { 'Access-Control-Allow-Origin': '*' };

  // Unlike skystream.js's Edge runtime (where req.url is always absolute),
  // Vercel's Node.js runtime hands back a relative path here -- confirmed
  // live 2026-08-17 via a FUNCTION_INVOCATION_FAILED / ERR_INVALID_URL crash
  // on the very first request. A dummy base makes new URL() work regardless
  // of runtime; only searchParams are ever read from the result.
  const url = new URL(req.url, 'http://localhost');
  const title = (url.searchParams.get('title') || '').trim();
  if (!title) {
    return new Response(JSON.stringify({ error: 'title required, e.g. /api/lounge/fallback-stream?title=Arsenal%20v%20Chelsea' }), {
      status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  let matchTitle = null;
  try {
    const matches = await fetchLiveMatches();
    const match = findFallbackMatch(title, matches);
    if (!match) {
      return new Response(JSON.stringify({ error: 'no equivalent live event found on the fallback provider', matchedTitle: null }), {
        status: 502, headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }
    matchTitle = match.title;
    const sources = match.sources || [];
    if (!sources.length) {
      return new Response(JSON.stringify({ error: 'matched event has no playable source listed', matchedTitle: matchTitle }), {
        status: 502, headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }
    const source = sources[0];
    const streamRes = await fetch(`https://streamed.pk/api/stream/${source.source}/${source.id}`, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
    });
    if (!streamRes.ok) throw new Error(`streamed.pk stream HTTP ${streamRes.status}`);
    const streams = await streamRes.json();
    if (!streams.length) throw new Error("matched event's stream list was empty");
    const embedUrl = streams[0].embedUrl;

    const { playlist } = await resolveFallbackMaster(embedUrl);
    return new Response(playlist, {
      status: 200,
      headers: { ...headers, 'Content-Type': 'application/vnd.apple.mpegurl', 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: `${e.name || 'Error'}: ${e.message || e}`, matchedTitle: matchTitle }), {
      status: 502, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
}
