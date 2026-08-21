// TVNZ DASH manifest + segment proxy (2026-08-20).
//
// Why this exists: Deep reported "Shaka load error 1002" on TVNZ 1/2/Duke
// live (Telegram, Mobile LMC, screenshot). 1002 is Shaka's HTTP_ERROR --
// researched via WebSearch, not guessed: the browser's own request was
// rejected. A prior session pass (v160) wrongly chased this as a VPN/geo
// problem; Deep's own screenshot of the app's VPN panel showed his phone as
// genuinely New Zealand / One NZ Group, which should have ruled that out
// sooner. Root cause, confirmed via curl with real Origin headers 2026-08-20:
//   curl -I -H "Origin: http://<lounge-host>" https://tvnz-1.streaming-live-api.tvnz.co.nz/...index.mpd
//     -> no Access-Control-Allow-Origin at all for an arbitrary origin
//   curl -I -H "Origin: https://www.tvnz.co.nz" <same url>
//     -> Access-Control-Allow-Origin: https://www.tvnz.co.nz (echoes an allowlist, doesn't wildcard)
// TVNZ's manifest/segment CDN (MediaPackage + CloudFront) only answers CORS
// for their own site's origin -- this is a CORS rejection, not a DRM,
// license, or geography problem. It has nothing to do with any VPN.
//
// UPDATE 2026-08-21: the Widevine LICENSE endpoint (c.mjh.nz/tvnz-1-wv) DOES
// send a wildcard ACAO on its own OPTIONS preflight, but that's a 307
// redirect to fvnz-capi-prod.switch.tv -- and THAT final destination only
// allows "https://fvnz-smart-tile-prod.switch.tv" (TVNZ's own web player),
// not an arbitrary origin. Confirmed with a real POST (garbage challenge
// body, expected an INVALID_LICENSE_CHALLENGE reply, got exactly that --
// the endpoint IS reachable and functioning, only CORS blocks it). Same
// redirect-hides-the-real-CORS-failure shape as the i.mjh.nz manifest bug
// above -- the OLD comment here was wrong (an OPTIONS preflight checks the
// REDIRECT response's headers, never followed the 307 to see the real
// destination's policy). License requests now proxy too, via POST support
// below.
//
// Used via Shaka's registerRequestFilter() in lounge.html (not a manifest
// XML rewrite): the player resolves the DASH SegmentTemplate against the
// REAL upstream base URL exactly as authored, then this filter rewrites each
// already-resolved absolute request URI to route through here right before
// the fetch happens. Locked to the one real TVNZ CDN domain -- not a general
// open proxy.
export const config = { runtime: 'edge' };

const ALLOWED_HOST_RX = /^[a-z0-9-]+\.streaming-live-api\.tvnz\.co\.nz$/i;
// i.mjh.nz's own redirect response DOES send a wildcard ACAO -- but the
// FINAL destination it 302s to (streaming-live-api.tvnz.co.nz) does not, and
// the fetch spec checks CORS against the final response after redirects are
// followed, not the redirect itself. That makes the browser's own request to
// i.mjh.nz/.r/tvnz-*.mpd fail with a CORS-flavoured net::ERR_FAILED before
// this proxy ever gets a chance to help -- confirmed live 2026-08-21 via a
// real device repro after the streaming-live-api-only fix above was proven
// only up to the manifest/segment layer, never traced back to this earlier
// hop. Allowing i.mjh.nz here lets THIS server follow the redirect itself
// (fetch() does that natively, no CORS applies to server-to-server calls)
// and re-serve the final TVNZ response, same as any other proxied request.
const ALLOWED_REDIRECTOR_RX = /^i\.mjh\.nz$/i;
// c.mjh.nz is the SAME redirector service as i.mjh.nz (mjh.nz runs both),
// just for license requests instead of manifests -- pinned to /tvnz-*-wv
// paths below, same reasoning as the i.mjh.nz manifest pin.
const ALLOWED_LICENSE_REDIRECTOR_RX = /^c\.mjh\.nz$/i;

async function handleProxy(req, method) {
  const url = new URL(req.url);
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
  // i.mjh.nz/c.mjh.nz are general redirector services for many broadcasters,
  // not just TVNZ -- pinning the path here means this proxy can only ever be
  // pointed at a TVNZ redirect through them, never an arbitrary third-party
  // stream or license server.
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
      // Shaka's Widevine license request: binary challenge body, whatever
      // content-type it sent. Forwarded as-is -- this proxy re-serves
      // exactly what the license server needs, not a guessed content-type.
      const body = await req.arrayBuffer();
      const reqContentType = req.headers.get('content-type') || 'application/octet-stream';
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
  const respHeaders = {
    ...headers,
    // Passed through, not hardcoded -- unlike skysegment.js's fixed
    // video/mp2t (that proxy only ever serves one mislabeled type), this
    // one serves both the XML manifest (application/dash+xml) and MP4
    // segments (video/mp4) through the same endpoint, and TVNZ's own
    // Content-Type is correct for both (confirmed via curl -I).
    'Content-Type': contentType,
    // Manifest is "type=dynamic" (live, re-fetched every couple seconds by
    // the player itself) and segments are one-shot/immutable once
    // numbered -- no-store is correct for both, this is a live stream, not
    // a poster image.
    'Cache-Control': 'no-store',
  };

  // The manifest has no <BaseURL> of its own (confirmed: real TVNZ manifests
  // resolve SegmentTemplate paths against the manifest's OWN fetch URL).
  // Shaka does the same -- but since Shaka fetched the manifest FROM THIS
  // PROXY, not from TVNZ directly, an unmodified manifest makes it resolve
  // every segment/init URL against OUR domain instead of TVNZ's, producing
  // 404s here and the exact "Shaka error 1002 / HTTP_ERROR" Deep kept
  // hitting even after the manifest-level CORS fix shipped (2026-08-21,
  // found via live device repro after the original fix was proven only at
  // the manifest layer with curl, never traced through Shaka's actual
  // relative-URL resolution). Fix: inject an explicit <BaseURL> pointing
  // back at TVNZ's real manifest directory, so Shaka resolves segment URIs
  // as absolute TVNZ URLs -- the existing client-side registerRequestFilter
  // in lounge.html then catches those and routes them through this same
  // proxy, exactly like the manifest request itself.
  const isManifest = contentType.includes('dash+xml') || targetUrl.pathname.endsWith('.mpd');
  if (isManifest) {
    const text = await res.text();
    // res.url is the FINAL URL after fetch() follows any redirect (e.g. the
    // i.mjh.nz -> streaming-live-api.tvnz.co.nz hop) -- using targetUrl.href
    // here would inject the wrong base when the request came in via the
    // redirector, since that URL was never where the manifest actually lives.
    const finalUrl = res.url || targetUrl.href;
    const baseUrl = finalUrl.slice(0, finalUrl.lastIndexOf('/') + 1);
    const rewritten = /<BaseURL>/i.test(text)
      ? text
      : text.replace(/(<MPD\b[^>]*>)/i, `$1<BaseURL>${baseUrl}</BaseURL>`);
    return new Response(rewritten, { status: 200, headers: respHeaders });
  }

  return new Response(res.body, { status: 200, headers: respHeaders });
}

export async function GET(req) {
  return handleProxy(req, 'GET');
}

export async function POST(req) {
  return handleProxy(req, 'POST');
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
