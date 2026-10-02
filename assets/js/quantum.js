/* =========================================================
   Quantum Field — motor de partículas WebGL escrito a mano
   Un túnel de partículas que viaja hacia la cámara.
   API: window.Quantum.set({ dive, boost, warp, mx, my })
   ========================================================= */
(function () {
  'use strict';

  const canvas = document.querySelector('.quantum');
  if (!canvas) return;

  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false, powerPreference: 'high-performance' });
  if (!gl) { canvas.remove(); return; }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 700;
  const COUNT = small ? 3500 : 9000;
  const DEPTH = 40.0;

  const vert = `
    precision highp float;
    attribute vec4 aData;      // x: ángulo, y: radio, z: profundidad, w: semilla
    uniform float uTime;
    uniform float uTravel;
    uniform float uAspect;
    uniform float uPR;
    uniform float uDive;
    uniform float uWarp;
    uniform vec2  uMouse;
    varying float vAlpha;
    varying vec3  vColor;

    const float DEPTH = ${DEPTH.toFixed(1)};

    void main() {
      float seed = aData.w;
      float z = mod(aData.z + uTravel * (0.7 + seed * 0.6), DEPTH);   // 0 = lejos, DEPTH = cámara
      float depth = DEPTH - z + 0.35;                                 // distancia a la cámara
      float t = 1.0 - depth / DEPTH;                                   // 0 lejos -> 1 cerca

      // giro del vórtice: más fuerte cerca, aumenta al hacer scroll
      float twist = (0.15 + uDive * 1.4) * (1.0 - t) * 3.0 + uTime * (0.04 + seed * 0.05);
      float ang = aData.x + twist;
      float r = aData.y * (1.0 + 0.18 * sin(uTime * 0.6 + seed * 12.0 + z * 0.3));
      r *= mix(1.0, 0.55, uDive);                                      // el túnel se cierra al "encoger"

      vec3 p = vec3(cos(ang) * r, sin(ang) * r, -depth);
      // el centro del túnel sigue al ratón (más en profundidad)
      p.xy += uMouse * (1.0 - t) * 3.0;

      float f = 1.6;
      vec2 proj = p.xy * f / depth;
      proj.x /= uAspect;
      // estiramiento radial tipo "warp"
      proj *= 1.0 + uWarp * t * 0.6;
      gl_Position = vec4(proj, 0.0, 1.0);

      float size = (1.2 + seed * 2.6) * f * 12.0 / depth;
      gl_PointSize = clamp(size * uPR * (1.0 + uWarp * 1.5), 1.0, 60.0);

      float fadeFar = smoothstep(0.0, 0.25, t);
      float fadeNear = 1.0 - smoothstep(0.88, 1.0, t);
      vAlpha = fadeFar * fadeNear * (0.35 + seed * 0.65);

      vec3 red  = vec3(1.0, 0.16, 0.24);
      vec3 cyan = vec3(0.24, 0.95, 1.0);
      vec3 warm = vec3(1.0, 0.72, 0.30);
      float m = 0.5 + 0.5 * sin(aData.x * 2.0 + uTime * 0.3 + z * 0.15);
      vec3 c = mix(red, cyan, m);
      c = mix(c, warm, step(0.93, seed) * 0.8);
      c = mix(c, vec3(1.0), step(0.985, seed));
      vColor = c;
    }
  `;

  const frag = `
    precision mediump float;
    varying float vAlpha;
    varying vec3 vColor;
    uniform float uOpacity;
    void main() {
      vec2 uv = gl_PointCoord - 0.5;
      float d = length(uv);
      float core = smoothstep(0.5, 0.0, d);
      float glow = pow(core, 2.2);
      gl_FragColor = vec4(vColor * (0.6 + glow), glow * vAlpha * uOpacity);
    }
  `;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('[Quantum] shader:', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  const vs = compile(gl.VERTEX_SHADER, vert);
  const fs = compile(gl.FRAGMENT_SHADER, frag);
  if (!vs || !fs) { canvas.remove(); return; }
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); return; }
  gl.useProgram(prog);

  // --- datos de partículas ---
  const data = new Float32Array(COUNT * 4);
  for (let i = 0; i < COUNT; i++) {
    const k = i * 4;
    data[k] = Math.random() * Math.PI * 2;                 // ángulo
    const ring = Math.random();
    data[k + 1] = 0.6 + Math.pow(ring, 0.6) * 5.5;          // radio
    data[k + 2] = Math.random() * DEPTH;                    // profundidad
    data[k + 3] = Math.random();                            // semilla
  }
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  const aData = gl.getAttribLocation(prog, 'aData');
  gl.enableVertexAttribArray(aData);
  gl.vertexAttribPointer(aData, 4, gl.FLOAT, false, 0, 0);

  const U = {};
  ['uTime', 'uTravel', 'uAspect', 'uPR', 'uDive', 'uWarp', 'uMouse', 'uOpacity'].forEach(n => U[n] = gl.getUniformLocation(prog, n));

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // aditivo
  gl.clearColor(0, 0, 0, 0);

  // --- estado ---
  const state = { dive: 0, boost: 0, warp: 0, opacity: 1, mx: 0, my: 0 };
  const cur = { dive: 0, warp: 0, opacity: 0, mx: 0, my: 0, speed: 0 };
  let travel = 0;
  let pr = 1;

  function resize() {
    pr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75);
    const w = window.innerWidth, h = window.innerHeight;
    canvas.width = Math.floor(w * pr);
    canvas.height = Math.floor(h * pr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform1f(U.uAspect, w / h);
    gl.uniform1f(U.uPR, pr);
  }
  resize();
  window.addEventListener('resize', resize);

  window.addEventListener('pointermove', e => {
    state.mx = (e.clientX / window.innerWidth - 0.5) * 2;
    state.my = -(e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  let last = performance.now();
  let running = true;
  const t0 = last;

  function frame(now) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const L = 1 - Math.pow(0.001, dt); // lerp independiente de fps

    cur.dive += (state.dive - cur.dive) * L * 0.6;
    cur.warp += (state.warp + state.boost - cur.warp) * L * 0.5;
    cur.opacity += (state.opacity - cur.opacity) * L * 0.4;
    cur.mx += (state.mx - cur.mx) * L * 0.25;
    cur.my += (state.my - cur.my) * L * 0.25;

    const speed = reduced ? 0.15 : 1.1 + cur.dive * 6 + cur.warp * 18;
    travel += dt * speed;

    gl.uniform1f(U.uTime, (now - t0) / 1000);
    gl.uniform1f(U.uTravel, travel);
    gl.uniform1f(U.uDive, cur.dive);
    gl.uniform1f(U.uWarp, Math.min(cur.warp, 1.5));
    gl.uniform2f(U.uMouse, cur.mx, cur.my);
    gl.uniform1f(U.uOpacity, cur.opacity);

    gl.clear(gl.COLOR_BUFFER_BIT);
    if (cur.opacity > 0.01) gl.drawArrays(gl.POINTS, 0, COUNT);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { running = false; }
    else if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
  });

  window.Quantum = {
    set(o) { Object.assign(state, o); },
    get state() { return state; }
  };
})();
