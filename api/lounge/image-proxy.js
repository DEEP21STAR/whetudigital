// Image proxy for canvas-based colour extraction (2026-08-18) -- MUST run on
// the Edge runtime, not Node: this is a pure fetch-and-relay, no browser
// needed, so Edge's lower cold-start is the right call (unlike
// daddylive-mirror-stream.js/fallback-stream.js, which need Playwright and
// are Node-only for that reason specifically).
//
// Why this exists: TMDB's image CDN (image.tmdb.org) sends no
// Access-Control-Allow-Origin header (confirmed via curl -I, 2026-08-18), so
// an <img crossorigin="anonymous"> pointed straight at it either fails to
// load (browser refuses a CORS-anonymous request the server didn't answer)
// or, loaded plain, taints any <canvas> that draws it -- getImageData()
// throws SecurityError either way. Relaying the same bytes through Lounge's
// own domain with an explicit ACAO header sidesteps both failure modes: the
// browser sees a same-origin-permitted response and canvas sampling works.
//
// Locked to image.tmdb.org on purpose -- this is a colour-extraction helper,
// not a general open image proxy.
export const config = { runtime: 'edge' };

export async function GET(req) {
  const url = new URL(req.url);
  const target = url.searchParams.get('url') || '';
  const headers = { 'Access-Control-Allow-Origin': '*' };

  if (!/^https:\/\/image\.tmdb\.org\/t\/p\/\w+\/[\w.]+$/.test(target)) {
    return new Response(JSON.stringify({ error: 'url must be a plain image.tmdb.org poster/backdrop path' }), {
      status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
    });
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
      // Poster art doesn't change once published -- safe to cache hard both
      // at Vercel's edge and in the browser.
      'Cache-Control': 'public, max-age=604800, immutable',
    },
  });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*' } });
}
