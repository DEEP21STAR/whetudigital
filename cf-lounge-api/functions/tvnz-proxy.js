// Ported from Vercel api/lounge/tvnz-proxy.js (edge runtime). Same logic,
// Web Fetch API only -- see Vercel source for full CORS/CDN history.
const ALLOWED_HOST_RX = /^[a-z0-9-]+\.streaming-live-api\.tvnz\.co\.nz$/i;
const ALLOWED_REDIRECTOR_RX = /^i\.mjh\.nz$/i;
const ALLOWED_LICENSE_REDIRECTOR_RX = /^c\.mjh\.nz$/i;

async function handleProxy(request, method) {
  const url = new URL(request.url);
  const target = url.searchParams.get('u') || '';
  const headers = { 'Access-Control-Allow-Origin': '*' };

  let targetUrl;
  try { targetUrl = new URL(target); } catch (e) {
    return new Response(JSON.stringify({ error: 'u must be an absolute https URL' }), {
      status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
  const isRedirector = ALLOWED_REDIRECTOR_RX.test(targetUrl.hostname);
  const isLicenseRedirector = ALLOWED_LICENSE_REDIRECTOR_RX.test(targetUrl.hostname);
  if (targetUrl.protocol !== 'https:' || !(ALLOWED_HOST_RX.test(targetUrl.hostname) || isRedirector || isLicenseRedirector)) {
    return new Response(JSON.stringify({ error: 'u must be a *.streaming-live-api.tvnz.co.nz, i.mjh.nz, or c.mjh.nz https URL' }), {
      status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
  if (isRedirector && !/^\/\.r\/tvnz-/i.test(targetUrl.pathname)) {
    return new Response(JSON.stringify({ error: 'i.mjh.nz path must be a /.r/tvnz-* redirect' }), {
      status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
  if (isLicenseRedirector && !/^\/tvnz-.*-wv$/i.test(targetUrl.pathname)) {
    return new Response(JSON.stringify({ error: 'c.mjh.nz path must be a /tvnz-*-wv license redirect' }), {
      status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  let res;
  try {
    if (method === 'POST') {
      const body = await request.arrayBuffer();
      const reqContentType = request.headers.get('content-type') || 'application/octet-stream';
      res = await fetch(targetUrl.href, { method: 'POST', body, headers: { 'Content-Type': reqContentType } });
    } else {
      res = await fetch(targetUrl.href);
    }
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

  const contentType = res.headers.get('content-type') || 'application/octet-stream';
  const respHeaders = { ...headers, 'Content-Type': contentType, 'Cache-Control': 'no-store' };

  const isManifest = contentType.includes('dash+xml') || targetUrl.pathname.endsWith('.mpd');
  if (isManifest) {
    const text = await res.text();
    const finalUrl = res.url || targetUrl.href;
    const baseUrl = finalUrl.slice(0, finalUrl.lastIndexOf('/') + 1);
    const rewritten = /<BaseURL>/i.test(text)
      ? text
      : text.replace(/(<MPD\b[^>]*>)/i, `$1<BaseURL>${baseUrl}</BaseURL>`);
    return new Response(rewritten, { status: 200, headers: respHeaders });
  }

  return new Response(res.body, { status: 200, headers: respHeaders });
}

export async function onRequestGet({ request }) {
  return handleProxy(request, 'GET');
}

export async function onRequestPost({ request }) {
  return handleProxy(request, 'POST');
}

export function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
