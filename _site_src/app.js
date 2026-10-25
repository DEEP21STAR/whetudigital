(function(){
'use strict';
var $=function(s,r){return (r||document).querySelector(s);};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
var html=document.documentElement;
var RM=html.classList.contains('rm');
var CALM=html.classList.contains('calm');
var FINE=!!(window.matchMedia&&matchMedia('(pointer:fine)').matches);
var clamp=function(v,a,b){return Math.max(a,Math.min(b,v));};
var EMAIL='hello@whetudigital.co.nz';

/* ── Auckland time chip ── */
function nz(){var el=$('#nzTime');if(!el)return;try{el.textContent=new Intl.DateTimeFormat('en-NZ',{hour:'numeric',minute:'2-digit',timeZone:'Pacific/Auckland'}).format(new Date());}catch(e){}}

/* ── star field (shared by page + intro) ── */
function field(cv,n,speed){
  if(!cv)return {stop:function(){}};
  var ctx=cv.getContext('2d'),w=0,h=0,dpr=1,stars=[],raf=0,alive=true,mx=0,my=0;
  function size(){dpr=Math.min(window.devicePixelRatio||1,1.5);w=cv.width=Math.round(innerWidth*dpr);h=cv.height=Math.round(innerHeight*dpr);
    stars=[];for(var i=0;i<n;i++){var r=Math.random();stars.push({x:Math.random()*w,y:Math.random()*h,z:Math.random()*.9+.1,p:Math.random()*6.28,c:r<.16?'oklch(72% .27 308)':r<.42?'oklch(86% .16 205)':'oklch(98% .01 285)'});}}
  function draw(t){ctx.clearRect(0,0,w,h);var sy=window.scrollY*.07*dpr;
    for(var i=0;i<stars.length;i++){var s=stars[i];var tw=.55+.45*Math.sin(t*.0011*(.5+s.z)+s.p);
      var x=(s.x+mx*s.z*26*dpr+w*2+t*.006*speed*s.z*dpr)%w, y=(s.y-sy*s.z+h*8)%h;
      ctx.globalAlpha=tw*(.3+s.z*.7);ctx.fillStyle=s.c;ctx.beginPath();ctx.arc(x,y,(.45+s.z*1.25)*dpr,0,6.2832);ctx.fill();}}
  function loop(t){if(!alive)return;if(!document.hidden)draw(t);raf=requestAnimationFrame(loop);}
  size();window.addEventListener('resize',size);
  if(FINE)window.addEventListener('pointermove',function(e){mx=(e.clientX/innerWidth-.5);my=(e.clientY/innerHeight-.5);},{passive:true});
  if(RM){draw(0);}else{raf=requestAnimationFrame(loop);}
  return {stop:function(){alive=false;cancelAnimationFrame(raf);window.removeEventListener('resize',size);}};
}

/* ── count-up ── */
function countTo(el,to,dur,pre,from){
  var t0=null,f=from||0;if(RM){el.textContent=pre+to.toLocaleString('en-NZ');return;}
  function step(t){if(t0===null)t0=t;var p=clamp((t-t0)/dur,0,1),e=1-Math.pow(1-p,4);el.textContent=pre+Math.round(f+(to-f)*e).toLocaleString('en-NZ');if(p<1)requestAnimationFrame(step);}
  requestAnimationFrame(step);
}
function heroCount(){$$('[data-count]').forEach(function(el){countTo(el,+el.getAttribute('data-count'),1700,el.getAttribute('data-pre')||'');});}

/* ── ready / intro ── */
var readied=false;
function readyUp(){if(readied)return;readied=true;html.classList.add('ready');heroCount();}
var iField=null;
function endIntro(){html.classList.remove('intro-on','landing');var i=$('#intro');if(i)i.style.display='none';if(iField)iField.stop();readyUp();}

function runIntro(){
  var g=window.gsap;
  if(!g||RM){endIntro();return;}
  if(CALM){runCalmIntro(g);return;}
  var introEl=$('#intro'),logo=$('#iLogo'),swing=$('#iSwing'),glow=$('#iGlow'),ring=$('#iRing'),word=$('#iWord'),tag=$('#iTag'),meta=$('#iMeta'),bar=$('#iBarFill'),enter=$('#iEnter'),skip=$('#iSkip');
  iField=field($('#iStars'),120,2.2);
  /* wordmark letters, colour-stepped cyan → violet across DIGITAL */
  var txt='WHETŪ DIGITAL',letters=[];word.innerHTML='';
  for(var i=0;i<txt.length;i++){var s=document.createElement('span');var ch=txt.charAt(i);
    if(ch===' '){s.className='sp';}else{s.textContent=ch;if(i>5){var k=(i-6)/6;s.style.color='oklch('+(84-16*k)+'% '+(.165+.105*k)+' '+(205+103*k)+')';}}
    word.appendChild(s);if(ch!==' ')letters.push(s);}
  var facets=$$('.f',swing),ang=[-101,-79,-13,13,79,101,167,-167],done=false;
  facets.forEach(function(f,i){var a=ang[i]*Math.PI/180;g.set(f,{x:Math.cos(a)*340,y:Math.sin(a)*340,rotation:(i%2?1:-1)*(80+Math.random()*100),scale:.35,opacity:0,transformOrigin:'50% 50%'});});
  g.set([glow,ring,meta,enter],{opacity:0});

  var tl=g.timeline({defaults:{ease:'power3.out'}});
  tl.add(function(){logo.classList.add('go');},.25);
  tl.to(facets,{x:0,y:0,rotation:0,scale:1,opacity:1,duration:1.5,ease:'expo.out',stagger:.08},.35);
  tl.to(glow,{opacity:1,duration:1.5,ease:'power2.out'},.9);
  tl.fromTo(glow,{scale:.55},{scale:1.15,duration:1.6,ease:'power2.out'},.9);
  tl.fromTo(ring,{scale:.3,opacity:.95},{scale:2.7,opacity:0,duration:1.5,ease:'power2.out'},1.55);
  tl.fromTo(letters,{rotationX:-115,y:52,opacity:0},{rotationX:0,y:0,opacity:1,duration:1.05,ease:'back.out(1.7)',stagger:.055},2.3);
  tl.add(function(){word.classList.add('glitch');},4.3);
  var full='One tool. One client. One star at a time.',o={n:0};
  tl.to(o,{n:full.length,duration:1.7,ease:'none',onUpdate:function(){tag.innerHTML=full.slice(0,Math.round(o.n))+'<span class="caret"></span>';}},3.1);
  tl.to(meta,{opacity:1,duration:.8},4.4);
  tl.to(bar,{scaleX:1,duration:6.6,ease:'none'},0);
  tl.to(enter,{opacity:1,duration:.6,onStart:function(){enter.classList.add('on');}},5.2);
  tl.add(function(){exit(false);},6.6);

  function exit(fast){
    if(done)return;done=true;tl.kill();enter.classList.remove('on');
    if(fast){g.to(introEl,{opacity:0,duration:.45,ease:'power2.out',onComplete:endIntro});readyUp();return;}
    /* settle the swing, then fly the star home into the hero */
    var cs=getComputedStyle(swing).transform;swing.style.animation='none';swing.style.transform=cs==='none'?'':cs;
    g.to(swing,{rotationY:0,rotationX:0,rotationZ:0,duration:.35,ease:'power2.out'});
    var hs=$('#heroStar').getBoundingClientRect(),lr=logo.getBoundingClientRect();
    var dx=(hs.left+hs.width/2)-(lr.left+lr.width/2),dy=(hs.top+hs.height/2)-(lr.top+lr.height/2),sc=(hs.width*.88)/lr.width;
    g.to([word,tag,meta,skip,$('.i-bar',introEl)],{opacity:0,y:-16,duration:.5,ease:'power2.in'});
    g.to(glow,{opacity:0,duration:.8});
    g.to(logo,{x:dx,y:dy,scale:sc,duration:1.2,ease:'power3.inOut'});
    g.delayedCall(.7,function(){html.classList.add('landing');readyUp();});
    g.to(introEl,{opacity:0,duration:.6,delay:.85,ease:'power1.inOut',onComplete:endIntro});
  }
  skip.addEventListener('click',function(){exit(true);});
  enter.addEventListener('click',function(){exit(tl.time()<6.5);});
  document.addEventListener('keydown',function(e){if(!done&&(e.key==='Escape'||e.key==='Enter'))exit(true);});
  setTimeout(function(){if(!done)exit(true);},14000);
}

/* ── calm intro: ~4.5 s, fades only (no flying facets, no 3D swing, no glitch) ── */
function runCalmIntro(g){
  var introEl=$('#intro'),logo=$('#iLogo'),glow=$('#iGlow'),word=$('#iWord'),tag=$('#iTag'),meta=$('#iMeta'),bar=$('#iBarFill'),skip=$('#iSkip'),enter=$('#iEnter');
  iField=field($('#iStars'),90,.3);if(enter)enter.style.display='none';
  var txt='WHETŪ DIGITAL',letters=[];word.innerHTML='';
  for(var i=0;i<txt.length;i++){var s=document.createElement('span');var ch=txt.charAt(i);
    if(ch===' '){s.className='sp';}else{s.textContent=ch;if(i>5){var k=(i-6)/6;s.style.color='oklch('+(84-16*k)+'% '+(.165+.105*k)+' '+(205+103*k)+')';}}
    word.appendChild(s);if(ch!==' ')letters.push(s);}
  tag.textContent='One tool. One client. One star at a time.';
  g.set([logo,glow,word,tag,meta],{opacity:0});
  var done=false,tl=g.timeline({defaults:{ease:'power1.out'}});
  tl.to(logo,{opacity:1,duration:1.4},.2).to(glow,{opacity:1,duration:1.8},.2).set(word,{opacity:1},.9)
    .fromTo(letters,{opacity:0},{opacity:1,duration:1,stagger:.06},.9).to(tag,{opacity:1,duration:1},2).to(meta,{opacity:1,duration:.8},2.4)
    .to(bar,{scaleX:1,duration:4,ease:'none'},0).add(function(){exit();},4.2);
  function exit(){if(done)return;done=true;tl.kill();html.classList.add('landing');readyUp();g.to(introEl,{opacity:0,duration:.9,ease:'power1.inOut',onComplete:endIntro});}
  skip.addEventListener('click',exit);
  document.addEventListener('keydown',function(e){if(!done&&(e.key==='Escape'||e.key==='Enter'))exit();});
  setTimeout(function(){if(!done)exit();},9000);
}

/* ── tilt the hero star with the pointer ── */
function starParallax(){
  var st=$('#heroStage');if(!st||!FINE||RM||CALM)return;var rx=0,ry=0,tx=0,ty=0;
  window.addEventListener('pointermove',function(e){tx=(e.clientY/innerHeight-.5)*-14;ty=(e.clientX/innerWidth-.5)*18;},{passive:true});
  (function f(){rx+=(tx-rx)*.07;ry+=(ty-ry)*.07;st.style.transform=st.classList.contains('gl-on')?'':'rotateX('+rx.toFixed(2)+'deg) rotateY('+ry.toFixed(2)+'deg)';requestAnimationFrame(f);})();
}

/* ── cursor, magnetic, tile spotlight ── */
function cursor(){
  if(!FINE||RM)return;var cd=$('#cd'),cr=$('#cr');if(!cd||!cr)return;html.classList.add('cur');
  var x=0,y=0,rx=0,ry=0;
  window.addEventListener('pointermove',function(e){if(!html.classList.contains('cur-on')){html.classList.add('cur-on');rx=e.clientX;ry=e.clientY;}x=e.clientX;y=e.clientY;cd.style.transform='translate('+x+'px,'+y+'px) translate(-50%,-50%)';var hot=e.target.closest&&e.target.closest('a,button,.tile,.proj,.opt,.pill,.fq');cr.classList.toggle('hot',!!hot);},{passive:true});
  document.addEventListener('mouseleave',function(){html.classList.remove('cur-on');});
  (function f(){rx+=(x-rx)*.16;ry+=(y-ry)*.16;cr.style.transform='translate('+rx+'px,'+ry+'px) translate(-50%,-50%)';requestAnimationFrame(f);})();
}
/* ── tiny stars burst from the pointer when a button is entered ── */
function sparks(){
  if(RM||CALM)return;var cols=['#4fe3ff','#b88bff','#ff6bf0','#ffffff'];
  function burst(x,y){
    for(var i=0;i<8;i++){var s=document.createElement('i');s.className='spark';s.textContent='✦';
      var a=(i/8)*6.2832+Math.random()*.6,d=34+Math.random()*46;
      s.style.setProperty('--x0',(x-6)+'px');s.style.setProperty('--y0',(y-6)+'px');
      s.style.setProperty('--x1',(x-6+Math.cos(a)*d)+'px');s.style.setProperty('--y1',(y-6+Math.sin(a)*d)+'px');
      s.style.setProperty('--r',((Math.random()<.5?-1:1)*(90+Math.random()*140))+'deg');
      s.style.setProperty('--s',(9+Math.random()*10)+'px');s.style.setProperty('--c',cols[i%cols.length]);
      s.addEventListener('animationend',function(){if(this.parentNode)this.parentNode.removeChild(this);});document.body.appendChild(s);}
  }
  $$('.btn-p,.btn-g').forEach(function(b){b.addEventListener('pointerenter',function(e){if(e.pointerType==='touch')return;burst(e.clientX,e.clientY);});});
}
function magnetic(){
  if(!FINE||RM||CALM)return;
  $$('.magnetic').forEach(function(b){
    b.addEventListener('pointermove',function(e){var r=b.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);b.style.transform='translate('+clamp(dx*.22,-8,8)+'px,'+clamp(dy*.3,-6,6)+'px)';});
    b.addEventListener('pointerleave',function(){b.style.transform='';});
  });
  $$('.tile,.proj').forEach(function(t){t.addEventListener('pointermove',function(e){var r=t.getBoundingClientRect(),px=(e.clientX-r.left)/r.width-.5,py=(e.clientY-r.top)/r.height-.5;t.style.setProperty('--mx',(e.clientX-r.left)+'px');t.style.setProperty('--my',(e.clientY-r.top)+'px');t.style.setProperty('--rx',(py*-5).toFixed(2)+'deg');t.style.setProperty('--ry',(px*6).toFixed(2)+'deg');});t.addEventListener('pointerleave',function(){t.style.setProperty('--rx','0deg');t.style.setProperty('--ry','0deg');});});
}

/* ── reveals, nav, active link, footer fill ── */
function scrolly(){
  var nav=$('#nav');
  function onS(){nav.classList.toggle('stuck',window.scrollY>30);var fb=$('#fbig');if(fb){var r=fb.getBoundingClientRect();var p=clamp((innerHeight-r.top)/(innerHeight*.75),0,1);fb.style.setProperty('--fp',(p*100).toFixed(1)+'%');}}
  window.addEventListener('scroll',onS,{passive:true});onS();
  var rv=$$('.rv');
  if(!('IntersectionObserver' in window)){rv.forEach(function(e){e.classList.add('in');});return;}
  var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target);}});},{threshold:.14,rootMargin:'0px 0px -6% 0px'});
  rv.forEach(function(e){io.observe(e);});
  var links={};$$('.links a.l').forEach(function(a){links[a.getAttribute('href').slice(1)]=a;});
  var so=new IntersectionObserver(function(es){es.forEach(function(en){var a=links[en.target.id];if(a&&en.isIntersecting){$$('.links a.l.on').forEach(function(x){x.classList.remove('on');});a.classList.add('on');}});},{threshold:.35});
  Object.keys(links).forEach(function(id){var s=document.getElementById(id);if(s)so.observe(s);});
}

/* ── headline words rise from a mask ── */
function words(){
  if(RM)return;
  function wrap(t,i){var w=document.createElement('span');w.className='w';var s=document.createElement('span');s.className='wi';s.style.setProperty('--i',i);s.textContent=t;w.appendChild(s);return w;}
  var n=0;
  $$('h2.t,.cta h2').forEach(function(h){
    var kids=[].slice.call(h.childNodes),out=[],i=0;
    kids.forEach(function(k){
      if(k.nodeType===3){k.textContent.split(/(\s+)/).forEach(function(tok){if(!tok)return;out.push(/^\s+$/.test(tok)?document.createTextNode(' '):wrap(tok,i++));});}
      else if(k.nodeType===1&&k.tagName==='BR'){out.push(k.cloneNode());}
      else if(k.nodeType===1){var e=k.cloneNode(false);k.textContent.split(/(\s+)/).forEach(function(tok){if(!tok)return;e.appendChild(/^\s+$/.test(tok)?document.createTextNode(' '):wrap(tok,i++));});out.push(e);}
    });
    h.setAttribute('aria-label',h.textContent.replace(/\s+/g,' ').trim());
    h.textContent='';out.forEach(function(o){h.appendChild(o);});h.classList.add('wsplit');
    $$('.wi',h).forEach(function(x){x.setAttribute('aria-hidden','true');});
    if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){h.classList.add('in');io.disconnect();}});},{threshold:.35});io.observe(h);}else h.classList.add('in');
    n++;
  });
}

/* ── FAQ ── */
function faq(){$$('.fq button').forEach(function(b){b.addEventListener('click',function(){var f=b.parentNode,open=!f.classList.contains('open');$$('.fq.open').forEach(function(x){x.classList.remove('open');x.querySelector('button').setAttribute('aria-expanded','false');});if(open){f.classList.add('open');b.setAttribute('aria-expanded','true');}});});}

/* ── estimator (prices = the published tiers) ── */
var TIERS={
  1:{name:'Starter',price:799,days:'5–7 days',rev:'1 round of revisions',inc:['Single-page site or landing page','Mobile-optimised design','Contact form + email integration','Free hosting (GitHub or Cloudflare Pages)']},
  2:{name:'Professional',price:2400,days:'2–3 weeks',rev:'3 rounds of revisions',inc:['Multi-page website (up to 8 pages)','Custom business dashboard','Client portal or booking forms','SEO, sitemap + robots.txt']},
  3:{name:'Enterprise',price:0,days:'Scoped with you',rev:'Unlimited revisions',inc:['Multi-user / role-based access','API integrations','Shopify / e-commerce builds','Custom automations + scripts']}
};
var NEED={web:['Website / landing page',1],dash:['Business dashboard',2],book:['Booking & scheduling',2],portal:['Client portal',2],forms:['Forms & CRM',2],shop:['E-commerce / shop',3],auto:['Automations',3],unsure:['Not sure yet',0]};
var lastPrice=0;
function money(n){return '$'+n.toLocaleString('en-NZ',{minimumFractionDigits:n%1?2:0,maximumFractionDigits:2});}
function estimate(){
  var f=$('#estForm'),body=$('#rcBody');if(!f||!body)return;
  var needs=$$('input[name=need]:checked',f).map(function(i){return i.value;});
  var size=+($('input[name=size]:checked',f)||{value:1}).value,when=($('input[name=when]:checked',f)||{value:'ASAP'}).value;
  if(!needs.length){body.innerHTML='<p class="rc-empty">Pick what you need on the left — your price appears here instantly.</p>';lastPrice=0;return;}
  var tier=size;needs.forEach(function(n){tier=Math.max(tier,NEED[n][1]);});if(tier<1)tier=1;
  var t=TIERS[tier],deposit=t.price?money(t.price/2):'Milestone-based';
  var list=needs.map(function(n){return NEED[n][0];}).join(', ');
  body.innerHTML='<div class="rc-tier">'+t.name+'</div>'+
    '<div class="rc-price"><span id="rcNum">'+(t.price?money(t.price):'Custom')+'</span>'+(t.price?'<small>one-off</small>':'<small>quote</small>')+'</div>'+
    '<div class="rc-sub">'+(t.price?'NZD including GST · fixed price':'Scoped in a free 30-minute kōrero')+'</div>'+
    '<ul class="rc-list"><li>Delivery<b>'+t.days+'</b></li><li>To start (50%)<b>'+deposit+'</b></li><li>Revisions<b>'+t.rev+'</b></li><li>Timing you chose<b>'+when+'</b></li></ul>'+
    '<ul class="rc-inc">'+t.inc.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ul>'+
    '<div class="rc-act"><a class="btn btn-p magnetic" id="rcSend" href="#">Send this brief <span class="ar" aria-hidden="true">→</span></a><a class="btn btn-g" href="#pricing">Compare tiers</a></div>'+
    '<p class="rc-note">Indicative only — it opens an email to '+EMAIL+' with these answers filled in. You\'ll get a clear written proposal within 24 hours.</p>';
  var subj='Project brief — '+t.name+' ('+list+')';
  var mail='Hi Whetū Digital,\n\nHere\'s a quick brief:\n\n• I need: '+list+'\n• Size: '+['','One page / simple','Up to ~8 pages','Multi-user or integrations'][size]+'\n• Timing: '+when+'\n• Suggested tier: '+t.name+(t.price?' ('+money(t.price)+' incl. GST)':' (custom quote)')+'\n\nMy name:\nMy business:\nA line about the project:\n\nThanks!';
  $('#rcSend').href='mailto:'+EMAIL+'?subject='+encodeURIComponent(subj)+'&body='+encodeURIComponent(mail);
  if(t.price&&lastPrice!==t.price){var n=$('#rcNum');countTo(n,t.price,700,'$',lastPrice);}
  lastPrice=t.price;window.dispatchEvent(new CustomEvent('whetu:tier',{detail:tier}));
}
function est(){var f=$('#estForm');if(!f)return;f.addEventListener('change',estimate);estimate();}

/* ── command palette ── */
var PAL=[
 ['Get your price','Estimator','#estimate','price cost quote estimate how much start project'],
 ['See our work','Clarity · MIMI','#work','work portfolio clarity mimi examples proof'],
 ['What we build','Services','#services','services websites dashboards booking portal forms shop automation'],
 ['How it works','Process','#process','process steps korero timeline'],
 ['Pricing tiers','Starter · Professional · Enterprise','#pricing','pricing tiers plans packages'],
 ['The studio','About','#studio','about studio whetu star own code'],
 ['Questions','FAQ','#faq','faq questions help'],
 ['Email hello@whetudigital.co.nz','Reply within 24h','mailto:'+EMAIL,'email contact hello message'],
 ['Open Clarity ↗','Live product','https://deep21star.github.io/clarity/','clarity budget live'],
 ['Open MIMI ↗','Live product','https://mimi.whetudigital.co.nz/','mimi trainer live'],
 ['Full pricing page','Details + FAQ','./pricing.html','pricing details page'],
 ['Client onboarding form','Brief us properly','./onboard.html','onboard onboarding brief form'],
 ['Shop','Templates · retainers','./shop.html','shop templates retainers'],
 ['Replay the intro','↺','replay','intro replay animation swing logo'],
 ['Motion: Full','Intro, 3D star, every effect','motion:full','motion full animation effects intro'],
 ['Motion: Calm','Gentle fades, no big movement','motion:calm','motion calm gentle reduced'],
 ['Motion: Still','Nothing moves','motion:still','motion still off none static']
];
function palette(){
  var pal=$('#pal'),q=$('#palQ'),ul=$('#palL');if(!pal)return;var sel=0,cur=[],last=null;
  function render(){var t=q.value.toLowerCase().split(/\s+/).filter(Boolean);cur=PAL.filter(function(p){var h=(p[0]+' '+p[3]).toLowerCase();return t.every(function(w){return h.indexOf(w)>-1;});});if(sel>=cur.length)sel=0;
    ul.innerHTML=cur.length?cur.map(function(p,i){return '<li><button type="button" role="option" data-i="'+i+'" class="'+(i===sel?'sel':'')+'" aria-selected="'+(i===sel)+'">'+p[0]+'<small>'+p[1]+'</small></button></li>';}).join(''):'<li><button type="button" disabled>No match — try “price” or “email”</button></li>';}
  function open(){last=document.activeElement;pal.classList.add('open');q.value='';sel=0;render();setTimeout(function(){q.focus();},20);document.body.style.overflow='hidden';}
  function close(){pal.classList.remove('open');document.body.style.overflow='';if(last&&last.focus)last.focus();}
  function go(i){var p=cur[i];if(!p)return;close();var k=p[2];if(k==='replay'){location.href=location.pathname+'?intro=1';}else if(k.indexOf('motion:')===0){window.__wdMotion(k.slice(7),k!=='motion:still');}else if(k.charAt(0)==='#'){var el=document.querySelector(k);if(el)el.scrollIntoView({behavior:RM?'auto':'smooth'});}else if(/^https?:/.test(k)){window.open(k,'_blank','noopener');}else{location.href=k;}}
  $$('[data-pal]').forEach(function(b){b.addEventListener('click',open);});
  pal.addEventListener('click',function(e){if(e.target===pal)close();});
  ul.addEventListener('click',function(e){var b=e.target.closest('button[data-i]');if(b)go(+b.getAttribute('data-i'));});
  q.addEventListener('input',function(){sel=0;render();});
  document.addEventListener('keydown',function(e){
    var isOpen=pal.classList.contains('open');
    if((e.key==='k'||e.key==='K')&&(e.ctrlKey||e.metaKey)){e.preventDefault();isOpen?close():open();return;}
    if(!isOpen)return;
    if(e.key==='Escape'){e.preventDefault();close();}
    else if(e.key==='ArrowDown'){e.preventDefault();sel=(sel+1)%Math.max(cur.length,1);render();}
    else if(e.key==='ArrowUp'){e.preventDefault();sel=(sel-1+Math.max(cur.length,1))%Math.max(cur.length,1);render();}
    else if(e.key==='Enter'){e.preventDefault();go(sel);}
    else if(e.key==='Tab'){e.preventDefault();q.focus();}
  });
}

/* ── hero star in real 3D: a faceted crystal, raw WebGL (no library). SVG star stays as the fallback. ── */
var GL_TIER=0,GL_TIER_T=0;
window.addEventListener('whetu:tier',function(e){GL_TIER=({1:0,2:.13,3:.3})[e.detail]||0;});
function heroGL(){
  var st=$('#heroStage');if(!st||RM)return;
  var cv=document.createElement('canvas');cv.className='gl';cv.setAttribute('aria-hidden','true');
  var gl=null;try{gl=cv.getContext('webgl',{antialias:true,alpha:true,premultipliedAlpha:true,powerPreference:'high-performance'});}catch(e){}
  if(!gl)return;
  function sh(type,src){var s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){throw new Error(gl.getShaderInfoLog(s));}return s;}
  function prog(vs,fs){var p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,vs));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;}
  var gem,flare;
  try{
    gem=prog('attribute vec3 aPos;attribute vec3 aNor;attribute float aT;uniform mat4 uModel;uniform mat4 uVP;varying vec3 vN;varying vec3 vP;varying float vT;void main(){vec4 w=uModel*vec4(aPos,1.);vN=mat3(uModel)*aNor;vP=w.xyz;vT=aT;gl_Position=uVP*w;}',
      'precision mediump float;varying vec3 vN;varying vec3 vP;varying float vT;uniform vec3 uLight;uniform vec3 uEye;uniform float uT;uniform float uHue;'+
      'vec3 pal(float t){t=clamp(t,0.,1.);vec3 c1=vec3(.04,.86,1.);vec3 c2=vec3(.3,.5,1.);vec3 c3=vec3(.6,.2,1.);vec3 c4=vec3(.95,.1,.92);return t<.33?mix(c1,c2,t/.33):(t<.66?mix(c2,c3,(t-.33)/.33):mix(c3,c4,(t-.66)/.34));}'+
      'void main(){vec3 N=normalize(vN);vec3 V=normalize(uEye-vP);vec3 L=normalize(uLight-vP);float diff=max(dot(N,L),0.);float fres=pow(1.-max(dot(N,V),0.),2.2);vec3 H=normalize(L+V);float spec=pow(max(dot(N,H),0.),56.);'+
      'float t=vT+uHue+.05*sin(uT*.7+vT*9.);vec3 base=pal(t);vec3 col=base*(.32+.95*diff)+vec3(.75,.92,1.)*spec*.95+pal(t+.28)*fres*1.15;col+=base*.3*pow(.5+.5*sin(uT*1.1+vT*14.),8.);gl_FragColor=vec4(col,1.);}');
    flare=prog('attribute vec2 aQ;uniform mat4 uVP;uniform mat4 uModel;varying vec2 vQ;void main(){vQ=aQ;vec4 c=uModel*vec4(0.,0.,.36,1.);vec4 p=uVP*c;gl_Position=p+vec4(aQ*.34*p.w,0.,0.);}',
      'precision mediump float;varying vec2 vQ;uniform float uT;void main(){float d=length(vQ);float a=smoothstep(1.,0.,d);float core=smoothstep(.35,0.,d);vec3 c=mix(vec3(.5,.35,1.),vec3(.85,1.,1.),core)*a*a*(.8+.2*sin(uT*2.6));gl_FragColor=vec4(c,a*a);}');
  }catch(err){return;}
  /* geometry: the logo's 8-point outline, lifted into a double pyramid (head-on it matches the flat star) */
  var O=[[0,1],[-.245,.287],[-1,0],[-.245,-.287],[0,-1],[.245,-.287],[1,0],[.245,.287]],H=.34,pos=[],nor=[],tt=[];
  function tri(a,b,c){var u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],v=[c[0]-a[0],c[1]-a[1],c[2]-a[2]],n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],l=Math.hypot(n[0],n[1],n[2])||1;n=[n[0]/l,n[1]/l,n[2]/l];
    var cx=(a[0]+b[0]+c[0])/3,cy=(a[1]+b[1]+c[1])/3,t=Math.max(0,Math.min(1,.5+.3*cx-.5*cy));[a,b,c].forEach(function(p){pos.push(p[0],p[1],p[2]);nor.push(n[0],n[1],n[2]);tt.push(t);});}
  for(var i=0;i<8;i++){var a=O[i],b=O[(i+1)%8];tri([a[0],a[1],0],[b[0],b[1],0],[0,0,H]);tri([b[0],b[1],0],[a[0],a[1],0],[0,0,-H]);}
  function buf(arr){var b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(arr),gl.STATIC_DRAW);return b;}
  var bP=buf(pos),bN=buf(nor),bT=buf(tt),bQ=buf([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),nV=pos.length/3;
  var u=function(p,n){return gl.getUniformLocation(p,n);},lg={M:u(gem,'uModel'),VP:u(gem,'uVP'),L:u(gem,'uLight'),E:u(gem,'uEye'),T:u(gem,'uT'),Hue:u(gem,'uHue')},lf={M:u(flare,'uModel'),VP:u(flare,'uVP'),T:u(flare,'uT')};
  var aP=gl.getAttribLocation(gem,'aPos'),aN=gl.getAttribLocation(gem,'aNor'),aT=gl.getAttribLocation(gem,'aT'),aQ=gl.getAttribLocation(flare,'aQ');
  /* tiny matrix helpers */
  function mul(a,b){var o=new Float32Array(16);for(var i=0;i<4;i++)for(var j=0;j<4;j++){var s=0;for(var k=0;k<4;k++)s+=a[k*4+j]*b[i*4+k];o[i*4+j]=s;}return o;}
  function rotY(t){var c=Math.cos(t),s=Math.sin(t);return new Float32Array([c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1]);}
  function rotX(t){var c=Math.cos(t),s=Math.sin(t);return new Float32Array([1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1]);}
  function rotZ(t){var c=Math.cos(t),s=Math.sin(t);return new Float32Array([c,s,0,0,-s,c,0,0,0,0,1,0,0,0,0,1]);}
  function persp(f,a,n,fa){var t=1/Math.tan(f/2),o=new Float32Array(16);o[0]=t/a;o[5]=t;o[10]=(fa+n)/(n-fa);o[11]=-1;o[14]=2*fa*n/(n-fa);return o;}
  function trans(z){var o=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,z,1]);return o;}
  var EYE=4.3,proj=null,w=0,h=0,dpr=1,ptX=0,ptY=0,tx=0,ty=0,alive=true,vis=true,t0=0,hue=0,tStart=-1;
  function size(){var r=st.getBoundingClientRect();dpr=Math.min(window.devicePixelRatio||1,1.75);w=cv.width=Math.max(2,Math.round(r.width*dpr));h=cv.height=Math.max(2,Math.round(r.height*dpr));gl.viewport(0,0,w,h);proj=persp(.56,w/h,.1,20);}
  st.insertBefore(cv,st.firstChild);size();
  if('ResizeObserver' in window)new ResizeObserver(size).observe(st);else window.addEventListener('resize',size);
  if(FINE)window.addEventListener('pointermove',function(e){tx=(e.clientX/innerWidth-.5)*2;ty=(e.clientY/innerHeight-.5)*2;},{passive:true});
  if('IntersectionObserver' in window)new IntersectionObserver(function(es){vis=es[0].isIntersecting;},{threshold:0}).observe(st);
  document.addEventListener('visibilitychange',function(){vis=!document.hidden;});
  cv.addEventListener('webglcontextlost',function(e){e.preventDefault();alive=false;st.classList.remove('gl-on');});
  gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);
  var first=true,lastTs=0,acc=0,cnt=0;
  function frame(ts){
    if(!alive)return;requestAnimationFrame(frame);if(!vis){lastTs=0;return;}
    /* low-end guard: no GPU / software GL → hand the star back to the SVG */
    if(lastTs){var d=ts-lastTs;if(d<250){acc+=d;cnt++;}if(cnt===50&&!window.__glForce&&acc/cnt>46){alive=false;st.classList.remove('gl-on');if(cv.parentNode)cv.parentNode.removeChild(cv);return;}}
    lastTs=ts;
    var t=ts*.001;if(tStart<0&&html.classList.contains('ready'))tStart=t;
    var ramp=tStart<0?0:Math.min(1,(t-tStart)/2.2);ramp=ramp*ramp*(3-2*ramp);
    ptX+=(tx-ptX)*.06;ptY+=(ty-ptY)*.06;hue+=(GL_TIER-hue)*.04;
    var A=CALM?.3:1,ry=(Math.sin(t*.85)*.46)*ramp*A+ptX*.38*A,rx=(Math.sin(t*.66+1.1)*.15+.1)*ramp*A-ptY*.26*A,rz=Math.sin(t*.5)*.05*ramp*A;
    var model=mul(mul(rotY(ry),rotX(rx)),rotZ(rz)),vp=mul(proj,trans(-EYE));
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.BLEND);gl.depthMask(true);gl.useProgram(gem);
    gl.uniformMatrix4fv(lg.M,false,model);gl.uniformMatrix4fv(lg.VP,false,vp);
    gl.uniform3f(lg.L,2.6*Math.cos(t*.5)+ptX*2.4,2.2+Math.sin(t*.4),3.4);gl.uniform3f(lg.E,0,0,EYE);gl.uniform1f(lg.T,t);gl.uniform1f(lg.Hue,hue);
    gl.bindBuffer(gl.ARRAY_BUFFER,bP);gl.enableVertexAttribArray(aP);gl.vertexAttribPointer(aP,3,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,bN);gl.enableVertexAttribArray(aN);gl.vertexAttribPointer(aN,3,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,bT);gl.enableVertexAttribArray(aT);gl.vertexAttribPointer(aT,1,gl.FLOAT,false,0,0);
    gl.drawArrays(gl.TRIANGLES,0,nV);
    gl.disable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);gl.useProgram(flare);
    gl.uniformMatrix4fv(lf.M,false,model);gl.uniformMatrix4fv(lf.VP,false,vp);gl.uniform1f(lf.T,t);
    gl.bindBuffer(gl.ARRAY_BUFFER,bQ);gl.enableVertexAttribArray(aQ);gl.vertexAttribPointer(aQ,2,gl.FLOAT,false,0,0);gl.drawArrays(gl.TRIANGLES,0,6);
    gl.enable(gl.DEPTH_TEST);
    if(first){first=false;st.classList.add('gl-on');}
  }
  requestAnimationFrame(frame);
}

/* ── pinned story: scroll position scrubs the four scenes ── */
function story(){
  var s=$('#story');if(!s||RM)return;s.hidden=false;html.classList.add('story-on');
  var items=$$('#slist li'),url=$('#surl'),badge=$('#sbadge');
  var urls=['kōrero · 30 min','mockup · fixed price','build · live preview','yourbusiness.co.nz'],badges=['free','48h','demos','live'];
  var cur=0,tgt=0,step=-1,raf=0;
  function target(){var r=s.getBoundingClientRect(),tot=s.offsetHeight-innerHeight;tgt=clamp(-r.top/Math.max(tot,1),0,1);}
  function apply(p){s.style.setProperty('--p',p.toFixed(4));for(var i=0;i<4;i++)s.style.setProperty('--p'+i,clamp(p*4-i,0,1).toFixed(4));
    var st=Math.min(3,Math.floor(p*4+.0001));
    if(st!==step){step=st;s.setAttribute('data-step',st);items.forEach(function(li,i){li.classList.toggle('on',i===st);li.classList.toggle('done',i<st);});url.textContent=urls[st];badge.textContent=badges[st];}}
  function loop(){cur+=(tgt-cur)*.14;if(Math.abs(tgt-cur)<.0005)cur=tgt;apply(cur);raf=requestAnimationFrame(loop);}
  if('IntersectionObserver' in window){new IntersectionObserver(function(es){if(es[0].isIntersecting){target();if(!raf)raf=requestAnimationFrame(loop);}else{cancelAnimationFrame(raf);raf=0;}},{rootMargin:'120px'}).observe(s);}
  else{raf=requestAnimationFrame(loop);}
  window.addEventListener('scroll',target,{passive:true});window.addEventListener('resize',target);target();apply(0);
}

/* ── motion setting: Full / Calm / Still, remembered; first visit on a reduced-motion OS gets an offer ── */
function motionUI(){
  var mode=RM?'still':(CALM?'calm':'full'),btn=$('#motBtn'),lbl=$('#motLbl'),t=$('#motToast');
  if(lbl)lbl.textContent=mode.charAt(0).toUpperCase()+mode.slice(1);
  function set(m,intro){try{localStorage.setItem('wd_motion',m);localStorage.setItem('wd_motion_seen','1');}catch(e){}location.href=location.pathname+(intro?'?intro=1':'?intro=0');}
  window.__wdMotion=set;
  if(btn)btn.addEventListener('click',function(){var n=({full:'calm',calm:'still',still:'full'})[mode];set(n,n!=='still');});
  var osr=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches,pref='',seen='';
  try{pref=localStorage.getItem('wd_motion')||'';seen=localStorage.getItem('wd_motion_seen')||'';}catch(e){}
  if(t&&osr&&!pref&&!seen){
    setTimeout(function(){t.hidden=false;},3500);
    $('#motFull').addEventListener('click',function(){set('full',true);});
    $('#motKeep').addEventListener('click',function(){try{localStorage.setItem('wd_motion','calm');localStorage.setItem('wd_motion_seen','1');}catch(e){}t.hidden=true;});
  }
}

function init(){
  nz();setInterval(nz,30000);
  field($('#stars'),RM?90:150,CALM?.3:1);
  motionUI();starParallax();heroGL();cursor();magnetic();sparks();words();scrolly();story();faq();est();palette();
  var rp=$('#replay');if(rp)rp.addEventListener('click',function(){location.href=location.pathname+'?intro=1';});
  if(html.classList.contains('intro-on')){runIntro();}else{requestAnimationFrame(function(){requestAnimationFrame(readyUp);});}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
