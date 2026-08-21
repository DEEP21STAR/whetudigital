// vidking.net (Free Stream lane) headless resolver (2026-08-21) -- MUST run on
// the Node runtime, not Edge, same reason as daddylive-mirror-stream.js:
// launching a real browser needs a real process.
//
// Why this exists: vidking's own frontend calls api.speedracelight.com's
// /seed then /cdn/sources-with-title, but that second call returns an
// ENCRYPTED blob -- vidking's own JS decrypts it client-side before building
// the real HLS manifest URL. There is no plaintext API shortcut (confirmed
// live 2026-08-21: direct curl to sources-with-title returns an opaque
// base64-ish blob, not JSON/a URL). So the manifest URL can only be obtained
// by letting vidking's own JS run once, same headless-browser-and-sniff
// pattern as daddylive-mirror-stream.js and fallback-stream.js.
//
// What's real vs. what's gated (verified with direct curl, 2026-08-21):
//   - The manifest (index-*.m3u8 on moon.peakstorm.top) 403s without
//     `Referer: https://www.vidking.net/`.
//   - The init segment + every media segment (primecrown.top) look openly
//     CORS'd on a plain whole-file GET (200, no Referer needed) -- but hls.js
//     never sends a plain GET for fMP4, it sends Range-header byte requests,
//     and THIS CDN gates ranged requests specifically by Origin (Range +
//     this app's Origin -> 403, Range + Origin: vidking.net -> 206, found
//     live via Playwright after the first deploy tried the "segments are
//     open" assumption and 403'd). So every segment/init URL is rewritten
//     below to route through vidking-segment-proxy.js, which forwards Range
//     with a spoofed Origin -- not just the manifest.
export const config = { runtime: 'nodejs', maxDuration: 60 };

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const MASTER_TTL_MS = 90 * 1000; // same short reuse window as the DaddyLive mirror resolver -- dedupes rapid re-opens, not a claim about the CDN token's real lifetime

const g = globalThis;
const masterCache = g.__loungeVidkingMaster || (g.__loungeVidkingMaster = new Map());

function embedUrl(type, tmdbId, season, episode) {
  const path = type === 'tv' && season && episode
    ? `tv/${tmdbId}/${season}/${episode}`
    : `movie/${tmdbId}`;
  return `https://www.vidking.net/embed/${path}?color=00d4ff&autoPlay=true`;
}

async function resolveManifest(cacheKey, type, tmdbId, season, episode, host) {
  const cached = masterCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < MASTER_TTL_MS) return cached;

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
    let manifestUrl = null;
    page.on('response', (res) => {
      if (!manifestUrl && /index-.*\.m3u8/.test(res.url())) manifestUrl = res.url();
    });

    const url = embedUrl(type, tmdbId, season, episode);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 25000 }).catch(() => {});
    if (!manifestUrl) await page.waitForTimeout(4000); // some titles resolve their source pick a beat after networkidle
    if (!manifestUrl) throw new Error('no .m3u8 manifest request seen -- title may have no Free Stream source');

    // In-page fetch, not page.request: same reasoning as the DaddyLive/
    // fallback resolvers -- Playwright's own Node HTTP client doesn't carry
    // the real browser TLS fingerprint / Referer context, and Cloudflare
    // checks that.
    const manifestFetch = await page.evaluate(async (u) => {
      try { const r = await fetch(u); return { ok: r.ok, status: r.status, text: await r.text() }; }
      catch (e) { return { ok: false, status: 0, text: '', errMsg: String(e) }; }
    }, manifestUrl);
    if (!manifestFetch.ok) throw new Error(`manifest fetch failed | status=${manifestFetch.status} | err=${manifestFetch.errMsg || 'n/a'}`);

    // REAL BUG, found live via Playwright after the first v182 deploy: segment
    // and init URLs are NOT openly accessible the way a plain curl GET
    // suggested -- hls.js's actual requests are Range-header byte fetches,
    // and this CDN gates those specifically by Origin (confirmed: Range +
    // this app's Origin -> 403, Range + Origin: vidking.net -> 206). Every
    // absolute CDN URL in the manifest, including the one hidden inside
    // #EXT-X-MAP's URI="..." attribute (not a plain line, easy to miss --
    // the first version of this rewrite only handled non-# lines and left
    // the init segment unproxied), now routes through
    // vidking-segment-proxy.js, which forwards Range with a spoofed Origin.
    const proxyBase = `https://${host}/api/lounge/vidking-segment-proxy`;
    const toProxied = (absUrl) => `${proxyBase}?u=${encodeURIComponent(absUrl)}`;

    const rewritten = manifestFetch.text.split('\n').map((line) => {
      const mapMatch = line.match(/^(#EXT-X-MAP:URI=")([^"]+)(".*)$/);
      if (mapMatch) return `${mapMatch[1]}${toProxied(new URL(mapMatch[2], manifestUrl).href)}${mapMatch[3]}`;
      const s = line.trim();
      if (s && !s.startsWith('#')) return toProxied(new URL(s, manifestUrl).href);
      return line;
    }).join('\n');

    const entry = { ts: Date.now(), playlist: rewritten };
    masterCache.set(cacheKey, entry);
    return entry;
  } finally {
    await browser.close();
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*' } });
}

export async function GET(req) {
  const headers = { 'Access-Control-Allow-Origin': '*' };
  const url = new URL(req.url, 'http://localhost');
  const type = (url.searchParams.get('type') || 'movie').trim() === 'tv' ? 'tv' : 'movie';
  const tmdbId = (url.searchParams.get('tmdbId') || '').trim();
  const season = (url.searchParams.get('season') || '').trim();
  const episode = (url.searchParams.get('episode') || '').trim();

  if (!/^\d+$/.test(tmdbId)) {
    return new Response(JSON.stringify({ error: 'numeric tmdbId required, e.g. /api/lounge/vidking-resolve?type=movie&tmdbId=27205' }), {
      status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  const cacheKey = `${type}:${tmdbId}:${season}:${episode}`;
  // req.url is a relative path on Vercel's Node runtime (same quirk noted in
  // daddylive-mirror-stream.js) -- the real public host only comes from the
  // Host header, needed here to build absolute proxy URLs for the manifest.
  const host = req.headers.get('host');
  try {
    const { playlist } = await resolveManifest(cacheKey, type, tmdbId, season, episode, host);
    return new Response(playlist, {
      status: 200,
      headers: { ...headers, 'Content-Type': 'application/vnd.apple.mpegurl', 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    masterCache.delete(cacheKey);
    return new Response(JSON.stringify({ error: `${e.name || 'Error'}: ${e.message || e}` }), {
      status: 502, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
}
