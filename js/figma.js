/* ============================================================
   NEXORA LABZ — FIGMA (figma.js)
   • Futuristic perspective grid-wave hero (Three.js points)
   • Countdown timer to launch
   • "Notify me" form with success animation
   ============================================================ */
'use strict';

(function () {
  const { $, onReady, REDUCED, toast } = window.NX;

  /* ==========================================================
     1. GRID-WAVE HERO — a plane of glowing points, waving
  ========================================================== */
  function initGridWave() {
    const canvas = document.getElementById('fgCanvas');
    if (!canvas || typeof THREE === 'undefined') return;
    if (REDUCED) { canvas.remove(); return; }

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b0f1a, 0.0026);

    const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 800);
    camera.position.set(0, 34, 92);
    camera.lookAt(0, -6, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);

    /* grid of points */
    const COLS = innerWidth < 768 ? 60 : 96;
    const ROWS = innerWidth < 768 ? 36 : 56;
    const SEP = 7.2;
    const count = COLS * ROWS;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const cA = new THREE.Color('#7c6aff');
    const cB = new THREE.Color('#2dd4bf');
    const tmp = new THREE.Color();

    let i = 0;
    for (let x = 0; x < COLS; x++) {
      for (let z = 0; z < ROWS; z++) {
        pos[i * 3] = (x - COLS / 2) * SEP;
        pos[i * 3 + 1] = 0;
        pos[i * 3 + 2] = (z - ROWS / 2) * SEP;
        const t = (x + z) / (COLS + ROWS);
        tmp.copy(cA).lerp(cB, t);
        col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
        i++;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size: 1.7, map: window.NX.dotTexture(THREE), sizeAttenuation: true, vertexColors: true,
      transparent: true, opacity: 0.75, depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const grid = new THREE.Points(geo, mat);
    scene.add(grid);

    /* a few floating frames (design-artboard vibe) */
    const frames = [];
    const frameMat = new THREE.MeshBasicMaterial({
      color: 0x7c6aff, wireframe: true, transparent: true, opacity: 0.4,
    });
    for (let f = 0; f < 6; f++) {
      const frame = new THREE.Mesh(new THREE.PlaneGeometry(14, 20, 3, 3), frameMat);
      frame.position.set(
        (Math.random() - 0.5) * 160,
        16 + Math.random() * 26,
        (Math.random() - 0.5) * 120 - 30
      );
      frame.rotation.set((Math.random() - 0.5) * 0.4, Math.random() * Math.PI, (Math.random() - 0.5) * 0.2);
      frame.userData = {
        rot: (Math.random() - 0.5) * 0.003,
        float: 0.4 + Math.random() * 0.5,
        base: frame.position.y,
        phase: Math.random() * Math.PI * 2,
      };
      frames.push(frame);
      scene.add(frame);
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

      mx += (tx - mx) * 0.05;
      my += (ty - my) * 0.05;

      // wave the grid
      const arr = geo.attributes.position.array;
      for (let p = 0; p < count; p++) {
        const x = arr[p * 3];
        const z = arr[p * 3 + 2];
        arr[p * 3 + 1] =
          Math.sin(x * 0.055 + t * 1.4) * 4.2 +
          Math.cos(z * 0.05 + t * 1.1) * 3.4 +
          Math.sin((x + z) * 0.028 + t * 0.8) * 2.2;
      }
      geo.attributes.position.needsUpdate = true;

      frames.forEach((f) => {
        f.rotation.y += f.userData.rot;
        f.position.y = f.userData.base + Math.sin(t * f.userData.float + f.userData.phase) * 3;
      });

      camera.position.x = mx * 20;
      camera.position.y = 34 + my * -8;
      camera.lookAt(0, -6, 0);

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

  /* ==========================================================
     2. COUNTDOWN — ▶▶ EDIT YOUR LAUNCH DATE HERE ◀▶
     Set an exact date, e.g. '2027-04-01T00:00:00'.
     If left empty (or already past), a date ~150 days from
     today is used automatically so the counter never sits at 00.
  ========================================================== */
  const LAUNCH_DATE = ''; // ← set your real Figma launch date here

  function initCountdown() {
    const dEl = document.getElementById('cdDays');
    const hEl = document.getElementById('cdHours');
    const mEl = document.getElementById('cdMins');
    const sEl = document.getElementById('cdSecs');
    if (!dEl) return;

    let target = LAUNCH_DATE ? new Date(LAUNCH_DATE).getTime() : NaN;
    if (isNaN(target) || target <= Date.now()) {
      target = Date.now() + 150 * 24 * 60 * 60 * 1000; // fallback: ~5 months out
    }

    const pad = (n) => String(n).padStart(2, '0');
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        dEl.textContent = '00'; hEl.textContent = '00';
        mEl.textContent = '00'; sEl.textContent = '00';
        return;
      }
      dEl.textContent = pad(Math.floor(diff / 86400000));
      hEl.textContent = pad(Math.floor(diff / 3600000) % 24);
      mEl.textContent = pad(Math.floor(diff / 60000) % 60);
      sEl.textContent = pad(Math.floor(diff / 1000) % 60);
      setTimeout(tick, 1000);
    };
    tick();
  }

  /* ==========================================================
     3. NOTIFY FORM
     ▶▶ BACKEND HOOK — replace the localStorage block with a
        real fetch() to Formspree / EmailJS / your own API.
  ========================================================== */
  function initNotify() {
    const form = document.querySelector('[data-notify]');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const email = (input.value || '').trim();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        input.classList.add('invalid');
        setTimeout(() => input.classList.remove('invalid'), 500);
        input.focus();
        toast('Please enter a valid email address.', 'warn');
        return;
      }

      // ▶▶ BACKEND HOOK — plug your notify endpoint here:
      // fetch('https://formspree.io/f/[YOUR_FORM_ID]', { method:'POST', body: JSON.stringify({ email }) })
      try { localStorage.setItem('nexora-figma-notify', email); } catch (_) {}

      // success animation
      const ok = document.createElement('div');
      ok.className = 'fg-success';
      ok.innerHTML = '<span class="plane">✈️</span> You\'re on the list — see you at launch!';
      form.replaceWith(ok);
      toast('Notification saved. You\'ll be the first to know! 🔔');
    });
  }

  onReady(() => { initGridWave(); initCountdown(); initNotify(); });
})();
