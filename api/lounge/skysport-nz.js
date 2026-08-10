export const config = { runtime: 'edge' };

// Sky Sport NZ channel-ID auto-heal -- ported from nexus_control_relay.py's
// fetch_skysport_nz_ids (C:\NEXUS). DaddyLive sends no CORS header, so
// Lounge's own browser JS can never fetch their listing directly. Re-scrapes
// on each cold cache (server-side, best-effort 1hr) so if DaddyLive renumbers
// channels, Lounge picks up new IDs with no code change. Does NOT survive a
// domain change or full page redesign -- needs a human to notice and update
// DLHD_BASE.
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
    // Scrape failed (site down, redesigned, network issue) -- return whatever
    // was last cached, even if stale, rather than nothing.
    return cache.data;
  }
}

export default async function handler(req) {
  const corsHeaders = { 'Access-Control-Allow-Origin': '*' };
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });

  const channels = await fetchSkysportNzIds();
  return new Response(JSON.stringify({ channels }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
