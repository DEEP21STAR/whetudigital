// Ported from Vercel api/lounge/skysport-nz.js (edge runtime).
const DLHD_BASE = 'https://dlhd.st';
const TTL_MS = 3600 * 1000;
const cache = globalThis.__loungeSkysportCache || (globalThis.__loungeSkysportCache = { ts: 0, data: [] });

async function fetchSkysportNzIds() {
  if (Date.now() - cache.ts < TTL_MS && cache.data.length) return cache.data;
  try {
    const res = await fetch(`${DLHD_BASE}/24-7-channels.php`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    const pattern = /data-title="sky sport (\d+) nz"[^>]*>[\s\S]*?ID:\s*(\d+)/gi;
    const results = [];
    let m;
    while ((m = pattern.exec(html))) {
      const cid = m[2];
      results.push({ n: parseInt(m[1], 10), id: parseInt(cid, 10), url: `${DLHD_BASE}/watch.php?id=${cid}` });
    }
    results.sort((a, b) => a.n - b.n);
    if (results.length) {
      cache.data = results;
      cache.ts = Date.now();
    }
    return results;
  } catch {
    return cache.data;
  }
}

export async function onRequest({ request }) {
  const corsHeaders = { 'Access-Control-Allow-Origin': '*' };
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });

  const channels = await fetchSkysportNzIds();
  return new Response(JSON.stringify({ channels }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
