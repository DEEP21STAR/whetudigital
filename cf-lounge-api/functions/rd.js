// Ported from Vercel api/lounge/rd.js (edge runtime).
export async function onRequest({ request }) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '3600',
  };
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });

  const url = new URL(request.url);
  const rest = (url.searchParams.get('path') || '').replace(/^\/+/, '');
  if (!/^[A-Za-z0-9/_.-]{1,200}$/.test(rest)) {
    return new Response(JSON.stringify({ error: 'bad rd path' }), {
      status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  const target = 'https://api.real-debrid.com/rest/1.0/' + rest;
  const fwdHeaders = {};
  const auth = request.headers.get('authorization');
  if (auth) fwdHeaders['Authorization'] = auth;
  const ctype = request.headers.get('content-type');
  if (ctype) fwdHeaders['Content-Type'] = ctype;

  let body;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const text = await request.text();
    if (text) body = text;
  }

  let rdRes;
  try {
    rdRes = await fetch(target, { method: request.method, headers: fwdHeaders, body });
  } catch (e) {
    return new Response(JSON.stringify({ error: `real-debrid unreachable: ${e.message || e}` }), {
      status: 502, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  const data = await rdRes.arrayBuffer();
  return new Response(data, {
    status: rdRes.status,
    headers: { ...headers, 'Content-Type': rdRes.headers.get('content-type') || 'application/json' },
  });
}
