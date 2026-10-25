import os, re, shutil, sys
here=os.path.dirname(os.path.abspath(__file__)); out=sys.argv[1] if len(sys.argv)>1 else os.path.join(here,'..','out')
os.makedirs(out,exist_ok=True)
R=lambda n: open(os.path.join(here,n),encoding='utf-8').read()
POLY=[("f1","110,16 87,83 110,110"),("f2","110,16 110,110 133,83"),("f3","204,110 133,83 110,110"),("f4","204,110 110,110 133,137"),("f5","110,204 133,137 110,110"),("f6","110,204 110,110 87,137"),("f7","16,110 87,137 110,110"),("f8","16,110 110,110 87,83")]
def star(p, full=True):
    polys=''.join(f'<polygon class="f {c}" points="{pts}"/>' for c,pts in POLY)
    extra=''
    if full:
        extra=('<g class="orb"><ellipse cx="110" cy="110" rx="55" ry="17" fill="none" stroke="url(#%sgr)" stroke-width="2.3" opacity=".75" transform="rotate(22 110 110)"/>'
               '<circle cx="165" cy="110" r="3.6" fill="#c040ff" transform="rotate(22 110 110)"/></g>'
               '<circle class="core" cx="110" cy="110" r="24" fill="url(#%sgc)"/><circle class="core" cx="110" cy="110" r="9" fill="#fff" opacity=".9"/>')%(p,p)
    return ('<svg class="star" viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><defs>'
            '<radialGradient id="%sgc" cx="50%%" cy="50%%" r="50%%"><stop offset="0%%" stop-color="#fff"/><stop offset="35%%" stop-color="#80ecff" stop-opacity=".85"/><stop offset="100%%" stop-color="#c040ff" stop-opacity="0"/></radialGradient>'
            '<linearGradient id="%sgr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#10d8ff"/><stop offset="1" stop-color="#c040ff"/></linearGradient></defs>'
            '<g>%s</g>%s</svg>')%(p,p,polys,extra)
body=R('body.html').replace('{{STAR_I}}',star('i')).replace('{{STAR_HERO}}',star('h')).replace('{{STAR_NAV}}',star('n',False))
css=R('site.css'); js=R('app.js')
ld='''{"@context":"https://schema.org","@type":"ProfessionalService","name":"Whetū Digital","url":"https://whetudigital.co.nz/","description":"Bespoke websites, dashboards, portals and automations for New Zealand businesses. Fixed prices in NZD incl. GST. You own the code.","email":"hello@whetudigital.co.nz","areaServed":{"@type":"Country","name":"New Zealand"},"knowsAbout":["Web design","Business dashboards","Client portals","Booking systems","Automation"],"priceRange":"From NZ$799"}'''
doc=f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#05050e">
<title>Whetū Digital — Bespoke Software for Aotearoa</title>
<meta name="description" content="Whetū Digital builds bespoke websites, dashboards, portals and automations for New Zealand businesses. Fixed prices from $799 NZD incl. GST. You own every line of code.">
<link rel="canonical" href="https://whetudigital.co.nz/">
<meta property="og:title" content="Whetū Digital — Bespoke software, built properly">
<meta property="og:description" content="Websites, dashboards, portals and automations for NZ businesses. Fixed prices. You own the code. Live in weeks.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://whetudigital.co.nz/">
<meta property="og:locale" content="en_NZ">
<meta name="twitter:card" content="summary">
<link rel="icon" href="./favicon.svg" type="image/svg+xml">
<link rel="manifest" href="./manifest.json">
<script type="application/ld+json">{ld}</script>
<script>
/* before paint: JS flag, reduced motion, and whether the intro plays.
   Plays on first arrival (typed URL, search, social) and on reload; skipped for crawlers, when you navigate inside the site, or back/forward. ?intro=1 forces it, ?intro=0 skips it. */
(function(){{var d=document.documentElement;d.className+=' js';
var rm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;if(rm)d.className+=' rm';
var q=location.search,type='',ref=false;
try{{var n=performance.getEntriesByType('navigation')[0];type=n?n.type:'';}}catch(e){{}}
try{{ref=!!document.referrer&&new URL(document.referrer).origin===location.origin;}}catch(e){{}}
var force=/[?&]intro=1/.test(q),off=/[?&]intro=0/.test(q);
var bot=/bot|crawl|spider|slurp|lighthouse|pagespeed|gtmetrix|prerender/i.test(navigator.userAgent||'');
var play=!rm&&!off&&!bot&&(force||type==='reload'||(type!=='back_forward'&&!ref));
if(play)d.className+=' intro-on';else d.className+=' ready quick';}})();
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,200..800&family=Geist:wght@300..700&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js" defer></script>
<style>
{css}
</style>
</head>
<body>
{body}
<script>
{js}
</script>
</body>
</html>
'''
open(os.path.join(out,'index.html'),'w',encoding='utf-8',newline='\n').write(doc)
ad=os.path.join(out,'assets'); os.makedirs(ad,exist_ok=True)
for f in os.listdir(os.path.join(here,'assets')): shutil.copy2(os.path.join(here,'assets',f),os.path.join(ad,f))
for f in ('favicon.svg','manifest.json'):
    src=os.path.join('C:/WHETU',f)
    if os.path.exists(src): shutil.copy2(src,os.path.join(out,f))
print('built',len(doc),'bytes ->',out)
