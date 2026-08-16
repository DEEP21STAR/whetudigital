export const config = { runtime: 'edge' };

// Watch-together, added 2026-08-16. Same zero-dependency Upstash-via-REST
// pattern as reel.js (see that file's comment for why no SDK) -- a shared
// "room" a host creates and others join by a short code, polled every few
// seconds rather than a real WebSocket/push channel. Polling was the
// deliberate choice: this is a Vercel Edge Function (no persistent
// connection support the way a real server has), and a 3-5s lag on playback
// sync is an acceptable tradeoff against standing up separate WebSocket
// infrastructure for what is, realistically, occasional use between two
// people who already know each other.
//
// One Redis STRING per room (lounge:wt:{code}), JSON-encoded, with a TTL
// so an abandoned room cleans itself up instead of accumulating forever.
// Requires KV_REST_API_URL / KV_REST_API_TOKEN, same as reel.js -- 501s
// cleanly without those rather than crashing.

const ROOM_TTL_S = 6 * 3600; // 6 hours -- long enough for one sitting, short enough not to accumulate
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I -- avoids ambiguity when read aloud/typed

async function kv(cmd) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return { configured: false };
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  const data = await res.json();
  return { configured: true, ok: res.ok, result: data.result, error: data.error };
}

function makeCode() {
  let s = '';
  for (let i = 0; i < 5; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return s;
}

export default async function handler(req) {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });

  const url = new URL(req.url);
  const code = (url.searchParams.get('code') || '').trim().toUpperCase();
  const key = code ? `lounge:wt:${code}` : null;

  if (req.method === 'POST' && !code) {
    // Create a room.
    let body;
    try { body = await req.json(); } catch (e) { body = {}; }
    const newCode = makeCode();
    const state = {
      title: String(body.title || '').slice(0, 200),
      url: String(body.url || '').slice(0, 2000),
      subUrl: String(body.subUrl || '').slice(0, 2000),
      position: Number(body.position) || 0,
      paused: !!body.paused,
      updatedAt: Date.now(),
    };
    const r = await kv(['SET', `lounge:wt:${newCode}`, JSON.stringify(state), 'EX', String(ROOM_TTL_S)]);
    if (!r.configured) return new Response(JSON.stringify({ error: 'cloud sync not configured' }), { status: 501, headers });
    if (!r.ok) return new Response(JSON.stringify({ error: r.error || 'create failed' }), { status: 502, headers });
    return new Response(JSON.stringify({ code: newCode }), { status: 200, headers });
  }

  if (!code) return new Response(JSON.stringify({ error: 'code required' }), { status: 400, headers });

  if (req.method === 'GET') {
    const r = await kv(['GET', key]);
    if (!r.configured) return new Response(JSON.stringify({ error: 'cloud sync not configured' }), { status: 501, headers });
    if (!r.ok || r.result == null) return new Response(JSON.stringify({ error: 'room not found or expired' }), { status: 404, headers });
    return new Response(r.result, { status: 200, headers });
  }

  if (req.method === 'POST' && code) {
    // Host pushes an update. Whole-state overwrite (not a partial patch) --
    // simpler and there is only ever one host writing, so there's no
    // concurrent-writer conflict to resolve.
    let body;
    try { body = await req.json(); } catch (e) { return new Response(JSON.stringify({ error: 'invalid body' }), { status: 400, headers }); }
    const state = {
      title: String(body.title || '').slice(0, 200),
      url: String(body.url || '').slice(0, 2000),
      subUrl: String(body.subUrl || '').slice(0, 2000),
      position: Number(body.position) || 0,
      paused: !!body.paused,
      updatedAt: Date.now(),
    };
    const r = await kv(['SET', key, JSON.stringify(state), 'EX', String(ROOM_TTL_S)]);
    if (!r.configured) return new Response(JSON.stringify({ error: 'cloud sync not configured' }), { status: 501, headers });
    if (!r.ok) return new Response(JSON.stringify({ error: r.error || 'update failed' }), { status: 502, headers });
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  }

  if (req.method === 'DELETE' && code) {
    await kv(['DEL', key]);
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  }

  return new Response(JSON.stringify({ error: 'unsupported method' }), { status: 405, headers });
}
