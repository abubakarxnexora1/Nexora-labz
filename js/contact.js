/* ============================================================
   NEXORA LABZ — CONTACT (contact.js)
   • Three.js 3D globe (wireframe + points) with floating orbs
   • Contact form validation + loading state + success animation
   ============================================================ */
'use strict';

(function () {
  const { $, $$, onReady, REDUCED, toast } = window.NX;

  /* ----------------------------------------------------------
     1. GLOBE HERO — dotted 3D sphere + orbiting orbs
  ---------------------------------------------------------- */
  function initGlobe() {
    const canvas = document.getElementById('ctCanvas');
    if (!canvas || typeof THREE === 'undefined') return;
    if (REDUCED) { canvas.remove(); return; }

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b0f1a, 0.002);

    const camera = new THREE.PerspectiveCamera(56, innerWidth / innerHeight, 0.1, 900);
    camera.position.set(0, 6, 190);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);

    const world = new THREE.Group();
    world.position.x = 60; // shift globe right on desktop
    scene.add(world);

    /* globe: dots distributed on a sphere (fibonacci) */
    const N = 1400;
    const R = 70;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const cA = new THREE.Color('#7c6aff');
    const cB = new THREE.Color('#2dd4bf');
    const golden = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const rad = Math.sqrt(1 - y * y);
      const th = golden * i;
      pos.set([Math.cos(th) * rad * R, y * R, Math.sin(th) * rad * R], i * 3);
      const t = (y + 1) / 2;
      const c = cA.clone().lerp(cB, t);
      col.set([c.r, c.g, c.b], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const globe = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 2.2, map: window.NX.dotTexture(THREE), sizeAttenuation: true, vertexColors: true,
      transparent: true, opacity: 0.85, depthWrite: false,
      blending: THREE.AdditiveBlending,
    }));
    world.add(globe);

    /* wire sphere underneath for structure */
    const wire = new THREE.Mesh(
      new THREE.SphereGeometry(R * 0.985, 26, 18),
      new THREE.MeshBasicMaterial({ color: 0x7c6aff, wireframe: true, transparent: true, opacity: 0.07 })
    );
    world.add(wire);

    /* orbit rings */
    [1.25, 1.45].forEach((k, idx) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(R * k, 0.22, 8, 120),
        new THREE.MeshBasicMaterial({
          color: idx ? 0x2dd4bf : 0x7c6aff,
          transparent: true, opacity: 0.25,
        })
      );
      ring.rotation.x = Math.PI / 2 + (idx ? -0.35 : 0.25);
      ring.rotation.y = idx ? 0.3 : -0.2;
      world.add(ring);
    });

    /* orbiting orbs (little message pods) */
    const orbs = [];
    const orbMat = new THREE.MeshBasicMaterial({ color: 0x2dd4bf, wireframe: true, transparent: true, opacity: 0.55 });
    const orbMat2 = new THREE.MeshBasicMaterial({ color: 0x7c6aff, wireframe: true, transparent: true, opacity: 0.55 });
    for (let i = 0; i < 5; i++) {
      const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(2.6 + Math.random() * 2.4, 0), i % 2 ? orbMat : orbMat2);
      orb.userData = {
        r: R * (1.2 + Math.random() * 0.5),
        speed: 0.25 + Math.random() * 0.4,
        phase: (i / 5) * Math.PI * 2,
        tilt: (Math.random() - 0.5) * 1.2,
      };
      orbs.push(orb);
      world.add(orb);
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

      globe.rotation.y = t * 0.12 + mx * 0.4;
      wire.rotation.y = globe.rotation.y;

      orbs.forEach((o) => {
        const a = t * o.userData.speed + o.userData.phase;
        o.position.set(
          Math.cos(a) * o.userData.r,
          Math.sin(a * 0.9) * o.userData.r * o.userData.tilt * 0.4,
          Math.sin(a) * o.userData.r
        );
        o.rotation.x = t * 0.5;
        o.rotation.y = t * 0.7;
      });

      world.rotation.x = my * 0.14;
      camera.position.x = mx * 10;
      camera.lookAt(world.position.x * 0.5, 0, 0);

      renderer.render(scene, camera);
    })();

    /* keep globe on the right on desktop, centered on mobile */
    const placeGlobe = () => { world.position.x = innerWidth > 960 ? 60 : 0; };
    placeGlobe();
    let rT;
    window.addEventListener('resize', () => {
      clearTimeout(rT);
      rT = setTimeout(() => {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight);
        placeGlobe();
      }, 120);
    });
  }

  /* ----------------------------------------------------------
     2. CONTACT FORM — validation + fake send + success panel
     ▶▶ BACKEND HOOK — see the marked block inside submit().
  ---------------------------------------------------------- */
  function initForm() {
    const form = document.getElementById('contactForm');
    const success = document.getElementById('formSuccess');
    if (!form || !success) return;

    const fields = {
      name: {
        el: $('#fName'),
        validate: (v) => v.trim().length >= 2 || 'Please enter your name (2+ characters).',
      },
      email: {
        el: $('#fEmail'),
        validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Please enter a valid email address.',
      },
      subject: {
        el: $('#fSubject'),
        validate: (v) => v.trim().length >= 3 || 'Please add a short subject.',
      },
      message: {
        el: $('#fMessage'),
        validate: (v) => v.trim().length >= 10 || 'Tell me a bit more — at least 10 characters.',
      },
    };

    const setError = (input, msg) => {
      const field = input.closest('.field');
      field.classList.toggle('invalid', !!msg);
      field.querySelector('.error-msg').textContent = msg || '';
    };

    // live re-validate on blur/input
    Object.values(fields).forEach(({ el, validate }) => {
      el.addEventListener('blur', () => {
        const res = validate(el.value);
        setError(el, res === true ? '' : res);
      });
      el.addEventListener('input', () => {
        if (el.closest('.field').classList.contains('invalid')) {
          const res = validate(el.value);
          setError(el, res === true ? '' : res);
        }
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let ok = true;
      let firstBad = null;

      Object.values(fields).forEach(({ el, validate }) => {
        const res = validate(el.value);
        if (res !== true) { ok = false; setError(el, res); firstBad = firstBad || el; }
        else setError(el, '');
      });

      if (!ok) {
        firstBad?.focus();
        toast('Please fix the highlighted fields.', 'warn');
        return;
      }

      /* ---------- ▶▶ BACKEND HOOK ◀▶
         Replace the simulated timeout below with a real request, e.g.:
            fetch('https://formspree.io/f/[YOUR_FORM_ID]', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
              body: JSON.stringify({
                name: fields.name.el.value,
                email: fields.email.el.value,
                subject: fields.subject.el.value,
                message: fields.message.el.value,
              }),
            })
      -------------------------------------- */
      const btn = form.querySelector('.btn-submit');
      btn.classList.add('loading');
      btn.disabled = true;

      setTimeout(() => {
        btn.classList.remove('loading');
        btn.disabled = false;
        form.hidden = true;
        success.hidden = false;
        toast('Message sent successfully! 🚀');
      }, 1400);
    });

    document.getElementById('formReset')?.addEventListener('click', () => {
      form.reset();
      success.hidden = true;
      form.hidden = false;
      fields.name.el.focus();
    });
  }

  onReady(() => { initGlobe(); initForm(); });
})();
