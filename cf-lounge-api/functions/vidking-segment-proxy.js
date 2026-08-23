// Ported from Vercel api/lounge/vidking-segment-proxy.js (edge runtime) to
// Cloudflare Pages Functions -- same Web Fetch API shape, no changes needed
// beyond the export convention (onRequestGet/onRequestOptions instead of
// named GET/OPTIONS). See the Vercel source for full context/history.
const ALLOWED_HOST_RX = /\.(top)$/i;
const ALLOWED_PATH_RX = /^\/vd\//i;

export function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Range',
    },
  });
}

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const target = url.searchParams.get('u') || '';
  const headers = { 'Access-Control-Allow-Origin': '*' };

  let targetUrl;
  try { targetUrl = new URL(target); } catch (e) {
    return new Response(JSON.stringify({ error: 'u must be an absolute https URL' }), {
      status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
  if (targetUrl.protocol !== 'https:' || !ALLOWED_HOST_RX.test(targetUrl.hostname) || !ALLOWED_PATH_RX.test(targetUrl.pathname)) {
    return new Response(JSON.stringify({ error: 'u must be a https://*.top/vd/... vidking CDN URL' }), {
      status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  const upstreamHeaders = { Origin: 'https://www.vidking.net', Referer: 'https://www.vidking.net/' };
  const range = request.headers.get('range');
  if (range) upstreamHeaders.Range = range;

  let res;
  try {
    res = await fetch(targetUrl.href, { headers: upstreamHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ error: `upstream fetch failed: ${e.message}` }), {
      status: 502, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
  if (!res.ok || !res.body) {
    return new Response(JSON.stringify({ error: `upstream HTTP ${res.status}` }), {
      status: 502, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  const respHeaders = { ...headers, 'Cache-Control': 'no-store' };
  ['content-type', 'content-length', 'content-range', 'accept-ranges'].forEach((h) => {
    const v = res.headers.get(h);
    if (v) respHeaders[h === 'content-type' ? 'Content-Type' : h] = v;
  });

  return new Response(res.body, { status: res.status, headers: respHeaders });
}
