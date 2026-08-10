export const config = { runtime: 'edge' };

// DaddyLive stream resolver -- ported from nexus_control_relay.py's
// resolve_daddy_playlist/_resolve_daddy_master (C:\NEXUS), moved here so Sky
// Sport live TV works without Deep's PC relay running. Chain:
//   watch.php?id=N -> iframe /stream/stream-N.php
//                  -> iframe <host>/premiumtv/daddy4.php?id=N
//                  -> that page contains atob('<base64>') = the master .m3u8
// The SEGMENTS in the resolved playlist are absolute pre-signed Cloudflare R2
// URLs needing no headers, so this only ever hands back a playlist -- it
// never proxies video bytes itself.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const DLHD_BASE = 'https://dlhd.st';
const TTL_MS = 120 * 1000; // master URL is token-signed; re-resolve often enough to stay ahead of expiry

// Module-scope cache: best-effort only. Survives while this isolate stays
// warm between invocations, same idiom as the Python relay's in-memory
// cache -- not correctness-critical, just avoids redundant chain-walks.
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

export default async function handler(req) {
  const headers = { 'Access-Control-Allow-Origin': '*' };
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });

  const url = new URL(req.url);
  const id = (url.searchParams.get('id') || '').trim();
  if (!/^\d+$/.test(id)) {
    return new Response(JSON.stringify({ error: 'numeric id required, e.g. /api/lounge/skystream?id=588' }), {
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
    const out = media.split('\n').map(line => {
      const s = line.trim();
      if (s && !s.startsWith('#') && !s.startsWith('http')) return new URL(s, mediaUrl).href;
      return line;
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
