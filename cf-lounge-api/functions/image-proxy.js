// Ported from Vercel api/lounge/image-proxy.js (edge runtime).
export async function onRequestGet({ request }) {
  const url = new URL(request.url);
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
      'Cache-Control': 'public, max-age=604800, immutable',
    },
  });
}

export function onRequestOptions() {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*' } });
}
