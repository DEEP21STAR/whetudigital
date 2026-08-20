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
// The Widevine LICENSE endpoint (c.mjh.nz/tvnz-1-wv -> switch.tv) was
// separately confirmed to send Access-Control-Allow-Origin: * (wildcard,
// genuine) via a real OPTIONS preflight check -- that path was never broken
// and does NOT go through this proxy. Segment URLs live on the SAME
// restricted CloudFront domain as the manifest (confirmed: a direct segment
// URL also returns 200 with no ACAO header), so both need proxying, not just
// the manifest.
//
// Used via Shaka's registerRequestFilter() in lounge.html (not a manifest
// XML rewrite): the player resolves the DASH SegmentTemplate against the
// REAL upstream base URL exactly as authored, then this filter rewrites each
// already-resolved absolute request URI to route through here right before
// the fetch happens. Locked to the one real TVNZ CDN domain -- not a general
// open proxy.
export const config = { runtime: 'edge' };

const ALLOWED_HOST_RX = /^[a-z0-9-]+\.streaming-live-api\.tvnz\.co\.nz$/i;

export async function GET(req) {
  const url = new URL(req.url);
  const target = url.searchParams.get('u') || '';
  const headers = { 'Access-Control-Allow-Origin': '*' };

  let targetUrl;
  try { targetUrl = new URL(target); } catch (e) {
    return new Response(JSON.stringify({ error: 'u must be an absolute https URL' }), {
      status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
  if (targetUrl.protocol !== 'https:' || !ALLOWED_HOST_RX.test(targetUrl.hostname)) {
    return new Response(JSON.stringify({ error: 'u must be a *.streaming-live-api.tvnz.co.nz https URL' }), {
      status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  let res;
  try {
    res = await fetch(targetUrl.href);
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
    const baseUrl = targetUrl.href.slice(0, targetUrl.href.lastIndexOf('/') + 1);
    const rewritten = /<BaseURL>/i.test(text)
      ? text
      : text.replace(/(<MPD\b[^>]*>)/i, `$1<BaseURL>${baseUrl}</BaseURL>`);
    return new Response(rewritten, { status: 200, headers: respHeaders });
  }

  return new Response(res.body, { status: 200, headers: respHeaders });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*' } });
}
