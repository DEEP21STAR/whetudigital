/* SALINA Cinematic Globe — Three.js procedural shader earth in gold/saffron palette
   Replaces the SVG flat map in Overview with a slowly rotating sacred globe.
   Cities pulse in their region color. Arcs from Hamilton drift around. */
(() => {
'use strict';

function init() {
  if (!window.THREE) { setTimeout(init, 300); return; }
  const wrap = document.getElementById('worldMapWrap');
  if (!wrap) { setTimeout(init, 400); return; }
  // Don't double-init
  if (wrap.dataset.globeReady) return;
  wrap.dataset.globeReady = '1';
  // Clear existing SVG
  wrap.innerHTML = '';
  wrap.style.position = 'relative';
  wrap.style.aspectRatio = '16/9';
  wrap.style.background = 'radial-gradient(ellipse at center, rgba(20,10,5,0.55), rgba(8,5,12,0.96))';

  const W = wrap.clientWidth || 1000;
  const H = Math.round(W * 9 / 16);

  // Scene setup
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, W/H, 0.1, 100);
  camera.position.set(0, 0, 3.6);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.setClearColor(0x000000, 0);
  wrap.appendChild(renderer.domElement);

  // Procedural shader sphere (gold/saffron sacred earth)
  const sphereGeo = new THREE.SphereGeometry(1, 96, 96);
  const vShader = `
    varying vec3 vNormal;
    varying vec3 vPos;
    varying vec2 vUv;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPos = position;
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  const fShader = `
    precision highp float;
    uniform float uTime;
    varying vec3 vNormal;
    varying vec3 vPos;
    varying vec2 vUv;

    // Pseudo continents from noise — gold/saffron land vs deep ruby ocean
    float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
    float noise(vec2 p){
      vec2 i=floor(p), f=fract(p);
      float a=hash(i), b=hash(i+vec2(1,0)), c=hash(i+vec2(0,1)), d=hash(i+vec2(1,1));
      vec2 u=f*f*(3.0-2.0*f);
      return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
    }
    float fbm(vec2 p){
      float v=0., a=0.5;
      for(int i=0;i<5;i++){ v += a*noise(p); p*=2.03; a*=0.5; }
      return v;
    }

    void main() {
      // Spherical UV (lat/lon)
      float lat = asin(vPos.y) / 3.14159 + 0.5;
      float lon = atan(vPos.x, vPos.z) / 6.2831 + 0.5;
      vec2 uv = vec2(lon, lat);

      // Continents via fbm threshold
      float n = fbm(uv * 6.0 + vec2(uTime*0.012, uTime*0.005));
      float land = smoothstep(0.48, 0.55, n);

      // Land = warm gold gradient; Ocean = deep ruby/black
      vec3 landColor = mix(vec3(0.97, 0.78, 0.34), vec3(0.95, 0.45, 0.09), n);
      vec3 oceanColor = mix(vec3(0.08, 0.02, 0.04), vec3(0.20, 0.04, 0.04), 0.3 + 0.7 * noise(uv*40.0));

      vec3 col = mix(oceanColor, landColor, land);

      // Aurora soft band drift
      float aurora = sin((uv.y + uTime*0.04) * 18.0) * 0.5 + 0.5;
      col += vec3(0.95, 0.78, 0.34) * aurora * 0.06;

      // Atmospheric fresnel rim
      vec3 viewDir = normalize(cameraPosition - vPos);
      float fres = pow(1.0 - max(0.0, dot(vNormal, viewDir)), 2.6);
      col += vec3(0.95, 0.78, 0.34) * fres * 0.6;

      // Subtle terminator (day/night fall-off using lon for fake sun)
      float lit = 0.55 + 0.45 * smoothstep(-0.2, 0.6, dot(vNormal, vec3(0.6, 0.3, 0.7)));
      col *= lit;

      gl_FragColor = vec4(col, 1.0);
    }
  `;
  const sphereMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: vShader,
    fragmentShader: fShader,
  });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  scene.add(sphere);

  // Glow halo (additive sprite-like sphere slightly larger)
  const haloGeo = new THREE.SphereGeometry(1.06, 64, 64);
  const haloMat = new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    uniforms: { uTime: { value: 0 } },
    vertexShader: vShader,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vPos;
      void main() {
        vec3 viewDir = normalize(cameraPosition - vPos);
        float fres = pow(1.0 - max(0.0, dot(normalize(vNormal), viewDir)), 3.0);
        vec3 col = mix(vec3(0.95, 0.45, 0.09), vec3(0.96, 0.78, 0.34), fres);
        gl_FragColor = vec4(col, fres * 0.55);
      }
    `,
  });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  scene.add(halo);

  // City dots — from GUESTS_DATA regions
  const cities = [
    { name:'Auckland',  region:'akl', lat:-36.85, lon:174.76, color:0x10d8ff },
    { name:'Hamilton',  region:'ham', lat:-37.78, lon:175.28, color:0xf5c557 },
    { name:'Sydney',    region:'aus', lat:-33.87, lon:151.21, color:0xf97316 },
    { name:'Melbourne', region:'aus', lat:-37.81, lon:144.96, color:0xf97316 },
    { name:'Suva',      region:'fji', lat:-18.14, lon:178.42, color:0x34d399 },
    { name:'Lautoka',   region:'fji', lat:-17.62, lon:177.45, color:0x34d399 },
    { name:'SF',        region:'usa', lat: 37.77, lon:-122.42, color:0xc040ff },
    { name:'Vancouver', region:'usa', lat: 49.28, lon:-123.12, color:0xc040ff },
    { name:'London',    region:'oth', lat: 51.51, lon:  -0.13, color:0xe57373 },
  ];
  const guests = (window.GUESTS_DATA && window.GUESTS_DATA.guests) || [];
  cities.forEach(c => {
    const cnt = guests.filter(g => g.region_id === c.region).length;
    const radius = 0.013 + Math.min(0.045, cnt * 0.0008);
    const phi = (90 - c.lat) * Math.PI/180;
    const theta = (c.lon + 180) * Math.PI/180;
    const r = 1.012;
    const x = -r * Math.sin(phi) * Math.cos(theta);
    const z = r * Math.sin(phi) * Math.sin(theta);
    const y = r * Math.cos(phi);
    const dotGeo = new THREE.SphereGeometry(radius, 12, 12);
    const dotMat = new THREE.MeshBasicMaterial({ color: c.color, transparent: true, opacity: 0.95 });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.set(x, y, z);
    sphere.add(dot);
    // Pulsing ring sprite
    const ringGeo = new THREE.RingGeometry(radius*1.6, radius*2.3, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: c.color, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(dot.position);
    ring.lookAt(0, 0, 0);
    sphere.add(ring);
    ring.userData.pulseT = Math.random() * Math.PI * 2;
    ring.userData.baseScale = 1;
    // store for animation
    if (!sphere.userData.pulseRings) sphere.userData.pulseRings = [];
    sphere.userData.pulseRings.push(ring);
  });

  // Resize handler
  function resize() {
    const newW = wrap.clientWidth || W;
    const newH = Math.round(newW * 9 / 16);
    camera.aspect = newW/newH;
    camera.updateProjectionMatrix();
    renderer.setSize(newW, newH);
  }
  window.addEventListener('resize', resize);

  // Animation loop
  let mouseX = 0, mouseY = 0, targetRotY = 0, targetRotX = 0;
  wrap.addEventListener('mousemove', (e) => {
    const rect = wrap.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) / rect.width - 0.5;
    mouseY = (e.clientY - rect.top) / rect.height - 0.5;
    targetRotY = mouseX * 0.5;
    targetRotX = -mouseY * 0.3;
  });
  let t = 0;
  function tick() {
    t += 0.005;
    sphereMat.uniforms.uTime.value = t * 4;
    haloMat.uniforms.uTime.value = t * 4;
    // Auto-rotation + mouse parallax
    sphere.rotation.y += 0.0015;
    sphere.rotation.y += (targetRotY - (sphere.rotation.y % (Math.PI*2)) * 0.001) * 0.02;
    sphere.rotation.x += (targetRotX - sphere.rotation.x) * 0.04;
    halo.rotation.copy(sphere.rotation);
    // Pulse rings
    if (sphere.userData.pulseRings) {
      sphere.userData.pulseRings.forEach(r => {
        r.userData.pulseT += 0.05;
        const s = 1 + Math.sin(r.userData.pulseT) * 0.45;
        r.scale.setScalar(s);
        r.material.opacity = 0.55 - Math.sin(r.userData.pulseT) * 0.3;
      });
    }
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();

  // Update legend below
  const legend = document.getElementById('wmLegend');
  if (legend) {
    const total = guests.length;
    const overseas = guests.filter(g => g.region_id !== 'akl' && g.region_id !== 'ham').length;
    legend.innerHTML = `
      <div class="wm-leg"><b>${total}</b><span>Total parivaar</span></div>
      <div class="wm-leg"><b>${cities.length}</b><span>Cities</span></div>
      <div class="wm-leg"><b>${overseas}</b><span>Overseas</span></div>
      <div class="wm-leg"><b>🌍</b><span>Drag globe with mouse</span></div>
    `;
  }
  console.log('[SALINA] Globe ready — 🪔');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(init, 800));
} else {
  setTimeout(init, 800);
}

})();
