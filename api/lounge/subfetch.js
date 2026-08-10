export const config = { runtime: 'edge' };

// Subtitle passthrough -- ported from nexus_control_relay.py's /subfetch
// (C:\NEXUS). dl.opensubtitles.com sends no Access-Control-Allow-Origin
// header, so the page cannot read a subtitle file it has a perfectly good
// signed URL for. This fetches the bytes server-side and hands them back.
// The allowlist is not decoration: without it this is an open forwarder that
// could be pointed at an internal address and read the response through.
// Scheme is pinned to https for the same reason.
export default async function handler(req) {
  const headers = { 'Access-Control-Allow-Origin': '*' };
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });

  const url = new URL(req.url);
  const target = (url.searchParams.get('url') || '').trim();
  let parsed;
  try { parsed = new URL(target); } catch { parsed = null; }
  const host = (parsed?.hostname || '').toLowerCase();
  const allowed = host === 'opensubtitles.com' || host.endsWith('.opensubtitles.com');
  if (!parsed || parsed.protocol !== 'https:' || !allowed) {
    return new Response(JSON.stringify({ error: 'https opensubtitles.com URLs only' }), {
      status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  try {
    // The CDN 403s a bare fetch User-Agent.
    const res = await fetch(target, { headers: { 'User-Agent': 'Lounge/1.0 (+cloud relay)' } });
    if (!res.ok) {
      return new Response(JSON.stringify({ error: `subtitle host returned HTTP ${res.status}` }), {
        status: res.status, headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }
    // Subtitles are tens of KB. A cap keeps a wrong URL from streaming
    // something enormous through the relay.
    const buf = await res.arrayBuffer();
    const capped = buf.byteLength > 4 * 1024 * 1024 ? buf.slice(0, 4 * 1024 * 1024) : buf;
    // text/plain, not text/vtt: this is the raw SRT as served. The page
    // converts it and builds its own blob with the right type.
    return new Response(capped, {
      status: 200,
      headers: { ...headers, 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: `subtitle fetch failed: ${e.message || e}` }), {
      status: 502, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
}
