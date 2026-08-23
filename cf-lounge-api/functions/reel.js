// Ported from Vercel api/lounge/reel.js. Uses Cloudflare's native KV
// binding (env.LOUNGE_KV) instead of Upstash-via-REST -- Vercel's
// KV_REST_API_URL/TOKEN are Marketplace integration-store secrets that
// can't be retrieved via API, so there was nothing to mirror. Redis HASH
// (per-field HGET/HSET/HDEL) has no direct KV equivalent, so items and
// tombstones are each stored as ONE JSON object per key
// (lounge:reel:items, lounge:reel:tombstones), read-modify-written on
// every change. Fine at this app's real scale (personal use, occasional
// writes) -- not a general-purpose concurrent-write store. All validation/
// conflict-resolution logic is otherwise unchanged from the Vercel source.
const REEL_NAME = 'Lounge Reel';
const REEL_MAX_ITEMS = 60;
const REEL_TOMBSTONE_TTL_S = 30 * 86400;
const RATE_LIMIT_WINDOW_S = 3600;
const RATE_LIMIT_MAX = 20;

async function getObj(env, key) {
  const val = await env.LOUNGE_KV.get(key, 'json');
  return val || {};
}

function clientIp(request) {
  return request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
}

async function pinOk(request, env) {
  const pin = request.headers.get('x-nexus-pin') || '';
  const expected = env.NEXUS_PIN || '5591';
  const rlKey = `lounge:reel:rl:${clientIp(request)}`;
  const count = (await env.LOUNGE_KV.get(rlKey, 'json')) || 0;
  await env.LOUNGE_KV.put(rlKey, JSON.stringify(count + 1), { expirationTtl: RATE_LIMIT_WINDOW_S });
  if (count + 1 > RATE_LIMIT_MAX) return 'rate-limited';
  return pin === expected ? true : 'bad-pin';
}

function reelStr(val, limit) {
  if (typeof val !== 'string') return null;
  const v = val.trim();
  return v ? v.slice(0, limit) : null;
}

function reelInt(val, lo = 0, hi = 1e7) {
  const n = Math.trunc(Number(val));
  if (!Number.isFinite(n)) return null;
  return n >= lo && n <= hi ? n : null;
}

export async function onRequest({ request, env }) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Nexus-Pin',
    'Access-Control-Max-Age': '3600',
    'Content-Type': 'application/json',
  };
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (!env.LOUNGE_KV) return new Response(JSON.stringify({ error: 'cloud storage not set up yet', configured: false }), { status: 501, headers });

  const url = new URL(request.url);
  const itemId = (url.searchParams.get('id') || '').trim();

  if (request.method === 'GET') {
    const items = await getObj(env, 'lounge:reel:items');
    const tombs = await getObj(env, 'lounge:reel:tombstones');
    const list = Object.values(items).sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0));
    const now = Date.now() / 1000;
    const freshTombs = {};
    for (const [id, ts] of Object.entries(tombs)) {
      if (now - Number(ts) < REEL_TOMBSTONE_TTL_S) freshTombs[id] = ts;
    }
    return new Response(JSON.stringify({
      name: REEL_NAME, items: list, tombstones: freshTombs, server_time: now,
    }), { status: 200, headers });
  }

  if (request.method === 'POST') {
    const gate = await pinOk(request, env);
    if (gate === 'bad-pin') return new Response(JSON.stringify({ error: 'bad pin' }), { status: 401, headers });
    if (gate === 'rate-limited') return new Response(JSON.stringify({ error: 'too many attempts, try again later' }), { status: 429, headers });

    let payload;
    try { payload = await request.json(); } catch { return new Response(JSON.stringify({ error: 'invalid JSON body' }), { status: 400, headers }); }

    const id = reelStr(payload.id, 200);
    const title = reelStr(payload.title, 200);
    const position = reelInt(payload.position_seconds ?? payload.position);
    const duration = reelInt(payload.duration_seconds ?? payload.duration);
    if (!id || !title) return new Response(JSON.stringify({ error: 'id and title required' }), { status: 400, headers });
    if (position === null || duration === null || duration <= 0) {
      return new Response(JSON.stringify({ error: 'position_seconds and duration_seconds required (duration > 0)' }), { status: 400, headers });
    }

    const itemType = payload.type === 'tv' ? 'tv' : 'movie';
    const now = Date.now() / 1000;
    let updated = Number(payload.updated_at);
    if (!Number.isFinite(updated) || updated > now + 300 || updated < now - 86400) updated = now;

    const entry = {
      id, title, type: itemType,
      season: itemType === 'tv' ? reelInt(payload.season, 0, 100) : null,
      episode: itemType === 'tv' ? reelInt(payload.episode, 0, 10000) : null,
      tmdb_id: reelInt(payload.tmdb_id ?? payload.tmdbId, 0, 1e9),
      position_seconds: position,
      duration_seconds: duration,
      poster: reelStr(payload.poster, 400),
      backdrop: reelStr(payload.backdrop, 400),
      device: reelStr(payload.device, 40) || 'unknown',
      updated_at: updated,
    };

    const tombs = await getObj(env, 'lounge:reel:tombstones');
    const tombTs = tombs[id] != null ? Number(tombs[id]) : null;
    if (tombTs !== null && tombTs >= updated) {
      return new Response(JSON.stringify({ ok: true, ignored: 'removed on another device' }), { status: 200, headers });
    }
    const items = await getObj(env, 'lounge:reel:items');
    const prev = items[id] || null;
    if (prev && (prev.updated_at || 0) > updated) {
      return new Response(JSON.stringify({ ok: true, ignored: 'older than stored position' }), { status: 200, headers });
    }

    if (tombs[id] != null) { delete tombs[id]; await env.LOUNGE_KV.put('lounge:reel:tombstones', JSON.stringify(tombs)); }
    items[id] = entry;

    const sorted = Object.values(items).sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0));
    const overflow = sorted.slice(REEL_MAX_ITEMS);
    for (const e of overflow) delete items[e.id];

    await env.LOUNGE_KV.put('lounge:reel:items', JSON.stringify(items));
    return new Response(JSON.stringify({ ok: true, item: entry }), { status: 200, headers });
  }

  if (request.method === 'DELETE') {
    if (!itemId || itemId.length > 200) {
      return new Response(JSON.stringify({ error: 'id required, e.g. ?id=movie%3ADune' }), { status: 400, headers });
    }
    const gate = await pinOk(request, env);
    if (gate === 'bad-pin') return new Response(JSON.stringify({ error: 'bad pin' }), { status: 401, headers });
    if (gate === 'rate-limited') return new Response(JSON.stringify({ error: 'too many attempts, try again later' }), { status: 429, headers });

    const items = await getObj(env, 'lounge:reel:items');
    delete items[itemId];
    await env.LOUNGE_KV.put('lounge:reel:items', JSON.stringify(items));

    const tombs = await getObj(env, 'lounge:reel:tombstones');
    tombs[itemId] = String(Date.now() / 1000);
    await env.LOUNGE_KV.put('lounge:reel:tombstones', JSON.stringify(tombs));

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  }

  return new Response(JSON.stringify({ error: 'method not allowed' }), { status: 405, headers });
}
