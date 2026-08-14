// Root-path fix for lounge.whetudigital.co.nz, found 2026-08-14.
//
// vercel.json already has a rewrite for "/" on this host -> /lounge/lounge.html,
// but it never fires: this project's root index.html (the main WHETU marketing
// site) is a real static file at the exact "/" path, and Vercel's filesystem
// check matches an existing static file before evaluating a rewrite for that
// same path. /apk/*, /sw.js, and /lounge.html all work fine because no static
// file collides with THOSE paths -- only the bare "/" does.
//
// Edge Middleware runs before static resolution, so it is the reliable fix.
// Deliberately narrow: only fires for this exact host + exact root path, so
// whetudigital.co.nz's own homepage (a completely different host) is
// untouched, and every other Lounge path keeps using vercel.json as before.
//
// Redirect, not an invisible rewrite: this project has no Next.js and no
// @vercel/edge dependency, and neither is worth adding just for this. The
// URL bar will show /lounge.html after landing -- a cosmetic difference from
// the original intent, not a functional one.
export const config = { matcher: '/' };

export default function middleware(request) {
  const url = new URL(request.url);
  if (url.hostname === 'lounge.whetudigital.co.nz' && url.pathname === '/') {
    url.pathname = '/lounge.html';
    return Response.redirect(url, 307);
  }
}
