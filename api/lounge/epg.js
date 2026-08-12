// Node runtime (not edge) -- needs zlib to gunzip epgshare01's .xml.gz feeds,
// which Vercel Edge Functions don't provide.
export const config = { maxDuration: 30 };

import zlib from 'zlib';

// Cloud EPG proxy -- the one item from the 2026-08-10 migration deliberately
// left on the local relay (see getContentBase()'s comment in lounge.html),
// because a naive "fetch fresh on every request" version would be SLOWER
// than what's already there, not PC-independence with no tradeoff: a single
// country's epgshare01 feed decompresses to tens of MB with up to ~75k
// programmes (nexus_control_relay.py's _epg_parse() comment). This function
// exists to change that tradeoff by caching the parsed result in Upstash
// Redis (KV_REST_API_URL/TOKEN, same store as reel.js) for 3 hours, matching
// the local relay's own _epg_cache TTL -- so only the first request per
// country per 3h window pays the multi-second fetch+parse cost.
//
// Everything below _epg_file_for/_epg_parse/_epg_norm/_fold/_epg_buckets is a
// deliberate line-for-line port of the matching Python functions in
// C:\NEXUS\nexus_control_relay.py -- NOT a reinterpretation. The bucket
// regex table in particular is hard-won (see that file's comment: measured
// against 941,957 real category tags across 20 country feeds, 88.2%
// coverage). Getting a single pattern wrong here would not throw an error,
// it would silently misclassify programmes, so every pattern is copied
// character-for-character rather than rewritten from memory. If you ever
// need to change one, change it in both places or they will quietly drift
// apart -- same warning the Python source carries for _epg_norm/normEpgId.

const EPG_BASE = 'https://epgshare01.online/epgshare01/';
const EPG_CACHE_TTL_S = 3 * 3600;
const EPG_INDEX_TTL_S = 86400;

async function kv(cmd) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return { configured: false };
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  const data = await res.json();
  return { configured: true, ok: res.ok, result: data.result, error: data.error };
}

// ===== _epg_norm =====
function epgNorm(name) {
  let s = (name || '').toLowerCase();
  s = s.replace(/\.[a-z]{2}\d?$/, '');
  s = s.replace(/\([^)]*\)/g, '');
  s = s.replace(/[._-]/g, ' ');
  s = s.replace(/\b(hd|sd|fhd|uhd|4k|plus1|east|west|pacific|us|usa|uk|nz|au)\b/g, '');
  return s.replace(/[^a-z0-9]/g, '');
}

// ===== _BUCKET_RULES (verbatim from nexus_control_relay.py) =====
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

// ===== _fold =====
function fold(s) {
  s = (s || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  return s.replace(/[^a-z0-9]+/g, ' ').trim();
}

// ===== _epg_buckets =====
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

// ===== _epg_file_for -- directory listing, cached 24h =====
async function epgFileFor(cc) {
  const cacheKey = 'lounge:epg:index';
  const cached = await kv(['GET', cacheKey]);
  if (cached.configured && cached.result) {
    try {
      const files = JSON.parse(cached.result);
      if (files[cc]) return files[cc];
    } catch { /* fall through to refetch */ }
  }
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
    await kv(['SET', cacheKey, JSON.stringify(files), 'EX', EPG_INDEX_TTL_S]);
  }
  return files[cc] || null;
}

// ===== ts() -- XMLTV "20260805110000 +0000" =====
function parseXmltvTs(val) {
  const m = /^(\d{14})\s*([+-]\d{4})?/.exec(val || '');
  if (!m) return null;
  const d = m[1];
  // Date.UTC treats the 14-digit stamp as the wall-clock time in UTC; the
  // offset (if present) is then subtracted the same way the Python version
  // does (epoch -= offset), giving true UTC seconds either way.
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

// ===== _epg_parse -- regex extraction instead of a streaming XML parser.
// XMLTV's <programme> element is flat and well-defined (attributes + a
// handful of known child tags), so a bounded per-block regex scan is a
// faithful, low-risk substitute for Python's iterparse -- it is doing the
// same mechanical extraction, not reinterpreting the format. =====
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

// Named exports purely for direct unit testing (test/epg_verify.mjs) --
// Vercel only ever calls the default export, this changes nothing about
// how the function deploys or runs in production.
export { epgParse, epgNorm, epgBuckets, fold, parseXmltvTs };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Max-Age', '3600');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const ccParam = String(req.query.cc || '').trim();
  const ccs = ccParam.split(',').map(c => c.trim().toLowerCase()).filter(Boolean).slice(0, 10);
  if (!ccs.length) { res.status(400).json({ error: 'cc query param required, e.g. ?cc=nz,au' }); return; }

  const result = {};
  const pending = [];

  for (const cc of ccs) {
    const cacheKey = `lounge:epg:${cc}`;
    const cached = await kv(['GET', cacheKey]);
    if (!cached.configured) { res.status(501).json({ error: 'cloud storage not set up yet', configured: false }); return; }

    if (cached.result) {
      try {
        const parsed = JSON.parse(cached.result);
        Object.assign(result, parsed);
        continue;
      } catch { /* corrupt cache entry -- refetch below */ }
    }

    try {
      const fn = await epgFileFor(cc);
      if (!fn) { pending.push(cc); continue; }
      const xmlRes = await fetch(EPG_BASE + fn, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!xmlRes.ok) { pending.push(cc); continue; }
      const gz = Buffer.from(await xmlRes.arrayBuffer());
      const xml = zlib.gunzipSync(gz).toString('utf-8');
      const channels = epgParse(xml);
      Object.assign(result, channels);
      await kv(['SET', cacheKey, JSON.stringify(channels), 'EX', EPG_CACHE_TTL_S]);
    } catch (e) {
      pending.push(cc);
    }
  }

  res.status(200).json({ channels: result, pending });
}
