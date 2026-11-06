/* ============================================================
   NEXORA LABZ — HOME (home.js)
   • Three.js particle-galaxy hero (mouse reactive)
   • 3D coverflow carousel of featured projects
   • Testimonials slider
   • Hero intro timeline (GSAP when available)
   ============================================================ */
'use strict';

(function () {
  const { $, $$, onReady, REDUCED, IS_TOUCH, clamp, lerp } = window.NX;

  /* ==========================================================
     1. THREE.JS HERO — particle galaxy + floating geometry
  ========================================================== */
  function initHeroScene() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas || typeof THREE === 'undefined') return;
    if (REDUCED) { canvas.remove(); return; }

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b0f1a, 0.0011);

    const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 3000);
    camera.position.set(0, 20, 240);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);

    const world = new THREE.Group();
    scene.add(world);

    /* ---- Spiral galaxy particles ---- */
    const isMobile = innerWidth < 768;
    const COUNT = isMobile ? 2600 : 5200;
    const RADIUS = 460;
    const BRANCHES = 4;
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);

    const cIn  = new THREE.Color('#7c6aff'); // electric indigo
    const cMid = new THREE.Color('#5ea2ef'); // soft azure
    const cOut = new THREE.Color('#2dd4bf'); // teal

    for (let i = 0; i < COUNT; i++) {
      const r = Math.random() * RADIUS;
      const branch = ((i % BRANCHES) / BRANCHES) * Math.PI * 2;
      const spread = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1);

      const x = Math.cos(branch + r * 0.012) * r + spread * 46;
      const y = spread * 26 + (Math.random() - 0.5) * 30;
      const z = Math.sin(branch + r * 0.012) * r + spread * 46;

      pos.set([x, y, z], i * 3);

      const t = r / RADIUS;
      const c = t < 0.5 ? cIn.clone().lerp(cMid, t * 2) : cMid.clone().lerp(cOut, (t - 0.5) * 2);
      col.set([c.r, c.g, c.b], i * 3);
    }

    const galaxyGeo = new THREE.BufferGeometry();
    galaxyGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    galaxyGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));

    const galaxyMat = new THREE.PointsMaterial({
      size: isMobile ? 2.6 : 2.0,
      map: window.NX.dotTexture(THREE),
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const galaxy = new THREE.Points(galaxyGeo, galaxyMat);
    galaxy.rotation.x = -0.28;
    world.add(galaxy);

    /* ---- Floating wireframe geometry ---- */
    const shapes = [];
    const geos = [
      new THREE.IcosahedronGeometry(1, 0),
      new THREE.OctahedronGeometry(1, 0),
      new THREE.TetrahedronGeometry(1, 0),
      new THREE.TorusGeometry(1, 0.36, 8, 18),
    ];
    const edgeMat = new THREE.MeshBasicMaterial({
      color: 0x8f7bff, wireframe: true, transparent: true, opacity: 0.35,
    });
    const edgeMat2 = new THREE.MeshBasicMaterial({
      color: 0x2dd4bf, wireframe: true, transparent: true, opacity: 0.30,
    });

    for (let i = 0; i < (isMobile ? 7 : 14); i++) {
      const mesh = new THREE.Mesh(geos[i % geos.length], i % 2 ? edgeMat2 : edgeMat);
      const s = 3 + Math.random() * 9;
      mesh.scale.setScalar(s);
      mesh.position.set(
        (Math.random() - 0.5) * 640,
        (Math.random() - 0.5) * 300,
        (Math.random() - 0.5) * 420
      );
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      mesh.userData = {
        rotX: (Math.random() - 0.5) * 0.004,
        rotY: (Math.random() - 0.5) * 0.006,
        floatSpeed: 0.4 + Math.random() * 0.7,
        floatAmp: 4 + Math.random() * 10,
        baseY: mesh.position.y,
        phase: Math.random() * Math.PI * 2,
      };
      shapes.push(mesh);
      world.add(mesh);
    }

    /* ---- Mouse interaction ---- */
    let mx = 0, my = 0, tx = 0, ty = 0;
    if (!IS_TOUCH) {
      window.addEventListener('mousemove', (e) => {
        tx = (e.clientX / innerWidth - 0.5) * 2;
        ty = (e.clientY / innerHeight - 0.5) * 2;
      }, { passive: true });
    }

    /* ---- Scroll: galaxy gently sinks ---- */
    let scrollSink = 0;
    window.addEventListener('scroll', () => {
      scrollSink = Math.min(window.scrollY / innerHeight, 1) * 60;
    }, { passive: true });

    /* ---- Render loop (paused when tab hidden) ---- */
    const clock = new THREE.Clock();
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

    function frame() {
      requestAnimationFrame(frame);
      if (!visible || !inView) return;

      const t = clock.getElapsedTime();

      mx = lerp(mx, tx, 0.045);
      my = lerp(my, ty, 0.045);

      galaxy.rotation.y = t * 0.035 + mx * 0.25;
      world.rotation.x = my * 0.10;
      camera.position.y = 20 + my * -14 + scrollSink * 0.6;
      camera.position.x = mx * 22;
      camera.lookAt(0, scrollSink * 0.4, 0);

      shapes.forEach((m) => {
        m.rotation.x += m.userData.rotX;
        m.rotation.y += m.userData.rotY;
        m.position.y = m.userData.baseY + Math.sin(t * m.userData.floatSpeed + m.userData.phase) * m.userData.floatAmp;
      });

      renderer.render(scene, camera);
    }
    frame();

    /* ---- Resize ---- */
    let rT;
    window.addEventListener('resize', () => {
      clearTimeout(rT);
      rT = setTimeout(() => {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight);
      }, 120);
    });
  }

  /* ==========================================================
     2. FEATURED WORK — 3D CAROUSEL
     Real photo covers (local /assets/images/projects) over the art-N gradient fallback → live demo links
  ========================================================== */
  const PROJECTS = [
    { title: 'Veloura Store',     cat: 'Fashion E-commerce',  href: 'projects/project-4/index.html', art: 'art-4', img: 'assets/images/projects/veloura-800.webp', width: 800, height: 600, url: 'veloura.demo' },
    { title: 'Flowbit SaaS',      cat: 'Tech Startup',        href: 'projects/project-6/index.html', art: 'art-6', img: 'assets/images/projects/flowbit-800.webp', width: 800, height: 600, url: 'flowbit.demo' },
    { title: 'Haven Estates',     cat: 'Real Estate',         href: 'projects/project-3/index.html', art: 'art-3', img: 'assets/images/projects/haven-800.webp', width: 800, height: 600, url: 'havenestates.demo' },
    { title: 'Saffron & Smoke',   cat: 'Restaurant & Cafe',   href: 'projects/project-1/index.html', art: 'art-1', img: 'assets/images/projects/saffron-800.webp', width: 800, height: 600, url: 'saffronandsmoke.demo' },
    { title: 'IronPulse Gym',     cat: 'Fitness Landing',     href: 'projects/project-2/index.html', art: 'art-2', img: 'assets/images/projects/ironpulse-800.webp', width: 800, height: 600, url: 'ironpulse.demo' },
    { title: 'Wanderlust Trails', cat: 'Travel & Tourism',    href: 'projects/project-5/index.html', art: 'art-5', img: 'assets/images/projects/wanderlust-800.webp', width: 800, height: 600, url: 'wanderlusttrails.demo' },
  ];

  function initCarousel() {
    const stage = document.getElementById('workCarousel');
    if (!stage) return;

    const n = PROJECTS.length;
    const slides = PROJECTS.map((p, i) => {
      const el = document.createElement('article');
      el.className = `car-slide ${p.art}`;
      el.innerHTML = `
        <a href="${p.href}" aria-label="Open live demo: ${p.title}">
          <div class="car-chrome" aria-hidden="true"><i></i><i></i><i></i><span class="url">${p.url}</span></div>
          <div class="car-art"><span class="grid-lines" aria-hidden="true"></span><img class="car-photo" src="${p.img}" alt="" width="${p.width}" height="${p.height}" loading="lazy" decoding="async" onerror="this.remove()"></div>
          <div class="car-info">
            <h3>${p.title}</h3>
            <p>${p.cat}</p>
            <span class="cta-line">Live demo
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>
            </span>
          </div>
        </a>`;
      stage.appendChild(el);
      return el;
    });

    let rot = 0;          // stage rotation (radians)
    let target = 0;
    let autoTimer = null;
    let dragging = false;
    let lastX = 0;
    let velocity = 0;

    const radiusFor = () => clamp(innerWidth * 0.24, 210, 340) * (n / 6) + 130;

    function layout() {
      const radius = radiusFor();
      slides.forEach((el, i) => {
        const a = (i / n) * Math.PI * 2 + rot;
        const x = Math.sin(a) * radius;
        const z = Math.cos(a) * radius;
        // normalize rotation to 0..2π for front detection
        const norm = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const front = norm < 0.4 || norm > Math.PI * 2 - 0.4;
        el.style.transform =
          `translate(-50%, -50%) translate3d(${x}px, 0, ${z}px) scale(${0.62 + 0.38 * ((z + radius) / (radius * 2))})`;
        el.style.zIndex = Math.round((z + radius) * 10);
        el.style.opacity = z < -radius * 0.35 ? 0.25 : 1;
        el.style.filter = z < 0 ? `blur(${Math.min(2.5, -z / radius * 2.5)}px)` : 'none';
        el.style.pointerEvents = front ? 'auto' : 'none';
        el.classList.toggle('front', front);
      });
    }

    function render() {
      rot = lerp(rot, target, 0.08);
      layout();
      requestAnimationFrame(render);
    }
    render();

    const step = (dir) => { target += (dir * Math.PI * 2) / n; bump(); };

    function bump() {
      // restart auto-rotate timer
      if (autoTimer) clearInterval(autoTimer);
      autoTimer = setInterval(() => {
        if (!document.hidden && !dragging) target += (Math.PI * 2) / n;
      }, 4200);
    }

    document.getElementById('carPrev')?.addEventListener('click', () => step(-1));
    document.getElementById('carNext')?.addEventListener('click', () => step(1));

    stage.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { step(-1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { step(1); e.preventDefault(); }
    });

    // Drag to rotate
    stage.addEventListener('pointerdown', (e) => {
      dragging = true; lastX = e.clientX; velocity = 0;
      stage.setPointerCapture?.(e.pointerId);
    });
    window.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      velocity = dx * 0.005;
      rot += velocity;
      target = rot; // follow the finger
    });
    window.addEventListener('pointerup', () => {
      if (!dragging) return;
      dragging = false;
      // momentum + snap to nearest slide
      target = rot + velocity * 6;
      const snap = (Math.PI * 2) / n;
      target = Math.round(target / snap) * snap;
    });

    // Click a back slide → bring to front (link works only on front slide)
    slides.forEach((el) => {
      el.addEventListener('click', (e) => {
        if (!el.classList.contains('front')) {
          e.preventDefault();
        }
      });
    });

    bump();
  }

  /* ==========================================================
     3. TESTIMONIALS SLIDER
  ========================================================== */
  function initTestimonials() {
    const track = document.getElementById('tTrack');
    const nav = document.getElementById('tNav');
    if (!track || !nav) return;

    const slides = $$('.t-slide', track);
    let idx = 0;
    let timer = null;

    slides.forEach((_, i) => {
      const b = document.createElement('button');
      b.setAttribute('aria-label', `Show testimonial ${i + 1}`);
      if (i === 0) b.classList.add('active');
      b.addEventListener('click', () => { go(i); restart(); });
      nav.appendChild(b);
    });

    function go(i) {
      idx = (i + slides.length) % slides.length;
      track.style.transform = `translateX(-${idx * 100}%)`;
      $$('button', nav).forEach((b, j) => b.classList.toggle('active', j === idx));
    }
    function restart() {
      clearInterval(timer);
      timer = setInterval(() => go(idx + 1), 5500);
    }

    const slider = track.closest('.t-slider');
    slider?.addEventListener('mouseenter', () => clearInterval(timer));
    slider?.addEventListener('mouseleave', restart);

    if (!REDUCED) restart();
  }

  /* ==========================================================
     4. HERO INTRO TIMELINE (GSAP when available)
  ========================================================== */
  function heroIntro() {
    if (REDUCED || typeof gsap === 'undefined') return;
    const items = $$('[data-hero-item]');
    if (!items.length) return;
    gsap.from(items, {
      y: 46,
      opacity: 0,
      duration: 1.1,
      ease: 'power3.out',
      stagger: 0.09,
      delay: 0.15,
      clearProps: 'all',
    });
  }

  /* ==========================================================
     BOOT (after preloader finishes for smooth intro)
     ▶▶ PERF FIX: the intro must run exactly ONCE. Previously the
        'nexora:loaded' event AND an uncancelled setTimeout(2200)
        fallback both called heroIntro(), so the whole hero —
        including the profile photo — faded in, then re-animated
        ~0.8s later. That was the "photo loads twice" glitch.
  ========================================================== */
  onReady(() => {
    initHeroScene();
    initCarousel();
    initTestimonials();

    let introStarted = false;
    let fallbackTimer = null;
    const start = () => {
      if (introStarted) return;   // one-time guard — never re-animate
      introStarted = true;
      if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
      heroIntro();
    };

    if (document.querySelector('.preloader')) {
      document.addEventListener('nexora:loaded', start, { once: true });
      fallbackTimer = setTimeout(start, 2200); // fallback only if event missed
    } else {
      start();
    }
  });
})();
