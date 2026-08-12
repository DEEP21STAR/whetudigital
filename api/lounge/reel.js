export const config = { runtime: 'edge' };

// Cloud watch-history/resume -- the last of the three "still needs your PC"
// items from the 2026-08-10 migration (RD/Sky Sport/subtitles already moved,
// see getContentBase()'s comment in lounge.html). Wire-compatible with
// nexus_control_relay.py's /reel/progress (reel_upsert/reel_list/reel_delete
// in C:\NEXUS\nexus_control_relay.py) on purpose -- lounge.html's existing
// reelMerge()/reelToLocal()/localToReel() read {items:[...], tombstones:{...}}
// with position_seconds/duration_seconds in whole SECONDS and don't need to
// know or care which backend answered. Getting this shape wrong would not
// crash anything -- it would silently corrupt the merge (deleted items
// reappearing, or the wrong device's position "winning"), which is worse
// than a crash because nothing would report it. Storage is two Redis hashes
// (lounge:reel:items, lounge:reel:tombstones) via Upstash's REST API --
// same zero-dependency style as rd.js/subfetch.js, no SDK. Requires
// KV_REST_API_URL / KV_REST_API_TOKEN (auto-injected once an Upstash Redis
// integration is connected -- see C:\WHETU\lounge\CLOUD_STORAGE_SETUP.md).
// Without those, every route here 501s cleanly so the app's existing
// "still needs your PC" behaviour for Reel is unchanged until that one-time
// setup is done.
//
// Same X-Nexus-Pin scheme as the local relay (Deep's call, 2026-08-06: one
// shared secret for play/control/reel on a personal single-user app, not
// three). Unlike the LAN-only local relay this endpoint is reachable from
// the open internet the moment DNS resolves here, so a bare 4-digit PIN
// with no attempt limit is brute-forceable in seconds -- a per-IP rate
// limit (20 failed attempts/hour, its own Redis key with a TTL) is added
// specifically for that reason; the local relay never needed one.

const REEL_NAME = 'Lounge Reel';
const REEL_MAX_ITEMS = 60;
const REEL_TOMBSTONE_TTL_S = 30 * 86400;

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

function clientIp(req) {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
}

async function pinOk(req) {
  const pin = req.headers.get('x-nexus-pin') || '';
  const expected = process.env.NEXUS_PIN || '5591';
  const rlKey = `lounge:reel:rl:${clientIp(req)}`;
  const rl = await kv(['INCR', rlKey]);
  if (rl.configured) {
    if (rl.result === 1) await kv(['EXPIRE', rlKey, 3600]);
    if (typeof rl.result === 'number' && rl.result > 20) return 'rate-limited';
  }
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

async function hgetallParsed(hashKey) {
  const r = await kv(['HGETALL', hashKey]);
  if (!r.configured) return { configured: false };
  const flat = r.result || [];
  const out = {};
  for (let i = 0; i < flat.length; i += 2) {
    try { out[flat[i]] = JSON.parse(flat[i + 1]); } catch { /* skip corrupt entry */ }
  }
  return { configured: true, entries: out };
}

export default async function handler(req) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Nexus-Pin',
    'Access-Control-Max-Age': '3600',
    'Content-Type': 'application/json',
  };
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });

  const url = new URL(req.url);
  const itemId = (url.searchParams.get('id') || '').trim();

  if (req.method === 'GET') {
    const items = await hgetallParsed('lounge:reel:items');
    if (!items.configured) {
      return new Response(JSON.stringify({ error: 'cloud storage not set up yet', configured: false }), { status: 501, headers });
    }
    const tombs = await hgetallParsed('lounge:reel:tombstones');
    const list = Object.values(items.entries).sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0));
    // Mirrors _reel_save()'s TTL prune -- read-time filtering here rather
    // than proactive deletion (Redis hash fields have no per-field TTL of
    // their own) still keeps a 31-day-old tombstone from permanently
    // blocking a title from ever being re-added.
    const now = Date.now() / 1000;
    const freshTombs = {};
    for (const [id, ts] of Object.entries(tombs.entries || {})) {
      if (now - Number(ts) < REEL_TOMBSTONE_TTL_S) freshTombs[id] = ts;
    }
    return new Response(JSON.stringify({
      name: REEL_NAME, items: list, tombstones: freshTombs, server_time: now,
    }), { status: 200, headers });
  }

  if (req.method === 'POST') {
    const gate = await pinOk(req);
    if (gate === 'bad-pin') return new Response(JSON.stringify({ error: 'bad pin' }), { status: 401, headers });
    if (gate === 'rate-limited') return new Response(JSON.stringify({ error: 'too many attempts, try again later' }), { status: 429, headers });

    let payload;
    try { payload = await req.json(); } catch { return new Response(JSON.stringify({ error: 'invalid JSON body' }), { status: 400, headers }); }

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

    // Same conflict rules as reel_upsert(): a tombstone or a newer stored
    // entry beats a stale/late write instead of silently overwriting it.
    const tombRes = await kv(['HGET', 'lounge:reel:tombstones', id]);
    if (!tombRes.configured) return new Response(JSON.stringify({ error: 'cloud storage not set up yet', configured: false }), { status: 501, headers });
    const tombTs = tombRes.result ? Number(tombRes.result) : null;
    if (tombTs !== null && tombTs >= updated) {
      return new Response(JSON.stringify({ ok: true, ignored: 'removed on another device' }), { status: 200, headers });
    }
    const prevRes = await kv(['HGET', 'lounge:reel:items', id]);
    let prev = null;
    try { prev = prevRes.result ? JSON.parse(prevRes.result) : null; } catch { prev = null; }
    if (prev && (prev.updated_at || 0) > updated) {
      return new Response(JSON.stringify({ ok: true, ignored: 'older than stored position' }), { status: 200, headers });
    }

    await kv(['HDEL', 'lounge:reel:tombstones', id]);
    await kv(['HSET', 'lounge:reel:items', id, JSON.stringify(entry)]);

    // Trim to REEL_MAX_ITEMS, oldest first out -- mirrors _reel_save()'s
    // bound so the hash can't grow forever across years of use.
    const all = await hgetallParsed('lounge:reel:items');
    if (all.configured) {
      const sorted = Object.values(all.entries).sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0));
      const overflow = sorted.slice(REEL_MAX_ITEMS);
      for (const e of overflow) await kv(['HDEL', 'lounge:reel:items', e.id]);
    }

    return new Response(JSON.stringify({ ok: true, item: entry }), { status: 200, headers });
  }

  if (req.method === 'DELETE') {
    if (!itemId || itemId.length > 200) {
      return new Response(JSON.stringify({ error: 'id required, e.g. ?id=movie%3ADune' }), { status: 400, headers });
    }
    const gate = await pinOk(req);
    if (gate === 'bad-pin') return new Response(JSON.stringify({ error: 'bad pin' }), { status: 401, headers });
    if (gate === 'rate-limited') return new Response(JSON.stringify({ error: 'too many attempts, try again later' }), { status: 429, headers });

    const r = await kv(['HDEL', 'lounge:reel:items', itemId]);
    if (!r.configured) return new Response(JSON.stringify({ error: 'cloud storage not set up yet', configured: false }), { status: 501, headers });
    await kv(['HSET', 'lounge:reel:tombstones', itemId, String(Date.now() / 1000)]);
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  }

  return new Response(JSON.stringify({ error: 'method not allowed' }), { status: 405, headers });
}
