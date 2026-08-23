// Ported from Vercel api/lounge/watchtogether.js. Uses Cloudflare's native
// KV binding (env.LOUNGE_KV) instead of Upstash-via-REST -- Vercel's
// KV_REST_API_URL/TOKEN are Marketplace integration-store secrets, which
// Vercel deliberately does not expose in plaintext through its API (even
// with owner-level access), so there was no value to mirror across. Native
// KV .put()/.get() with expirationTtl is a direct match for the original
// Redis SET ... EX pattern -- no logic change beyond the storage call.
const ROOM_TTL_S = 6 * 3600;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function makeCode() {
  let s = '';
  for (let i = 0; i < 5; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return s;
}

export async function onRequest({ request, env }) {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (!env.LOUNGE_KV) return new Response(JSON.stringify({ error: 'cloud sync not configured' }), { status: 501, headers });

  const url = new URL(request.url);
  const code = (url.searchParams.get('code') || '').trim().toUpperCase();
  const key = code ? `lounge:wt:${code}` : null;

  if (request.method === 'POST' && !code) {
    let body;
    try { body = await request.json(); } catch (e) { body = {}; }
    const newCode = makeCode();
    const state = {
      title: String(body.title || '').slice(0, 200),
      url: String(body.url || '').slice(0, 2000),
      subUrl: String(body.subUrl || '').slice(0, 2000),
      position: Number(body.position) || 0,
      paused: !!body.paused,
      updatedAt: Date.now(),
    };
    await env.LOUNGE_KV.put(`lounge:wt:${newCode}`, JSON.stringify(state), { expirationTtl: ROOM_TTL_S });
    return new Response(JSON.stringify({ code: newCode }), { status: 200, headers });
  }

  if (!code) return new Response(JSON.stringify({ error: 'code required' }), { status: 400, headers });

  if (request.method === 'GET') {
    const val = await env.LOUNGE_KV.get(key);
    if (val == null) return new Response(JSON.stringify({ error: 'room not found or expired' }), { status: 404, headers });
    return new Response(val, { status: 200, headers });
  }

  if (request.method === 'POST' && code) {
    let body;
    try { body = await request.json(); } catch (e) { return new Response(JSON.stringify({ error: 'invalid body' }), { status: 400, headers }); }
    const state = {
      title: String(body.title || '').slice(0, 200),
      url: String(body.url || '').slice(0, 2000),
      subUrl: String(body.subUrl || '').slice(0, 2000),
      position: Number(body.position) || 0,
      paused: !!body.paused,
      updatedAt: Date.now(),
    };
    await env.LOUNGE_KV.put(key, JSON.stringify(state), { expirationTtl: ROOM_TTL_S });
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  }

  if (request.method === 'DELETE' && code) {
    await env.LOUNGE_KV.delete(key);
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  }

  return new Response(JSON.stringify({ error: 'unsupported method' }), { status: 405, headers });
}
