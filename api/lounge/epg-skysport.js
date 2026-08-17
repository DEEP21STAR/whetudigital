export const config = { runtime: 'edge' };

// Sky Sport NZ EPG (Now/Next strip, "What's Live Now") -- cloud mirror of
// C:\NEXUS\nexus_control_relay.py's fetch_sky_sport_epg(), added 2026-08-17.
// Real gap found while investigating a different report: loadSkySportEpg()
// in lounge.html only ever called getRelayBase()/epg-skysport, with NO
// cloud fallback (unlike the general EPG loader, which has one) -- so this
// feature silently went dark for Deep any time he was off his home LAN,
// exactly the situation he flagged tonight ("away from home"). This is that
// missing fallback.
//
// tvguide.sky.co.nz is a React SPA over a public GraphQL API. Contract
// (captured from the real page's network traffic, documented in the Python
// version, verified unchanged before porting): GET /exp/graph?query=<gql>
// &variables={"id":<groupId>,"date":"YYYY-MM-DD"}. Edge runtime, not Node --
// this is a plain fetch+JSON transform, same class of work skystream.js
// already does successfully on Edge; no browser/filesystem needed here.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const SKY_GRAPH = 'https://api.skyone.co.nz/exp/graph';
const SKY_SPORTS_GROUP = '5P95WEpsEA6TcDMOsPmV19';
const SKY_QUERY = `query getChannelGroup($id: ID!, $date: LocalDate) {
  experience(appId: TV_GUIDE_WEB) {
    channelGroup(id: $id) {
      channels {
        ... on LinearChannel {
          title
          number
          slotsForDay(date: $date) {
            slots {
              startMs
              endMs
              programme {
                ... on Episode { title show { title } }
                ... on Movie { title }
              }
            }
          }
        }
      }
    }
  }
}`;

// Sky's own guide labels channel 58 "Sky Sport Premier League", this app's
// channel list calls the same channel "Sky Sport 8 NZ" -- kept in sync with
// SKY_TITLE_ALIASES in nexus_control_relay.py and normSkyTitle() in lounge.html.
const SKY_TITLE_ALIASES = { skysport8: 'skysportpremierleague' };

function skyNorm(title) {
  return String(title || '').toLowerCase().replace(/\bnz\b/g, '').replace(/[^a-z0-9]/g, '');
}

function dateStr(offsetDays) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

async function fetchDay(dateISO) {
  const qs = new URLSearchParams({
    query: SKY_QUERY,
    variables: JSON.stringify({ id: SKY_SPORTS_GROUP, date: dateISO }),
  });
  const res = await fetch(`${SKY_GRAPH}?${qs}`, {
    headers: { 'User-Agent': UA, Origin: 'https://tvguide.sky.co.nz', Referer: 'https://tvguide.sky.co.nz/' },
  });
  if (!res.ok) throw new Error(`Sky HTTP ${res.status}`);
  const data = await res.json();
  const chans = (((data.data || {}).experience || {}).channelGroup || {}).channels || [];
  const out = {};
  for (const ch of chans) {
    const slots = [];
    for (const s of ((ch.slotsForDay || {}).slots || [])) {
      const prog = s.programme || {};
      const title = prog.title || (prog.show || {}).title;
      if (title && s.startMs && s.endMs) {
        slots.push({ t: String(title).slice(0, 120), s: Math.floor(s.startMs / 1000), e: Math.floor(s.endMs / 1000) });
      }
    }
    if (slots.length) {
      slots.sort((a, b) => a.s - b.s);
      out[skyNorm(ch.title)] = { number: ch.number, slots };
    }
  }
  for (const [ours, theirs] of Object.entries(SKY_TITLE_ALIASES)) {
    if (out[theirs] && !out[ours]) out[ours] = out[theirs];
  }
  return out;
}

export default async function handler(req) {
  const headers = { 'Access-Control-Allow-Origin': '*' };
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });

  const url = new URL(req.url);
  // Default 1 (today only, matching the Python relay's existing behaviour).
  // days=N added for the multi-day ticker -- capped at 5, Sky's own guide
  // doesn't reliably populate schedules further out than that.
  const days = Math.max(1, Math.min(5, parseInt(url.searchParams.get('days') || '1', 10) || 1));

  try {
    const dayResults = await Promise.all(
      Array.from({ length: days }, (_, i) => fetchDay(dateStr(i)).catch(() => ({})))
    );
    // Merge day-by-day into one channel->slots map (today's fetch already
    // covers "now/next" for the existing single-day callers; multi-day
    // callers get every channel's slots concatenated and pre-sorted).
    const merged = {};
    for (const dayMap of dayResults) {
      for (const [key, val] of Object.entries(dayMap)) {
        if (!merged[key]) merged[key] = { number: val.number, slots: [] };
        merged[key].slots.push(...val.slots);
      }
    }
    for (const key of Object.keys(merged)) merged[key].slots.sort((a, b) => a.s - b.s);

    if (!Object.keys(merged).length) {
      return new Response(JSON.stringify({ error: 'Sky returned no channels' }), {
        status: 502, headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ channels: merged }), {
      status: 200, headers: { ...headers, 'Content-Type': 'application/json', 'Cache-Control': 's-maxage=3600' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: `${e.name || 'Error'}: ${e.message || e}` }), {
      status: 502, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
}
