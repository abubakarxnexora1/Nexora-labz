/* ============================================================
   NEXORA LABZ — ABOUT (about.js)
   • GLSL gradient-mesh hero (Three.js shader plane)
   • Timeline line draw on scroll
   • Skill bars fill on scroll
   ============================================================ */
'use strict';

(function () {
  const { $, $$, onReady, REDUCED } = window.NX;

  /* ----------------------------------------------------------
     1. GRADIENT MESH HERO — animated shader plane
  ---------------------------------------------------------- */
  function initMeshHero() {
    const canvas = document.getElementById('meshCanvas');
    if (!canvas || typeof THREE === 'undefined') return;
    if (REDUCED) { canvas.remove(); return; }

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      u_time:  { value: 0 },
      u_res:   { value: new THREE.Vector2(innerWidth, innerHeight) },
      u_dark:  { value: document.documentElement.getAttribute('data-theme') !== 'light' ? 1 : 0 },
      u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
    };

    const mat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }`,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform float u_time;
        uniform vec2  u_res;
        uniform vec2  u_mouse;
        uniform float u_dark;

        // palette — Nexora accents
        const vec3 A = vec3(0.486, 0.416, 1.0);   // electric indigo
        const vec3 B = vec3(0.176, 0.831, 0.749); // teal
        const vec3 C = vec3(0.369, 0.635, 0.937); // soft azure

        float blob(vec2 uv, vec2 c, float r) {
          return smoothstep(r, 0.0, distance(uv, c));
        }

        void main() {
          vec2 uv = vUv;
          float t = u_time * 0.12;

          // drifting blob centers (also nudged by the mouse)
          vec2 m = (u_mouse - 0.5) * 0.18;
          vec2 c1 = vec2(0.30 + 0.10 * sin(t * 1.1) + m.x, 0.68 + 0.08 * cos(t * 0.9) + m.y);
          vec2 c2 = vec2(0.78 + 0.09 * cos(t * 0.8) - m.x, 0.30 + 0.10 * sin(t * 1.3) - m.y);
          vec2 c3 = vec2(0.55 + 0.12 * sin(t * 0.7), 0.85 + 0.06 * cos(t * 1.2));

          float b1 = blob(uv, c1, 0.55);
          float b2 = blob(uv, c2, 0.50);
          float b3 = blob(uv, c3, 0.42);

          vec3 base = u_dark > 0.5 ? vec3(0.043, 0.059, 0.102) : vec3(0.953, 0.961, 0.984);
          vec3 col = base;
          col = mix(col, A * (u_dark > 0.5 ? 0.55 : 0.45), b1 * 0.9);
          col = mix(col, B * (u_dark > 0.5 ? 0.45 : 0.40), b2 * 0.8);
          col = mix(col, C * (u_dark > 0.5 ? 0.40 : 0.35), b3 * 0.7);

          // soft vignette so text stays readable
          float vig = smoothstep(1.25, 0.35, distance(uv, vec2(0.5)));
          col = mix(base, col, vig);

          gl_FragColor = vec4(col, 1.0);
        }`,
    });

    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

    const resize = () => {
      renderer.setSize(innerWidth, innerHeight);
      uniforms.u_res.value.set(innerWidth, innerHeight);
    };
    resize();
    let rT; window.addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(resize, 150); });

    window.addEventListener('mousemove', (e) => {
      uniforms.u_mouse.value.set(e.clientX / innerWidth, 1 - e.clientY / innerHeight);
    }, { passive: true });

    // theme sync
    new MutationObserver(() => {
      uniforms.u_dark.value =
        document.documentElement.getAttribute('data-theme') !== 'light' ? 1 : 0;
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    let visible = true;
    let inView = true;
    document.addEventListener('visibilitychange', () => { visible = !document.hidden; });
    /* Perf: stop rendering entirely when the hero is scrolled out
       of view — the WebGL loop no longer burns GPU while you read
       further down the page. */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((en) => { inView = en[0].isIntersecting; }, { threshold: 0.02 })
        .observe(canvas);
    }

    const clock = new THREE.Clock();
    (function loop() {
      requestAnimationFrame(loop);
      if (!visible || !inView) return;
      uniforms.u_time.value = clock.getElapsedTime();
      renderer.render(scene, camera);
    })();
  }

  /* ----------------------------------------------------------
     2. TIMELINE — draw the line when it enters view
  ---------------------------------------------------------- */
  function initTimeline() {
    const tl = document.getElementById('timeline');
    if (!tl || !('IntersectionObserver' in window)) {
      tl?.classList.add('drawn');
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { tl.classList.add('drawn'); io.disconnect(); }
      });
    }, { threshold: 0.15 });
    io.observe(tl);
  }

  /* ----------------------------------------------------------
     3. SKILL BARS — fill on scroll
  ---------------------------------------------------------- */
  function initSkillBars() {
    const skills = $$('.skill');
    if (!skills.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        el.style.setProperty('--level', el.dataset.level + '%');
        el.classList.add('filled');
        io.unobserve(el);
      });
    }, { threshold: 0.4 });
    skills.forEach((s) => io.observe(s));
  }

  onReady(() => { initMeshHero(); initTimeline(); initSkillBars(); });
})();
