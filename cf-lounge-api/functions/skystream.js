// Ported from Vercel api/lounge/skystream.js (edge runtime). Note: the
// segment-proxy base URL below now points at THIS Cloudflare host (relative
// path still resolves correctly since skysegment.js lives alongside this
// file on the same Pages project).
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const DLHD_BASE = 'https://dlhd.st';
const TTL_MS = 120 * 1000;

const cache = globalThis.__loungeSkystreamCache || (globalThis.__loungeSkystreamCache = new Map());

async function fetchText(url, referer) {
  const headers = { 'User-Agent': UA, Accept: '*/*' };
  if (referer) headers['Referer'] = referer;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.text();
}

async function resolveMaster(id) {
  const cached = cache.get(id);
  if (cached && Date.now() - cached.ts < TTL_MS) return cached;

  const watch = `${DLHD_BASE}/watch.php?id=${id}`;
  const html = await fetchText(watch, `${DLHD_BASE}/`);
  const frameRx = new RegExp(`<iframe[^>]+src=["']([^"']*stream-${id}\\.php[^"']*)`);
  const m = html.match(frameRx);
  if (!m) throw new Error('stream frame not found on watch page');
  const streamUrl = new URL(m[1], watch).href;

  const html2 = await fetchText(streamUrl, watch);
  const m2 = html2.match(/<iframe[^>]+src=["']([^"']*premiumtv\/[^"']+)/);
  if (!m2) throw new Error('player frame not found on stream page');
  const playerUrl = new URL(m2[1], streamUrl).href;

  const html3 = await fetchText(playerUrl, streamUrl);
  const m3 = html3.match(/atob\('([A-Za-z0-9+/=]{20,})'\)/);
  if (!m3) throw new Error('stream token not found on player page');
  const master = atob(m3[1]).trim();
  if (!master.includes('.m3u8')) throw new Error('decoded value is not a playlist');

  const p = new URL(playerUrl);
  const entry = { ts: Date.now(), master, referer: `${p.protocol}//${p.host}/` };
  cache.set(id, entry);
  return entry;
}

export default async function handler(request) {
  const headers = { 'Access-Control-Allow-Origin': '*' };
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });

  const url = new URL(request.url);
  const id = (url.searchParams.get('id') || '').trim();
  if (!/^\d+$/.test(id)) {
    return new Response(JSON.stringify({ error: 'numeric id required, e.g. /skystream?id=588' }), {
      status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { master, referer } = await resolveMaster(id);
    const body = await fetchText(master, referer);
    const lines = body.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
    if (!lines.length) throw new Error('master playlist had no variants');
    const mediaUrl = new URL(lines[0], master).href;
    const media = await fetchText(mediaUrl, referer);
    const proxyBase = `${url.origin}/skysegment?u=`;
    const out = media.split('\n').map(line => {
      const s = line.trim();
      if (!s || s.startsWith('#')) return line;
      const abs = s.startsWith('http') ? s : new URL(s, mediaUrl).href;
      return proxyBase + encodeURIComponent(abs);
    });
    return new Response(out.join('\n'), {
      status: 200,
      headers: { ...headers, 'Content-Type': 'application/vnd.apple.mpegurl', 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    cache.delete(id);
    return new Response(JSON.stringify({ error: `${e.name || 'Error'}: ${e.message || e}` }), {
      status: 502, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequest({ request }) {
  return handler(request);
}
