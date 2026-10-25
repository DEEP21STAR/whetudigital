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
