/* ============================================================
   NEXORA LABZ — PROJECTS (projects.js)
   • Cinematic starfield hero (flying particles, letterbox)
   • Category filtering with count + empty state
   ============================================================ */
'use strict';

(function () {
  const { $, $$, onReady, REDUCED } = window.NX;

  /* ----------------------------------------------------------
     1. CINEMATIC STARFIELD HERO
  ---------------------------------------------------------- */
  function initCinemaHero() {
    const canvas = document.getElementById('pjCanvas');
    if (!canvas || typeof THREE === 'undefined') return;
    if (REDUCED) { canvas.remove(); return; }

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b0f1a, 0.0022);

    const camera = new THREE.PerspectiveCamera(64, innerWidth / innerHeight, 0.1, 2000);
    camera.position.z = 90;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);

    /* flying stars — travel toward camera */
    const COUNT = innerWidth < 768 ? 1800 : 3600;
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);
    const cA = new THREE.Color('#7c6aff');
    const cB = new THREE.Color('#2dd4bf');
    const cW = new THREE.Color('#e9edf5');

    for (let i = 0; i < COUNT; i++) {
      pos.set([
        (Math.random() - 0.5) * 500,
        (Math.random() - 0.5) * 300,
        -Math.random() * 900,
      ], i * 3);
      const r = Math.random();
      const c = r < 0.5 ? cW : (r < 0.78 ? cA : cB);
      col.set([c.r, c.g, c.b], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size: 1.9, map: window.NX.dotTexture(THREE), sizeAttenuation: true, vertexColors: true,
      transparent: true, opacity: 0.9, depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const stars = new THREE.Points(geo, mat);
    scene.add(stars);

    /* light streaks — thin glowing bars (cinematic anamorphic feel) */
    const streaks = [];
    const streakMat = new THREE.MeshBasicMaterial({
      color: 0x7c6aff, transparent: true, opacity: 0.28,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const streakMat2 = new THREE.MeshBasicMaterial({
      color: 0x2dd4bf, transparent: true, opacity: 0.22,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    for (let i = 0; i < 8; i++) {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(120 + Math.random() * 220, 0.5 + Math.random()), i % 2 ? streakMat2 : streakMat);
      s.position.set((Math.random() - 0.5) * 300, (Math.random() - 0.5) * 160, -Math.random() * 500);
      s.rotation.z = (Math.random() - 0.5) * 0.4;
      s.userData.speed = 14 + Math.random() * 26;
      streaks.push(s);
      scene.add(s);
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

    (function loop() {
      requestAnimationFrame(loop);
      if (!visible || !inView) return;

      mx += (tx - mx) * 0.05;
      my += (ty - my) * 0.05;

      // star travel
      const arr = geo.attributes.position.array;
      for (let i = 2; i < arr.length; i += 3) {
        arr[i] += 2.2;
        if (arr[i] > 60) arr[i] = -900;
      }
      geo.attributes.position.needsUpdate = true;

      streaks.forEach((s) => {
        s.position.z += s.userData.speed * 0.016;
        if (s.position.z > 40) s.position.z = -600;
      });

      camera.position.x = mx * 16;
      camera.position.y = -my * 10;
      camera.lookAt(0, 0, -200);

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
     2. CATEGORY FILTERING — animated: quick fade-out, then a
        staggered pop-in (IntersectionObserver scroll-reveal from
        main.css keeps handling the initial entrance)
  ---------------------------------------------------------- */
  function initFilters() {
    const buttons = $$('.filter');
    const cards = $$('.pj-card');            // grid cards only (featured card excluded)
    const countEl = document.getElementById('filterCount');
    const emptyEl = document.getElementById('pjEmpty');
    if (!buttons.length || !cards.length) return;

    const STAGGER = 60;                      // ms between card pop-ins

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const f = btn.dataset.filter;
        buttons.forEach((b) => {
          const active = b === btn;
          b.classList.toggle('active', active);
          b.setAttribute('aria-selected', String(active));
        });

        let shown = 0;
        cards.forEach((card) => {
          const match = f === 'all' || card.dataset.cat === f;

          /* cancel any pending hide timer from a previous filter click */
          clearTimeout(card._hideT);
          cancelAnimationFrame(card._filterRaf);

          if (match) {
            card.classList.remove('hide');
            /* if the card was still waiting for its scroll-reveal,
               mark it revealed so it doesn't pop back to opacity 0 */
            card.classList.add('revealed');
            /* staggered pop-in */
            card.classList.remove('fade-out', 'filter-in');
            card.style.setProperty('--stagger', `${shown * STAGGER}ms`);
            card._filterRaf = requestAnimationFrame(() => {
              card._filterRaf = requestAnimationFrame(() => {
                card._filterRaf = null;
                if (!card.classList.contains('fade-out')) card.classList.add('filter-in');
              });
            });
            card.addEventListener('animationend', () => {
              card.classList.remove('filter-in');
              card.style.removeProperty('--stagger');
            }, { once: true });
            shown++;
          } else {
            card.classList.add('fade-out');
            card._hideT = setTimeout(() => {
              if (card.classList.contains('fade-out')) card.classList.add('hide');
            }, 300);
          }
        });

        if (countEl) countEl.textContent = `Showing ${shown} of ${cards.length}`;
        if (emptyEl) emptyEl.hidden = shown !== 0;
      });
    });
  }

  onReady(() => { initCinemaHero(); initFilters(); });
})();
