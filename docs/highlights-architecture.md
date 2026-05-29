# Live-Stream → Remotion Highlights — Architecture Brief

**Status:** ideas → architecture (no build tonight).
**Author:** Whetū Digital · 2026-05-29.
**Outcome target:** sport highlight clip (goal / wicket / try) published to `whetudigital.co.nz/highlights` within 60 seconds of the live event.

---

## Why this matters
Every NZ sports channel publishes highlights with a 5-15 minute lag. A 60-second turnaround is a *category-level* differentiator. No NZ competitor is doing this end-to-end on a free stack.

## Stack (all free or near-free)
| Layer | Tool | Cost |
|---|---|---|
| Live ingest | existing 1058-channel mpv/HLS buffer | $0 |
| Rolling buffer | ffmpeg circular segment (last 60 s × 1058 ch) | local disk only |
| Event detector | Whisper.cpp ASR + commentator-phrase regex ("GOAL!", "OUT!", "TRY!") | $0 (CPU on PREDATOR) |
| Visual confirm (optional, V2) | YOLOv8 ball-near-net / batter-out detector | $0 (Ollama-style local) |
| Renderer | Remotion (this folder + a `Highlight` composition) | $0 local |
| Publish | Cloudflare Pages + R2 for MP4 | $0 free tier |
| Notify | ntfy `deepstar-phoenix` + Telegram bot | $0 |

## Pipeline
```
[1058 HLS streams]
     │ (5-sec segments)
     ▼
[ffmpeg ring buffer]   ── keeps last 60 s per channel on disk
     │
     ▼
[whisper.cpp on commentary track]
     │  detect: "goal", "out", "wicket", "try", "six", "boundary"
     │  emit event JSON: { channel, ts, phrase, confidence }
     ▼
[event_dispatch.py]
     │ pulls the last-30-s clip from the ring buffer
     │ uploads to R2 (signed URL)
     ▼
[Remotion render — Highlight composition]
     │ input props: clip URL, sport, team colours, phrase, ts
     │ overlay: lower-third, score chip, Whetū bug
     ▼
[CF Pages publish]
     │ posts to /highlights/<sport>/<yyyy-mm-dd>/<hhmm>-<channel>.mp4
     ▼
[ntfy push + Telegram preview]
```

## Skeleton schedule (build budget ~12 hrs total)
1. ffmpeg ring-buffer prototype on 5 channels (1 hr).
2. Whisper.cpp + regex event detector (2 hrs).
3. Remotion `Highlight` composition (2 hrs — reuse the tradie-recap layout primitives).
4. R2 upload + signed URL (1 hr).
5. CF Pages auto-publish (1 hr).
6. Notify integration (30 min).
7. End-to-end smoke test on Premier League stream (1 hr).
8. Scale from 5 → 50 → 1058 channels (3 hrs incremental, mostly ffmpeg tuning).
9. NZ tweak: prioritise channels with cricket + NRL + Super Rugby + F1 + EPL.

## Risk register
- **Rights** — NZ broadcasting rights vary per league. Don't publish full goals from rights-holder feeds. Two safer options: (a) commentary-only highlights with a single still frame, (b) only operate on channels where you have permission/private feeds.
- **False positives** — commentator hype ("nearly a goal!") fires the regex. Mitigate with a 2-second cooldown + a sport-aware whitelist.
- **CPU budget** — 1058 simultaneous Whisper streams will melt PREDATOR. Tier: sample every 10 seconds for sound-energy, only run Whisper on segments above an audio-spike threshold.

## V2 ideas
- Auto-cut team-coloured lower-thirds from squad data.
- Personal RSS feed per user — "only Arsenal goals + Blackcaps wickets".
- Sell as a SaaS to NZ sports clubs needing instant highlights for their socials.

## Parked decisions
- Whether to use Remotion Lambda for the highlight render (paid) or stay local (free, slower).
- Whether to keep this private (Deep-only highlight feed for Arsenal + Warriors + Blackcaps) or productise.