export const config = { runtime: 'edge' };

// Sky Sport / DaddyLive segment proxy. skystream.js resolves a media
// playlist whose segments are pre-signed Cloudflare R2 URLs -- R2 sends no
// Access-Control-Allow-Origin header (confirmed: OPTIONS preflight returns
// 403, GET returns none), so hls.js in the browser silently discards every
// segment fetch cross-origin. This proxy fetches server-side (no CORS
// applies server-to-server) and re-serves the bytes same-origin with CORS
// headers attached. The `.zst`/`application/zstd` naming from upstream is
// mislabeled -- the bytes are plain MPEG-TS (0x47 sync byte, exact 188-byte
// packet alignment verified directly) -- so Content-Type is forced to
// video/mp2t rather than trusted from upstream.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export default async function handler(req) {
  const headers = { 'Access-Control-Allow-Origin': '*' };
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });

  const url = new URL(req.url);
  const target = url.searchParams.get('u');
  if (!target || !/^https:\/\//.test(target)) {
    return new Response(JSON.stringify({ error: 'u=<absolute https url> required' }), {
      status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  try {
    const upstream = await fetch(target, { headers: { 'User-Agent': UA, Accept: '*/*' } });
    if (!upstream.ok || !upstream.body) throw new Error(`HTTP ${upstream.status}`);
    return new Response(upstream.body, {
      status: 200,
      headers: { ...headers, 'Content-Type': 'video/mp2t', 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: `${e.name || 'Error'}: ${e.message || e}` }), {
      status: 502, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
}
