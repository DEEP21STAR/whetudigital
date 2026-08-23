// Ported from Vercel api/lounge/epg-skysport.js (edge runtime).
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

export async function onRequest({ request }) {
  const headers = { 'Access-Control-Allow-Origin': '*' };
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });

  const url = new URL(request.url);
  const days = Math.max(1, Math.min(5, parseInt(url.searchParams.get('days') || '1', 10) || 1));

  try {
    const dayResults = await Promise.all(
      Array.from({ length: days }, (_, i) => fetchDay(dateStr(i)).catch(() => ({})))
    );
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
