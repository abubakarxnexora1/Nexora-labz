/* ============================================================
   NEXORA LABZ — SERVICES (services.js)
   • Three.js wireframe torus-knot + floating shapes hero
   • Process line draw on scroll
   ============================================================ */
'use strict';

(function () {
  const { $, onReady, REDUCED, lerp } = window.NX;

  /* ----------------------------------------------------------
     1. HERO SCENE — torus knot + orbiting wireframes
  ---------------------------------------------------------- */
  function initServicesHero() {
    const canvas = document.getElementById('svCanvas');
    if (!canvas || typeof THREE === 'undefined') return;
    if (REDUCED) { canvas.remove(); return; }

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b0f1a, 0.0016);

    const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 130);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);

    const world = new THREE.Group();
    scene.add(world);

    /* hero object: big wireframe torus knot */
    const knot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(26, 7.5, 160, 24),
      new THREE.MeshBasicMaterial({ color: 0x7c6aff, wireframe: true, transparent: true, opacity: 0.32 })
    );
    world.add(knot);

    /* inner solid knot for depth */
    const knotCore = new THREE.Mesh(
      new THREE.TorusKnotGeometry(26, 7.5, 100, 16),
      new THREE.MeshBasicMaterial({ color: 0x2dd4bf, wireframe: true, transparent: true, opacity: 0.12 })
    );
    knotCore.scale.setScalar(0.6);
    world.add(knotCore);

    /* small satellites */
    const sats = [];
    const satGeo = [
      new THREE.IcosahedronGeometry(4.2, 0),
      new THREE.OctahedronGeometry(4.2, 0),
      new THREE.TetrahedronGeometry(4.6, 0),
    ];
    const satMats = [
      new THREE.MeshBasicMaterial({ color: 0x7c6aff, wireframe: true, transparent: true, opacity: 0.5 }),
      new THREE.MeshBasicMaterial({ color: 0x2dd4bf, wireframe: true, transparent: true, opacity: 0.5 }),
    ];
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(satGeo[i % satGeo.length], satMats[i % 2]);
      m.userData = {
        r: 55 + Math.random() * 45,
        speed: 0.15 + Math.random() * 0.3,
        phase: (i / 10) * Math.PI * 2,
        tilt: (Math.random() - 0.5) * 0.8,
        rotX: (Math.random() - 0.5) * 0.02,
        rotY: (Math.random() - 0.5) * 0.02,
      };
      sats.push(m);
      world.add(m);
    }

    let mx = 0, my = 0, tx = 0, ty = 0;
    window.addEventListener('mousemove', (e) => {
      tx = (e.clientX / innerWidth - 0.5) * 2;
      ty = (e.clientY / innerHeight - 0.5) * 2;
    }, { passive: true });

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
      const t = clock.getElapsedTime();

      mx = lerp(mx, tx, 0.05);
      my = lerp(my, ty, 0.05);

      knot.rotation.x = t * 0.16 + my * 0.25;
      knot.rotation.y = t * 0.2 + mx * 0.3;
      knotCore.rotation.x = -t * 0.22;
      knotCore.rotation.y = -t * 0.3;

      sats.forEach((m) => {
        const a = t * m.userData.speed + m.userData.phase;
        m.position.set(
          Math.cos(a) * m.userData.r,
          Math.sin(a * 1.3) * m.userData.r * m.userData.tilt,
          Math.sin(a) * m.userData.r * 0.5
        );
        m.rotation.x += m.userData.rotX;
        m.rotation.y += m.userData.rotY;
      });

      camera.position.x = mx * 14;
      camera.position.y = -my * 10;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    })();

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

  /* ----------------------------------------------------------
     2. PROCESS LINE DRAW
  ---------------------------------------------------------- */
  function initProcessLine() {
    const proc = document.getElementById('process');
    if (!proc) return;
    if (!('IntersectionObserver' in window)) { proc.classList.add('drawn'); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { proc.classList.add('drawn'); io.disconnect(); }
      });
    }, { threshold: 0.25 });
    io.observe(proc);
  }

  onReady(() => { initServicesHero(); initProcessLine(); });
})();
