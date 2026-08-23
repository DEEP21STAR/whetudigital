// Ported from Vercel api/lounge/skysegment.js (edge runtime).
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export async function onRequest({ request }) {
  const headers = { 'Access-Control-Allow-Origin': '*' };
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });

  const url = new URL(request.url);
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
