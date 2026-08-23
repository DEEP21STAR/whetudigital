// Ported from Vercel api/lounge/epg.js. Two changes from the Vercel
// source: (1) zlib.gunzipSync -> DecompressionStream, Workers has no Node
// zlib but does have this standard Web Streams gzip API; (2) Upstash-via-
// REST -> native Cloudflare KV binding (env.LOUNGE_KV), since Vercel's
// KV_REST_API_URL/TOKEN are Marketplace integration-store secrets with no
// retrievable plaintext value. All parsing logic (epgNorm/epgBuckets/
// epgParse/etc) is untouched, copied verbatim from the Vercel source --
// see that file's comment for why (line-for-line port of
// nexus_control_relay.py, do not reinterpret).

const EPG_BASE = 'https://epgshare01.online/epgshare01/';
const EPG_CACHE_TTL_S = 3 * 3600;
const EPG_INDEX_TTL_S = 86400;

async function gunzip(buf) {
  const ds = new DecompressionStream('gzip');
  const stream = new Blob([buf]).stream().pipeThrough(ds);
  return new Response(stream).text();
}

function epgNorm(name) {
  let s = (name || '').toLowerCase();
  s = s.replace(/\.[a-z]{2}\d?$/, '');
  s = s.replace(/\([^)]*\)/g, '');
  s = s.replace(/[._-]/g, ' ');
  s = s.replace(/\b(hd|sd|fhd|uhd|4k|plus1|east|west|pacific|us|usa|uk|nz|au)\b/g, '');
  return s.replace(/[^a-z0-9]/g, '');
}

const BUCKET_RULES = [
  ['adult', /\b(adults? only|erotic|erotyczny|erotik|erotico|erotique|xxx|porn|adulti|adultos)\b/],
  ['sports', /\b(sport|sports|sportif|sportowy|sportski|esporte|esportes|deporte|deportes|fudbal|football|soccer|futbol|futebol|calcio|fussball|pilka|basketball|basket|kosarka|rukomet|handball|baseball|softball|tennis|golf|hockey|boks|boxing|box|wrestling|racing|rally|moto|motorsport|nascar|formula|cricket|rugby|nba|nfl|mlb|nhl|ufc|mma|martial arts|olympic|olympics|cycling|plivanje|swimming|skating|ski|athletics|track and field|darts|snooker|billiards|poker|volleyball|odbojka|multi sport|playoff|sports talk)\b/],
  ['kids', /\b(children|child|kids|kid|family|cartoon|cartoons|cartoni|animated|animation|anime|animowany|animowane|dessin anime|ragazzi|kinder|infantil|infantiles|dla dzieci|preschool|under 5|jeunesse|dibujos|desenho|animacao|animationsserie|animationsserien|zeichentrickserie|zeichentrick|deciji|dzieci|babies|bebes|barn)\b/],
  ['news', /\b(news|newsmagazine|journal|informacyjny|informacja|nachrichten|informazione|informativo|noticias|noticia|aktuelni|aktualnosti|current affairs|world affairs|public affairs|weather|meteo|politics|political|debate|interview|business finance|business and finance|breaking|noticiario|notiziario|publicystyczny|bus financial|financial|economy|economia|nyheter|nieuws)\b/],
  ['documentary', /\b(documentary|documentaries|documentaire|documental|dokument|dokumentation|dokumentarni|dokumentalny|docu|factual|history|historical|historia|science|sciences|nature|natur|animals|wildlife|biography|educational|education|informational|reportage|dokumentationsreihe|dokumentarserie|kurs|medical|paranormal|archaeology|space)\b/],
  ['movies', /\b(movie|movies|film|films|cinema|cine|pelicula|peliculas|filme|filmes|spielfilm|langfilm|feature film|feature)\b/],
  ['music', /\b(music|musical|musique|musica|muzyczny|muzika|musik|concert|koncert|rock|pop|jazz|classical|opera|dance|hits)\b/],
  ['series', /\b(series|serial|serie|seriale|serien|sitcom|soap|telenovela|novela|telenovelas|krimiserie|dramaserie|comedyserie|miniseries|anthology)\b/],
  ['entertainment', /\b(entertainment|entertain|variety|talk|talkshow|game show|gameshow|quiz|reality|magazine|magazin|magazyn|intrattenimento|divertissement|entretenimento|rozrywkowy|unterhaltung|lifestyle|lifestyles|cooking|food|travel|shopping|consumer|house garden|self improvement|health|fitness|special interest|community|specialist|telerealite|jeu|jeux|clips|zivotni stil|home improvement|outdoors|how to|auto|motors|fishing|hunting|ljudi|garden|hobby|beauty|fashion|celebrity|gossip|talk show|underhallning)\b/],
];

const TONE_RX = /\b(drama|comedy|comedie|comedia|komedia|komedie|komedija|crime|law|mystery|thriller|romance|fantasy|adventure|avantura|action|acao|western|horror|sci fi|science fiction|fiction|suspense)\b/;

const WEAK_FALLBACK = [[/\b(shows?)\b/, 'entertainment']];

function fold(s) {
  s = (s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
  return s.replace(/[^a-z0-9]+/g, ' ').trim();
}

function epgBuckets(cats) {
  const out = [];
  const weak = [];
  for (const c of cats || []) {
    const f = fold(c);
    if (!f || /^\d+$/.test(f)) continue;
    let hit = false;
    for (const [key, rx] of BUCKET_RULES) {
      if (rx.test(f)) {
        if (!out.includes(key)) out.push(key);
        hit = true;
        break;
      }
    }
    if (hit) continue;
    if (TONE_RX.test(f)) {
      weak.push('series');
    } else {
      for (const [rx, key] of WEAK_FALLBACK) {
        if (rx.test(f)) { weak.push(key); break; }
      }
    }
  }
  if (out.includes('adult')) return ['adult'];
  if (!out.length) {
    for (const k of weak) if (!out.includes(k)) out.push(k);
  }
  return out;
}

async function epgFileFor(env, cc) {
  const cacheKey = 'lounge:epg:index';
  const cached = await env.LOUNGE_KV.get(cacheKey, 'json');
  if (cached && cached[cc]) return cached[cc];

  const res = await fetch(EPG_BASE, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) return null;
  const html = await res.text();
  const files = {};
  const seen = new Set();
  const re = /epg_ripper_([A-Z0-9]+)\.xml\.gz/g;
  let m;
  while ((m = re.exec(html))) seen.add(m[1]);
  for (const fn of [...seen].sort()) {
    const mm = /^([A-Z]{2})(\d*)$/.exec(fn);
    if (mm) {
      const cc2 = mm[1].toLowerCase();
      if (!files[cc2]) files[cc2] = `epg_ripper_${fn}.xml.gz`;
    }
  }
  if (Object.keys(files).length) {
    await env.LOUNGE_KV.put(cacheKey, JSON.stringify(files), { expirationTtl: EPG_INDEX_TTL_S });
  }
  return files[cc] || null;
}

function parseXmltvTs(val) {
  const m = /^(\d{14})\s*([+-]\d{4})?/.exec(val || '');
  if (!m) return null;
  const d = m[1];
  let epoch = Date.UTC(
    +d.slice(0, 4), +d.slice(4, 6) - 1, +d.slice(6, 8),
    +d.slice(8, 10), +d.slice(10, 12), +d.slice(12, 14)
  ) / 1000;
  if (m[2]) {
    const sign = m[2][0] === '+' ? 1 : -1;
    const offSec = (+m[2].slice(1, 3) * 3600 + +m[2].slice(3, 5) * 60);
    epoch -= sign * offSec;
  }
  return epoch;
}

function xmlUnescape(s) {
  return (s || '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}

function epgParse(xml) {
  const now = Date.now() / 1000;
  const horizon = now + 12 * 3600;
  const perChannel = {};

  const progRx = /<programme\b([^>]*)>([\s\S]*?)<\/programme>/g;
  let pm;
  while ((pm = progRx.exec(xml))) {
    const attrs = pm[1];
    const body = pm[2];
    const startM = /\bstart="([^"]*)"/.exec(attrs);
    const stopM = /\bstop="([^"]*)"/.exec(attrs);
    const chanM = /\bchannel="([^"]*)"/.exec(attrs);
    if (!startM || !stopM || !chanM) continue;
    const start = parseXmltvTs(startM[1]);
    const stop = parseXmltvTs(stopM[1]);
    const chan = chanM[1];
    if (!(start && stop && chan && stop > now && start < horizon)) continue;

    const titleM = /<title[^>]*>([\s\S]*?)<\/title>/.exec(body);
    const title = titleM ? xmlUnescape(titleM[1]).trim() : '';
    if (!title) continue;

    const cats = [];
    const catRx = /<category[^>]*>([\s\S]*?)<\/category>/g;
    let cm;
    while ((cm = catRx.exec(body))) {
      const t = xmlUnescape(cm[1]).trim();
      if (t) cats.push(t);
    }

    const prog = { t: title.slice(0, 120), s: start, e: stop };
    const buckets = epgBuckets(cats);
    if (buckets.length) prog.b = buckets;
    const label = cats.find(c => !/^\d+$/.test(fold(c)));
    if (label) prog.g = label.slice(0, 40);

    const key = epgNorm(chan);
    if (!perChannel[key]) perChannel[key] = [];
    perChannel[key].push(prog);
  }

  const out = {};
  for (const [key, progs] of Object.entries(perChannel)) {
    progs.sort((a, b) => a.s - b.s);
    const cur = progs.find(p => p.s <= now && now < p.e) || null;
    const nxt = progs.find(p => p.s > now) || null;
    if (cur || nxt) out[key] = { now: cur, next: nxt };
  }
  return out;
}

export async function onRequest({ request, env }) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Max-Age': '3600',
    'Content-Type': 'application/json',
  };
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (!env.LOUNGE_KV) return new Response(JSON.stringify({ error: 'cloud storage not set up yet', configured: false }), { status: 501, headers });

  const url = new URL(request.url);
  const ccParam = (url.searchParams.get('cc') || '').trim();
  const ccs = ccParam.split(',').map(c => c.trim().toLowerCase()).filter(Boolean).slice(0, 10);
  if (!ccs.length) {
    return new Response(JSON.stringify({ error: 'cc query param required, e.g. ?cc=nz,au' }), { status: 400, headers });
  }

  const result = {};
  const pending = [];

  for (const cc of ccs) {
    const cacheKey = `lounge:epg:${cc}`;
    const cached = await env.LOUNGE_KV.get(cacheKey, 'json');
    if (cached) {
      Object.assign(result, cached);
      continue;
    }

    try {
      const fn = await epgFileFor(env, cc);
      if (!fn) { pending.push(cc); continue; }
      const xmlRes = await fetch(EPG_BASE + fn, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!xmlRes.ok) { pending.push(cc); continue; }
      const gz = await xmlRes.arrayBuffer();
      const xml = await gunzip(gz);
      const channels = epgParse(xml);
      Object.assign(result, channels);
      await env.LOUNGE_KV.put(cacheKey, JSON.stringify(channels), { expirationTtl: EPG_CACHE_TTL_S });
    } catch (e) {
      pending.push(cc);
    }
  }

  return new Response(JSON.stringify({ channels: result, pending }), { status: 200, headers });
}
