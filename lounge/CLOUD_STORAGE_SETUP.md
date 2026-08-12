# Lounge Cloud Storage Setup — one-time, ~3 minutes

Unlocks TWO features at once: cloud EPG (program guide without your PC on)
and cloud watch-history/resume sync (Continue Watching across devices without
your PC on). Both `api/lounge/epg.js` and `api/lounge/reel.js` already ship
in this repo — they just 501 cleanly ("cloud storage not set up yet") until
this one step is done, and everything keeps working through your PC's local
relay exactly as it does today in the meantime.

## Step 1 — Install the Redis integration

**WHERE:** Any browser → vercel.com/dashboard → the `whetudigital` project

1. Click **Storage** in the left sidebar.
2. Click **Create Database** (or **Browse Marketplace** if that's what's shown).
3. Search for **Upstash** and select **Upstash for Redis** (or just "Redis" —
   Vercel's own KV product was retired in 2024; Upstash via the Marketplace
   is the current replacement and is what these two functions expect).
4. Pick the **free tier** — Upstash's free plan covers this comfortably (EPG
   and watch-history are small, infrequently-written data, nowhere near the
   free tier's request/storage limits).
5. Choose a region close to where the Vercel functions run (Sydney/`syd1` if
   offered, otherwise closest available) and confirm creation.

## Step 2 — Connect it to this project

1. Still on the Storage/database screen, click **Connect Project**.
2. Select **whetudigital**.
3. Confirm. Vercel automatically adds two environment variables to the
   project — `KV_REST_API_URL` and `KV_REST_API_TOKEN` — you don't need to
   copy/paste anything yourself.

## Step 3 — Redeploy

The env vars only take effect on a NEW deployment, not retroactively:

1. Vercel dashboard → **Deployments** tab → the latest deployment → **⋯** menu → **Redeploy**.
   (Or just push any commit — the next deploy picks the vars up automatically.)

## Step 4 — (Optional but recommended) Set a real PIN

Both cloud functions default to PIN `5591` if `NEXUS_PIN` isn't set — the
same default Lounge itself ships with. That's fine on your home LAN, but
these two endpoints are reachable from the open internet the moment DNS
points at them, so a custom PIN is worth the 30 seconds:

1. Vercel dashboard → **Settings** → **Environment Variables**.
2. Add `NEXUS_PIN` = a 4-8 digit PIN of your choice.
3. In Lounge's own Settings screen, set the matching remote PIN (same field
   already used for `/control` and `/play`) so the app sends the new value.
4. Redeploy again for the new env var to take effect.

## How to verify it worked

Once redeployed, open browser dev tools on `lounge.whetudigital.co.nz` and
run:

```js
fetch('https://www.whetudigital.co.nz/api/lounge/reel').then(r => r.json()).then(console.log)
```

- `{"error": "cloud storage not set up yet", "configured": false}` → not
  connected yet, repeat Steps 1-3.
- `{"name": "Lounge Reel", "items": [...], ...}` → working.

Continue Watching and the program guide will then keep working even with
your PC fully off, the same way Real-Debrid/Sky Sport/subtitles already do.
