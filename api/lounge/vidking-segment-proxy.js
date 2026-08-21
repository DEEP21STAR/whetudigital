// vidking.net Free Stream segment/init proxy (2026-08-21) -- companion to
// vidking-resolve.js. Edge runtime, not Node: this is a pure passthrough
// fetch (no headless browser), so it doesn't pay Lambda cold-start cost per
// segment, same reasoning as tvnz-proxy.js.
//
// Why this exists (real bug, found live via Playwright after v182's first
// deploy): the original assumption -- "only the manifest needs a Referer,
// segments are openly CORS'd" -- was wrong. curl testing during research only
// ever sent plain whole-file GETs, which DO return 200 with no gate. hls.js's
// real requests for fMP4 init/media segments are always Range-header byte
// requests, and THIS CDN (primecrown.top) gates ranged requests by Origin
// specifically: confirmed via curl that `Range: bytes=0-` + `Origin: <this
// app's domain>` -> 403, the same Range header + `Origin: https://www.vidking.net`
// -> 206, and Range with NO Origin header at all (impossible for a real
// browser cross-origin fetch, which always sends one) -> 206. So every
// ranged segment/init fetch needs to be proxied with a spoofed Origin, not
// just the manifest.
export const config = { runtime: 'edge' };

// vidking rotates its CDN edge hostnames per title/session (moon.peakstorm.top
// for manifests, primecrown.top seen for segments/init so far) -- pinned to
// the /vd/ embed-token path convention rather than a single hostname, same
// "allowlist by the one real shape seen, not a general open proxy" approach
// tvnz-proxy.js uses. Widen this list if a future title resolves through a
// different edge hostname.
const ALLOWED_HOST_RX = /\.(top)$/i;
const ALLOWED_PATH_RX = /^\/vd\//i;

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Range',
    },
  });
}

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
  if (targetUrl.protocol !== 'https:' || !ALLOWED_HOST_RX.test(targetUrl.hostname) || !ALLOWED_PATH_RX.test(targetUrl.pathname)) {
    return new Response(JSON.stringify({ error: 'u must be a https://*.top/vd/... vidking CDN URL' }), {
      status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  const upstreamHeaders = { Origin: 'https://www.vidking.net', Referer: 'https://www.vidking.net/' };
  const range = req.headers.get('range');
  if (range) upstreamHeaders.Range = range; // hls.js always sends this for fMP4 init/media segments -- the exact header that triggers the CDN's Origin check

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

  // REAL BUG, found live via Playwright: 'public, max-age=..., immutable' let
  // Vercel's own edge cache store a 206 response (whatever Range the FIRST
  // request happened to ask for) and then serve that same truncated partial
  // back to every later request for the same URL regardless of its own
  // Range header -- hls.js's init-segment fetch got a cached 1000-of-1212-byte
  // fragment from an earlier `bytes=0-999` test request, and its demuxer threw
  // "Cannot read properties of undefined (reading 'subarray')" trying to
  // parse the truncated moov box. no-store trades away CDN caching (each
  // segment is normally fetched once per playback anyway, so the loss is
  // small) for correctness -- same choice tvnz-proxy.js already makes for its
  // segments.
  const respHeaders = { ...headers, 'Cache-Control': 'no-store' };
  // Passed through, not hardcoded: video/mp4 for both init and media segments
  // here, but Content-Range/Accept-Ranges only exist on the 206 path and
  // must survive for hls.js's own byte-range logic to work.
  ['content-type', 'content-length', 'content-range', 'accept-ranges'].forEach((h) => {
    const v = res.headers.get(h);
    if (v) respHeaders[h === 'content-type' ? 'Content-Type' : h] = v;
  });

  return new Response(res.body, { status: res.status, headers: respHeaders });
}
