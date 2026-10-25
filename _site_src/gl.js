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
  var first=true;
  function frame(ts){
    if(!alive)return;requestAnimationFrame(frame);if(!vis)return;
    var t=ts*.001;if(tStart<0&&html.classList.contains('ready'))tStart=t;
    var ramp=tStart<0?0:Math.min(1,(t-tStart)/2.2);ramp=ramp*ramp*(3-2*ramp);
    ptX+=(tx-ptX)*.06;ptY+=(ty-ptY)*.06;hue+=(GL_TIER-hue)*.04;
    var ry=(Math.sin(t*.85)*.46)*ramp+ptX*.38,rx=(Math.sin(t*.66+1.1)*.15+.1)*ramp-ptY*.26,rz=Math.sin(t*.5)*.05*ramp;
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
