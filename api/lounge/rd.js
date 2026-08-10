export const config = { runtime: 'edge' };

// Real-Debrid CORS passthrough -- api.real-debrid.com sends no
// Access-Control-Allow-Origin header, so a browser fetch to it from Lounge
// dies at preflight ("Something went wrong resolving this stream"). Ported
// from nexus_control_relay.py's _rd_proxy (C:\NEXUS). No server-side secret:
// the RD bearer token is Lounge's own (stored client-side), forwarded as-is.
//
// Sub-path travels as a ?path= query param, NOT as URL segments
// (/rd/torrents/addMagnet) -- verified live 2026-08-10 that Vercel's
// [...path].js catch-all only matched a single segment on this project's
// Edge Function routing, 404ing at the platform level (before this code
// ever ran) on anything with a slash in it, e.g. torrents/addMagnet. A
// single static file with a query param sidesteps that entirely.
export default async function handler(req) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '3600',
  };
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });

  const url = new URL(req.url);
  const rest = (url.searchParams.get('path') || '').replace(/^\/+/, '');
  if (!/^[A-Za-z0-9/_.-]{1,200}$/.test(rest)) {
    return new Response(JSON.stringify({ error: 'bad rd path' }), {
      status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  const target = 'https://api.real-debrid.com/rest/1.0/' + rest;
  const fwdHeaders = {};
  const auth = req.headers.get('authorization');
  if (auth) fwdHeaders['Authorization'] = auth;
  const ctype = req.headers.get('content-type');
  if (ctype) fwdHeaders['Content-Type'] = ctype;

  let body;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const text = await req.text();
    if (text) body = text;
  }

  let rdRes;
  try {
    rdRes = await fetch(target, { method: req.method, headers: fwdHeaders, body });
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
