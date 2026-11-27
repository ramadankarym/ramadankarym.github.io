/* ==========================================================================
   v10 engine — cinematic stage for the Ramadan countdown
   1. WebGL night sky (procedural, no libraries, adaptive resolution)
   2. Crescent + skyline + lanterns with spring physics and parallax
   3. Gold-leaf digits with roll transitions
   4. Scroll choreography, topbar condensation, reduced-motion fallback
   ========================================================================== */

const doc = document;
const root = doc.documentElement;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const isPhone = window.matchMedia('(max-width: 560px)').matches;
const hero = doc.querySelector('.hero');

/* ------------------------------------------------------------------ helpers */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const arDigits = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);

/* ------------------------------------------------------- 1. the night sky */
function initSky() {
  const canvas = doc.getElementById('sky');
  if (!canvas || !hero) return null;
  const gl = canvas.getContext('webgl', {
    alpha: false, antialias: false, depth: false, stencil: false,
    powerPreference: 'high-performance', premultipliedAlpha: false,
  });
  if (!gl) { root.classList.add('no-webgl'); return null; }

  const VERT = `
    attribute vec2 aPos;
    void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
  `;

  const FRAG = `
    precision highp float;
    uniform vec2  uRes;
    uniform float uTime;
    uniform vec2  uPtr;
    uniform vec2  uMoon;
    uniform float uScroll;

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }
    vec2 hash22(vec2 p) {
      float n = hash21(p);
      return vec2(n, hash21(p + n * 71.7));
    }
    float vnoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      float a = hash21(i);
      float b = hash21(i + vec2(1.0, 0.0));
      float c = hash21(i + vec2(0.0, 1.0));
      float d = hash21(i + vec2(1.0, 1.0));
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }
    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.55;
      for (int i = 0; i < 4; i++) {
        v += a * vnoise(p);
        p = p * 2.04 + vec2(13.7, 7.3);
        a *= 0.5;
      }
      return v;
    }
    float starLayer(vec2 p, float scale, float cut, float size, float t, float gain) {
      vec2 g = p * scale;
      vec2 id = floor(g);
      vec2 f = fract(g) - 0.5;
      float r = hash21(id);
      float on = step(cut, r);
      vec2 off = (hash22(id) - 0.5) * 0.72;
      float d = length(f - off);
      float core = smoothstep(size, 0.0, d);
      core *= core * core;
      float tw = 0.55 + 0.45 * sin(t * (0.7 + r * 2.6) + r * 41.0);
      return core * tw * on * gain * (0.35 + 0.65 * r);
    }

    void main() {
      vec2 frag = gl_FragCoord.xy / uRes;
      vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
      float v = frag.y;
      float t = uTime;

      // base night: deep emerald with a warm horizon
      vec3 col = mix(vec3(0.010, 0.048, 0.037), vec3(0.017, 0.082, 0.062), smoothstep(0.0, 0.55, v));
      col = mix(col, vec3(0.005, 0.024, 0.019), smoothstep(0.5, 1.0, v));
      col += vec3(0.20, 0.12, 0.04) * exp(-abs(v - 0.03) * 8.0) * 0.22;

      // nebula / aurora ribbons
      vec2 q = vec2(p.x * 1.05, p.y * 1.55) + uPtr * 0.012;
      float drift = t * 0.011;
      vec2 warp = vec2(fbm(q * 1.25 + drift), fbm(q * 1.25 - drift + 5.2));
      float n = fbm(q * 1.55 + warp * 1.5 + vec2(0.0, t * 0.018));
      float band = fbm(vec2(q.x * 0.85 + drift * 1.6, q.y * 2.4 - t * 0.02));
      col += vec3(0.050, 0.205, 0.150) * pow(n, 3.0) * 0.22;
      col += vec3(0.20, 0.13, 0.032) * pow(max(n - 0.64, 0.0) * 2.8, 2.0) * 0.11;
      col += vec3(0.070, 0.225, 0.165) * pow(max(band - 0.50, 0.0), 2.4) * 0.18 * smoothstep(0.1, 0.95, v);

      // stars, three parallax depths
      vec2 sp = p + uPtr * 0.02;
      col += vec3(0.95, 0.93, 0.86) * starLayer(sp, 24.0, 0.70, 0.055, t, 1.5);
      col += vec3(0.88, 0.90, 0.92) * starLayer(p + uPtr * 0.038 + 3.1, 15.0, 0.82, 0.045, t * 1.2, 0.9);
      col += vec3(1.0, 0.88, 0.62) * starLayer(p + uPtr * 0.055 + 8.7, 9.0, 0.90, 0.035, t * 0.8, 1.1);

      // moon bloom + volumetric shafts
      float d = length(p - uMoon);
      float ang = atan(p.y - uMoon.y, p.x - uMoon.x);
      float rayNoise = fbm(vec2(ang * 2.1, t * 0.05));
      float shafts = pow(max(0.0, sin(ang * 9.0 + rayNoise * 6.5)), 7.0) * exp(-d * 2.4);
      col += vec3(1.0, 0.88, 0.60) * exp(-d * 11.0) * 0.30;
      col += vec3(1.0, 0.82, 0.48) * exp(-d * 4.2) * 0.055;
      col += vec3(1.0, 0.80, 0.42) * shafts * 0.075;

      // a shooting star every few seconds
      float sc = 9.0;
      float cyc = floor(t / sc);
      float ph = fract(t / sc);
      vec2 h = hash22(vec2(cyc, 3.7));
      vec2 start = vec2(mix(-1.0, 0.75, h.x), mix(0.25, 0.95, h.y));
      vec2 dir = normalize(vec2(0.85, -0.5));
      float prog = ph * 2.0 - 0.35;
      vec2 head = start + dir * prog;
      float alive = smoothstep(0.0, 0.12, prog) * smoothstep(1.25, 0.45, prog);
      float head_ = exp(-length(p - head) * 190.0);
      float tail = exp(-length(p - (head - dir * 0.055)) * 70.0) * 0.5;
      col += vec3(1.0, 0.96, 0.84) * (head_ + tail) * alive * 1.5;

      // horizon mist
      float mist = fbm(vec2(p.x * 2.2 + t * 0.02, v * 3.4));
      col += vec3(0.055, 0.145, 0.11) * mist * smoothstep(0.40, 0.0, v) * 0.28;

      // scroll: sky recedes
      col *= mix(1.0, 0.62, uScroll);

      // grade: vignette + grain + edge warmth
      col *= 1.0 - 0.62 * pow(length(p * vec2(0.92, 0.78)), 2.2);
      col += vec3(0.02, 0.008, 0.0) * smoothstep(0.4, 1.0, length(p));
      float g = hash21(gl_FragCoord.xy + fract(t) * 137.0);
      col += (g - 0.5) * 0.016;

      gl_FragColor = vec4(max(col, 0.0), 1.0);
    }
  `;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('shader', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) { root.classList.add('no-webgl'); return null; }
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    root.classList.add('no-webgl');
    return null;
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const U = {
    res: gl.getUniformLocation(prog, 'uRes'),
    time: gl.getUniformLocation(prog, 'uTime'),
    ptr: gl.getUniformLocation(prog, 'uPtr'),
    moon: gl.getUniformLocation(prog, 'uMoon'),
    scroll: gl.getUniformLocation(prog, 'uScroll'),
  };

  const maxQ = Math.min(window.devicePixelRatio || 1, 2);
  let q = isPhone ? 0.62 : 0.78;      // render scale relative to CSS pixels
  let W = 1, H = 1;

  function resize() {
    const r = hero.getBoundingClientRect();
    W = Math.max(2, Math.round(r.width));
    H = Math.max(2, Math.round(r.height));
    const s = clamp(q * maxQ, 0.35, 1.5);
    canvas.width = Math.max(2, Math.round(W * s));
    canvas.height = Math.max(2, Math.round(H * s));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(U.res, canvas.width, canvas.height);
  }
  resize();

  const state = {
    ptr: { x: 0, y: 0, tx: 0, ty: 0 },
    moon: { x: 0, y: 0.28 },
    scroll: 0,
    t: 0,
  };

  function measureMoon() {
    const moon = doc.querySelector('.fx-moon');
    const rect = (moon || canvas).getBoundingClientRect();
    const hr = hero.getBoundingClientRect();
    const cx = rect.left - hr.left + rect.width / 2;
    const cy = rect.top - hr.top + rect.height / 2;
    // convert to the shader's aspect-corrected space (origin centre, y up)
    state.moon.x = (cx - W / 2) / H;
    state.moon.y = (H / 2 - cy) / H;
  }

  let raf = 0, last = performance.now(), acc = 0, frames = 0, ftSum = 0;

  function draw(now) {
    const dt = Math.min(0.06, (now - last) / 1000);
    last = now;
    frames += 1;
    ftSum += dt;
    if (frames === 45) {
      const avg = ftSum / frames;
      if (avg > 0.026 && q > 0.42) { q -= 0.1; resize(); }
      else if (avg < 0.0135 && q < (isPhone ? 0.85 : 1.0)) { q += 0.06; resize(); }
      frames = 0; ftSum = 0;
    }
    if (!root.classList.contains('motion-paused')) acc += dt;
    state.ptr.x = lerp(state.ptr.x, state.ptr.tx, 0.045);
    state.ptr.y = lerp(state.ptr.y, state.ptr.ty, 0.045);
    gl.uniform1f(U.time, acc);
    gl.uniform2f(U.ptr, state.ptr.x, state.ptr.y);
    gl.uniform2f(U.moon, state.moon.x, state.moon.y);
    gl.uniform1f(U.scroll, state.scroll);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(draw);
  }

  measureMoon();
  raf = requestAnimationFrame(draw);

  window.addEventListener('resize', () => { resize(); measureMoon(); }, { passive: true });
  if (reduced.matches) {
    // one static frame is enough
    cancelAnimationFrame(raf);
    state.scroll = 0;
    gl.uniform1f(U.time, 12.0);
    gl.uniform2f(U.ptr, 0, 0);
    gl.uniform2f(U.moon, state.moon.x, state.moon.y);
    gl.uniform1f(U.scroll, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  return { state, measureMoon, canvas };
}

/* ---------------------------------------------- 2. crescent, skyline, lamps */
const MOON_SVG = `
<svg viewBox="0 0 200 200" aria-hidden="true">
  <defs>
    <radialGradient id="moonBloom" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffd27a" stop-opacity=".30"/>
      <stop offset="38%" stop-color="#ffc266" stop-opacity=".10"/>
      <stop offset="100%" stop-color="#ffb347" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="moonBody" x1="18%" y1="4%" x2="70%" y2="98%">
      <stop offset="0%" stop-color="#fffdf4"/>
      <stop offset="22%" stop-color="#ffeec0"/>
      <stop offset="52%" stop-color="#f6d189"/>
      <stop offset="78%" stop-color="#dcaa4c"/>
      <stop offset="100%" stop-color="#a87a2c"/>
    </linearGradient>
    <linearGradient id="moonRim" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fffef8" stop-opacity=".95"/>
      <stop offset="60%" stop-color="#ffe8b0" stop-opacity=".35"/>
      <stop offset="100%" stop-color="#ffcf76" stop-opacity="0"/>
    </linearGradient>
    <mask id="crescentMask">
      <rect x="0" y="0" width="200" height="200" fill="#000"/>
      <circle cx="94" cy="100" r="62" fill="#fff"/>
      <circle cx="122" cy="86" r="56" fill="#000"/>
    </mask>
  </defs>
  <circle class="moon-bloom" cx="100" cy="100" r="98" fill="url(#moonBloom)"/>
  <g class="moon-float">
    <g mask="url(#crescentMask)">
      <circle cx="94" cy="100" r="62" fill="url(#moonBody)"/>
      <circle cx="94" cy="100" r="62" fill="none" stroke="url(#moonRim)" stroke-width="3"/>
      <circle cx="74" cy="84" r="5" fill="#c8952f" opacity=".13"/>
      <circle cx="80" cy="122" r="7" fill="#c8952f" opacity=".10"/>
    </g>
  </g>
  <g fill="#ffe6a6" opacity=".8">
    <path d="M170 60l2 5.4 5.4 2-5.4 2-2 5.4-2-5.4-5.4-2 5.4-2z" opacity=".55"/>
  </g>
</svg>`;

const SKYLINE_SVG = `
<svg viewBox="0 0 1440 260" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <defs>
    <linearGradient id="skyFill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#061c16"/>
      <stop offset="60%" stop-color="#04120e"/>
      <stop offset="100%" stop-color="#030d0a"/>
    </linearGradient>
    <linearGradient id="skyRim" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#f2cb6d" stop-opacity="0"/>
      <stop offset="22%" stop-color="#f2cb6d" stop-opacity=".55"/>
      <stop offset="50%" stop-color="#ffe6a6" stop-opacity=".8"/>
      <stop offset="78%" stop-color="#f2cb6d" stop-opacity=".5"/>
      <stop offset="100%" stop-color="#f2cb6d" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <g fill="url(#skyFill)">
    <path d="M0 210h120v-42h10v42h34v-26h16v26h44v-58c0-10 6-16 12-22 6 6 12 12 12 22v58h36v-34h14v34h58v-70c0-14 9-22 18-30 9 8 18 16 18 30v70h44v-30h12v30h74v-52c0-12 7-19 14-25 7 6 14 13 14 25v52h40v-24h14v24h96v-46h8v46h52v-30h12v30h64v-64c0-13 8-20 16-28 8 8 16 15 16 28v64h40v-32h14v32h70v-50h10v50h52v-26h12v26h130v50H0z"/>
    <path d="M0 236h1440v24H0z"/>
  </g>
  <g fill="none" stroke="url(#skyRim)" stroke-width="1.4" stroke-linecap="round" opacity=".8">
    <path d="M120 168h10M164 184h16M224 152c0-10 6-16 12-22 6 6 12 12 12 22M308 176h14M438 140c0-14 9-22 18-30 9 8 18 16 18 30M562 180h12M736 158c0-12 7-19 14-25 7 6 14 13 14 25M824 186h14M1012 152c0-13 8-20 16-28 8 8 16 15 16 28M1092 178h14M1200 162h10"/>
  </g>
  <g stroke="url(#skyRim)" stroke-width="1.1" fill="none" opacity=".45">
    <path d="M0 210h1440"/>
  </g>
  <g fill="#ffd98a" opacity=".5">
    <rect x="246" y="176" width="3" height="4" rx="1"/>
    <rect x="470" y="168" width="3" height="4" rx="1"/>
    <rect x="486" y="182" width="3" height="4" rx="1"/>
    <rect x="760" y="184" width="3" height="4" rx="1"/>
    <rect x="1040" y="180" width="3" height="4" rx="1"/>
    <rect x="1060" y="192" width="3" height="4" rx="1"/>
  </g>
</svg>`;

const LAMP_SVG = `
<svg viewBox="0 0 60 108" aria-hidden="true">
  <defs>
    <linearGradient id="brass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fff0c2"/>
      <stop offset="38%" stop-color="#e9c273"/>
      <stop offset="72%" stop-color="#b98c33"/>
      <stop offset="100%" stop-color="#7d5a1e"/>
    </linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffdd94" stop-opacity=".95"/>
      <stop offset="52%" stop-color="#ffbe58" stop-opacity=".82"/>
      <stop offset="100%" stop-color="#e08b23" stop-opacity=".9"/>
    </linearGradient>
    <radialGradient id="inner" cx="50%" cy="62%" r="55%">
      <stop offset="0%" stop-color="#fff6d2" stop-opacity=".95"/>
      <stop offset="100%" stop-color="#ffc061" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <g stroke="url(#brass)" fill="none" stroke-width="1.6" stroke-linejoin="round">
    <path d="M30 2v10" stroke-linecap="round"/>
    <path d="M22 14h16l-2 6H24z" fill="url(#brass)" fill-opacity=".28"/>
    <path d="M18 22h24l-3 10H21z" fill="url(#brass)" fill-opacity=".18"/>
  </g>
  <g>
    <path d="M16 34h28l6 26-6 26H16l-6-26z" fill="url(#glass)" opacity=".92"/>
    <path d="M16 34h28l6 26-6 26H16l-6-26z" fill="url(#inner)" opacity=".7"/>
    <path class="flame" d="M30 50c5 6 7 10 7 15a7 7 0 0 1-14 0c0-5 2-9 7-15z" fill="#fff4c9" opacity=".9"/>
  </g>
  <g stroke="url(#brass)" fill="none" stroke-width="1.7" stroke-linejoin="round">
    <path d="M16 34h28l6 26-6 26H16l-6-26z"/>
    <path d="M10 86h40l-4 8H14z" fill="url(#brass)" fill-opacity=".3"/>
    <path d="M14 94h32" stroke-linecap="round"/>
    <path d="M22 30h16M24 26h12" stroke-linecap="round" opacity=".7"/>
  </g>
  <g stroke="url(#brass)" stroke-width=".9" opacity=".55" fill="none">
    <path d="M22 40v46M38 40v46M16 52h28M15 64h30M15 76h30"/>
  </g>
</svg>`;

function initStage(sky) {
  if (!hero) return;
  // crescent
  if (!doc.querySelector('.fx-moon')) {
    const moon = doc.createElement('div');
    moon.className = 'fx-moon';
    moon.setAttribute('aria-hidden', 'true');
    moon.innerHTML = MOON_SVG;
    const anchor = hero.querySelector('.eyebrow');
    hero.insertBefore(moon, anchor || hero.firstChild);
  }
  // skyline
  if (!doc.querySelector('.fx-skyline')) {
    const line = doc.createElement('div');
    line.className = 'fx-skyline';
    line.setAttribute('aria-hidden', 'true');
    line.innerHTML = SKYLINE_SVG + '<span class="sky-haze"></span>';
    hero.appendChild(line);
  }
  // foreground bokeh
  if (!doc.querySelector('.fx-bokeh')) {
    const bok = doc.createElement('div');
    bok.className = 'fx-bokeh';
    bok.setAttribute('aria-hidden', 'true');
    const orbs = isPhone
      ? [[12, 78, 34, .5, 0], [86, 64, 26, .38, 6], [70, 88, 18, .3, 12]]
      : [[10, 72, 54, .45, 0], [92, 58, 40, .35, 7], [64, 90, 28, .3, 13], [24, 92, 22, .22, 18]];
    orbs.forEach(([x, y, size, op, delay]) => {
      const sp = doc.createElement('span');
      sp.style.left = x + '%';
      sp.style.top = y + '%';
      sp.style.width = size + 'px';
      sp.style.height = size + 'px';
      sp.style.opacity = op;
      sp.style.animationDelay = '-' + delay + 's';
      bok.appendChild(sp);
    });
    hero.appendChild(bok);
  }
  // lanterns
  if (!doc.querySelector('.fx-lanterns')) {
    const stage = doc.createElement('div');
    stage.className = 'fx-lanterns';
    stage.setAttribute('aria-hidden', 'true');
    const lamps = isPhone
      ? [
          { left: 3, w: 22, cord: 58, depth: 0.55, o: 0.8, speed: 0.55, phase: 0.4 },
          { left: 85, w: 26, cord: 34, depth: 0.85, o: 0.9, speed: 0.42, phase: 2.1 },
          { left: 72, w: 16, cord: 120, depth: 0.3, o: 0.45, speed: 0.75, phase: 4.2 },
        ]
      : [
          { left: 6, w: 40, cord: 80, depth: 0.9, o: 0.9, speed: 0.42, phase: 0.2 },
          { left: 89, w: 46, cord: 54, depth: 1.0, o: 0.95, speed: 0.36, phase: 2.6 },
          { left: 16, w: 24, cord: 150, depth: 0.45, o: 0.5, speed: 0.62, phase: 4.1 },
          { left: 77, w: 20, cord: 190, depth: 0.4, o: 0.4, speed: 0.7, phase: 1.4 },
        ];
    const nodes = [];
    lamps.forEach((cfg) => {
      const el = doc.createElement('div');
      el.className = 'fx-lantern';
      el.style.setProperty('--w', cfg.w + 'px');
      el.style.setProperty('--cord', cfg.cord + 'px');
      el.style.setProperty('--o', cfg.o);
      el.style.left = cfg.left + '%';
      el.innerHTML = '<span class="cord"></span>' + LAMP_SVG + '<span class="halo"></span>';
      stage.appendChild(el);
      nodes.push({ el, ...cfg, a: 0, av: 0 });
    });
    hero.appendChild(stage);

    const physics = (now) => {
      const t = now / 1000;
      const paused = root.classList.contains('motion-paused') || reduced.matches;
      nodes.forEach((n, i) => {
        const wind = Math.sin(t * n.speed + n.phase) * 2.4 + Math.sin(t * n.speed * 2.7 + n.phase * 1.7) * 1.1;
        const pull = (sky ? sky.state.ptr.x : 0) * 3.2 * n.depth;
        const target = paused ? 0 : wind + pull;
        n.av += (target - n.a) * 0.035 - n.av * 0.12;
        n.a += n.av;
        const dy = (sky ? sky.state.scroll : 0) * -46 * n.depth;
        n.el.style.transform = `translate3d(0,${dy.toFixed(2)}px,0) rotate(${n.a.toFixed(3)}deg)`;
        if (i === 0 && !paused) {
          const halo = n.el.querySelector('.halo');
          if (halo) halo.style.opacity = (0.6 + 0.25 * Math.sin(t * 3.1 + n.phase)).toFixed(3);
        }
      });
      requestAnimationFrame(physics);
    };
    requestAnimationFrame(physics);
  }
}

/* ------------------------------------------------- 3. gold-leaf digits */
function initDigits() {
  const units = doc.querySelectorAll('.time-unit');
  units.forEach((unit) => {
    const value = unit.querySelector('.time-value');
    if (!value) return;
    if (!unit.dataset.unit) unit.dataset.unit = value.id || '';
    const set = doc.createElement('div');
    set.className = 'dg-set';
    set.setAttribute('aria-hidden', 'true');
    value.parentNode.insertBefore(set, value);
    let rendered = '';
    const render = (txt) => {
      const chars = [...String(txt)];
      const zc = (ch) => (ch === '\u0660' || ch === '0' ? ' z' : '');
      if (!set.children.length) {
        chars.forEach((ch) => {
          const cell = doc.createElement('span');
          cell.className = 'dg';
          cell.innerHTML = `<span class="dg-in settle${zc(ch)}">${ch}</span>`;
          set.appendChild(cell);
        });
        rendered = txt;
        return;
      }
      const cells = [...set.children];
      chars.forEach((ch, i) => {
        const cell = cells[i];
        if (!cell) return;
        const inner = cell.firstElementChild;
        if (inner && inner.textContent === ch) return;
        const out = doc.createElement('span');
        out.className = 'dg-in leave-up' + (inner ? zc(inner.textContent) : '');
        out.textContent = inner ? inner.textContent : '';
        const next = doc.createElement('span');
        next.className = 'dg-in enter-down' + zc(ch);
        next.textContent = ch;
        cell.appendChild(out);
        cell.appendChild(next);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          next.classList.remove('enter-down');
          next.classList.add('settle');
        }));
        window.setTimeout(() => { if (out.parentNode) out.remove(); }, 620);
        if (inner) inner.remove();
      });
      rendered = txt;
      if (unit.dataset.unit === 'seconds' || value.id === 'seconds') {
        unit.classList.remove('tick');
        void unit.offsetWidth;
        unit.classList.add('tick');
      }
    };
    render(value.textContent);
    new MutationObserver(() => {
      if (value.textContent !== rendered) render(value.textContent);
    }).observe(value, { childList: true, characterData: true, subtree: true });
  });
}

/* ------------------------------------------------ journey-to-Ramadan progress */
function initJourney() {
  const fill = doc.getElementById('journey-fill');
  const moon = doc.getElementById('journey-moon');
  const pctEl = doc.getElementById('journey-pct');
  if (!fill || !moon || !pctEl) return;
  const target = window.RK.targets.sunset.getTime();
  const SPAN = 354 * 24 * 3600 * 1000;
  const tick = () => {
    const rem = Math.max(0, target - Date.now());
    const pct = Math.min(99.4, Math.max(0, (1 - rem / SPAN) * 100));
    fill.style.width = pct + '%';
    moon.style.insetInlineStart = pct + '%';
    pctEl.textContent = arDigits(Math.floor(pct)) + '٪';
  };
  tick();
  window.setInterval(tick, 1000);
}

/* -------------------------------------------- 4. scroll + intro choreography */
function initChrome(sky) {
  const topbar = doc.querySelector('.topbar');
  const revealTargets = doc.querySelectorAll(
    '.daily-card-panel, .daily-card-actions, .creator-panel, .creator-title, .creator-sub, .tool-panel, .signature, .disclaimer'
  );
  revealTargets.forEach((el) => el.classList.add('rv'));

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY || 0;
      if (topbar) topbar.classList.toggle('condensed', y > 24);
      if (sky) {
        const h = Math.max(1, hero.offsetHeight);
        sky.state.scroll = clamp(y / h, 0, 1);
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('in'));
  }

  // pointer / device tilt parallax
  const ptr = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    ptr.x = (e.clientX / window.innerWidth) * 2 - 1;
    ptr.y = (e.clientY / window.innerHeight) * 2 - 1;
    if (sky) { sky.state.ptr.tx = ptr.x; sky.state.ptr.ty = -ptr.y; }
  }, { passive: true });
  window.addEventListener('deviceorientation', (e) => {
    if (e.gamma == null || e.beta == null) return;
    if (sky) { sky.state.ptr.tx = clamp(e.gamma / 30, -1, 1); sky.state.ptr.ty = clamp((e.beta - 45) / 40, -1, 1); }
  }, { passive: true });

  // intro
  const go = () => requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('v10-ready')));
  if (doc.readyState === 'complete') go();
  else window.addEventListener('load', go, { once: true });
  window.setTimeout(go, 1800); // never leave the page blank if load stalls
}

/* --------------------------------------------------------------- boot */
function boot() {
  const sky = initSky();
  initStage(sky);
  initDigits();
  initJourney();
  initChrome(sky);
}
if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
