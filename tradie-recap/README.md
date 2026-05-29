# tradie-recap — Whetū Digital Remotion template

30-second vertical (1080×1920) job-recap video for NZ tradies.

## Structure
- 0–3s   · Title card (brand + job type)
- 3–10s  · "BEFORE" photo
- 10–17s · "DURING" photo
- 17–24s · "AFTER" photo
- 24–30s · Certificate of Compliance (CoC) frame

## Local run (free)
```
cd C:\WHETU\tradie-recap
npm install
npm run dev      # opens Remotion Studio
npm run build    # renders out/recap.mp4
```

## Cloud render (PAID — DO NOT enable yet)
Remotion Lambda requires a company licence. Disabled here. Add when:
- Whetū Digital has its first paying tradie client, OR
- You want to batch-render > 5 videos/day.

See https://www.remotion.pro/license for current pricing.

## Future: ARCLINE integration
Replace `defaultProps.photos` and `coCNumber` with values pulled from the ARCLINE CoC JSON. One Remotion render per CoC, archived alongside the certificate in the 7-year vault.