// Ported from Vercel api/lounge/subfetch.js (edge runtime).
export async function onRequest({ request }) {
  const headers = { 'Access-Control-Allow-Origin': '*' };
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });

  const url = new URL(request.url);
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
    const res = await fetch(target, { headers: { 'User-Agent': 'Lounge/1.0 (+cloud relay)' } });
    if (!res.ok) {
      return new Response(JSON.stringify({ error: `subtitle host returned HTTP ${res.status}` }), {
        status: res.status, headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }
    const buf = await res.arrayBuffer();
    const capped = buf.byteLength > 4 * 1024 * 1024 ? buf.slice(0, 4 * 1024 * 1024) : buf;
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
