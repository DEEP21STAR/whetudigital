// Ported from Vercel api/lounge/image-proxy.js (edge runtime).
//
// Accepts either ?url=<full image.tmdb.org URL> (legacy, kept for any
// cached/bookmarked links) or ?path=<poster path>&size=<size> (2026-08-29,
// added when Deep hit a network that blocked posters -- the fallback route
// through this proxy was meant to dodge a host-level block, but ?url= still
// puts the literal string "image.tmdb.org" in the request line as plain
// text, which a URL-keyword/DPI filter can match regardless of which host
// it's actually going to. ?path=/size= never puts that string in the
// outgoing client request at all -- the TMDB URL is built server-side.
const TMDB_SIZES = new Set(['w92', 'w154', 'w185', 'w300', 'w342', 'w500', 'w780', 'original']);

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const headers = { 'Access-Control-Allow-Origin': '*' };

  let target;
  const path = url.searchParams.get('path');
  if (path !== null) {
    const size = url.searchParams.get('size') || 'original';
    if (!TMDB_SIZES.has(size) || !/^\/[\w.]+$/.test(path)) {
      return new Response(JSON.stringify({ error: 'invalid path or size' }), {
        status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }
    target = `https://image.tmdb.org/t/p/${size}${path}`;
  } else {
    target = url.searchParams.get('url') || '';
    if (!/^https:\/\/image\.tmdb\.org\/t\/p\/\w+\/[\w.]+$/.test(target)) {
      return new Response(JSON.stringify({ error: 'url must be a plain image.tmdb.org poster/backdrop path' }), {
        status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }
  }

  let res;
  try {
    res = await fetch(target);
  } catch (e) {
    return new Response(JSON.stringify({ error: `upstream fetch failed: ${e.message}` }), {
      status: 502, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
  if (!res.ok) {
    return new Response(JSON.stringify({ error: `upstream HTTP ${res.status}` }), {
      status: 502, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  return new Response(res.body, {
    status: 200,
    headers: {
      ...headers,
      'Content-Type': res.headers.get('content-type') || 'image/jpeg',
      'Cache-Control': 'public, max-age=604800, immutable',
    },
  });
}

export function onRequestOptions() {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*' } });
}
