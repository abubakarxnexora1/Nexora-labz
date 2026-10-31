/* ============================================================
   NEXORA LABZ — Shared Engine (main.js)
   Vanilla ES6+. No dependencies required; gracefully uses
   GSAP / ScrollTrigger when available (loaded via CDN).
   Scrolling is NATIVE (html { scroll-behavior: smooth } for
   anchors) — no scroll-hijacking libraries, so it stays smooth.
   ============================================================
   MODULES
   01. Helpers
   02. Theme (light/dark) with localStorage
   03. Preloader
   04. Custom cursor
   05. Scroll progress bar
   06. Navbar (scroll state + active link + mobile menu)
   07. Page transitions (curtain)
   08. Reveal on scroll (IntersectionObserver)
   09. Stat counters
   10. Magnetic buttons
   11. 3D tilt cards
   12. Parallax elements
   13. Back-to-top
   14. Marquee builder
   15. Hero video slot handler
   16. Newsletter forms
   17. Toast system
   ============================================================ */
'use strict';

/* ------------------------------------------------------------
   01. HELPERS
------------------------------------------------------------ */
const NX = window.NX || {};
window.NX = NX;

NX.$  = (sel, ctx = document) => ctx.querySelector(sel);
NX.$$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

NX.REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
NX.IS_TOUCH = window.matchMedia('(pointer: coarse)').matches;

NX.clamp = (v, min, max) => Math.min(max, Math.max(min, v));
NX.lerp = (a, b, t) => a + (b - a) * t;
NX.rand = (min, max) => min + Math.random() * (max - min);

/* Soft circular sprite for THREE.Points (squares look cheap) */
NX.dotTexture = (THREE) => {
  if (NX._dotTex) return NX._dotTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.45, 'rgba(255,255,255,.85)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  NX._dotTex = new THREE.CanvasTexture(c);
  return NX._dotTex;
};

NX.onReady = (fn) => {
  if (document.readyState !== 'loading') fn();
  else document.addEventListener('DOMContentLoaded', fn);
};

/* ------------------------------------------------------------
   01b. SCROLL BUS — ONE rAF-throttled scroll listener for the
   whole site. Every scroll-driven feature subscribes here
   instead of adding its own window listener, so scrolling
   triggers a single handler per frame (performance).
------------------------------------------------------------ */
NX.scrollBus = {
  subs: [],
  ticking: false,
  init() {
    window.addEventListener('scroll', () => {
      if (this.ticking) return;
      this.ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        for (let i = 0; i < this.subs.length; i++) this.subs[i](y);
        this.ticking = false;
      });
    }, { passive: true });
  },
  add(fn) { this.subs.push(fn); },
};

/* ------------------------------------------------------------
   02. THEME
------------------------------------------------------------ */
NX.theme = {
  init() {
    // Dark-only site — the light/dark toggle has been removed.
    // Always enforce the signature dark look and clear any stale saved choice.
    try { localStorage.removeItem('nexora-theme'); } catch (err) { /* storage unavailable */ }
    document.documentElement.setAttribute('data-theme', 'dark');
  },
};

/* ------------------------------------------------------------
   03. PRELOADER
------------------------------------------------------------ */
NX.preloader = {
  init() {
    const el = NX.$('.preloader');
    if (!el) return;
    const bar = NX.$('.preloader-bar i', el);
    const count = NX.$('.preloader-count', el);
    const start = performance.now();
    const MIN_SHOW = NX.REDUCED ? 200 : 1400;

    const tick = (now) => {
      const t = NX.clamp((now - start) / MIN_SHOW, 0, 1);
      const pct = Math.round(t * 100);
      if (bar) bar.style.width = pct + '%';
      if (count) count.textContent = String(pct).padStart(3, '0') + '%';
      if (t < 1) requestAnimationFrame(tick);
      else this.finish(el);
    };
    requestAnimationFrame(tick);

    // Hard fallback: never trap the user behind the preloader
    setTimeout(() => this.finish(el), 4000);
  },
  finish(el) {
    if (!el || el.classList.contains('done')) return;
    el.classList.add('done');
    document.body.classList.add('page-enter');
    document.dispatchEvent(new CustomEvent('nexora:loaded'));
  },
};

/* ------------------------------------------------------------
   04. CUSTOM CURSOR (fine pointers only)
------------------------------------------------------------ */
NX.cursor = {
  init() {
    if (NX.IS_TOUCH || NX.REDUCED) return;
    const dot = NX.$('.cursor-dot');
    const ring = NX.$('.cursor-ring');
    if (!dot || !ring) return;

    document.body.classList.add('custom-cursor');
    let mx = innerWidth / 2, my = innerHeight / 2;
    let rx = mx, ry = my;

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
      dot.classList.add('visible');
      ring.classList.add('visible');
    }, { passive: true });

    const loop = () => {
      rx = NX.lerp(rx, mx, 0.16);
      ry = NX.lerp(ry, my, 0.16);
      /* Perf: only write the style when the ring actually moved —
         avoids touching the DOM on every frame while idle. */
      if (Math.abs(rx - lx) > 0.1 || Math.abs(ry - ly) > 0.1) {
        lx = rx; ly = ry;
        ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
      }
      requestAnimationFrame(loop);
    };
    let lx = -1, ly = -1;
    loop();

    // Grow ring over interactive elements
    const hoverSel = 'a, button, [role="button"], input, textarea, select, label, [data-cursor="hover"]';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverSel)) ring.classList.add('hovered');
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverSel)) ring.classList.remove('hovered');
    });
    document.addEventListener('mouseleave', () => {
      dot.classList.remove('visible'); ring.classList.remove('visible');
    });
  },
};

/* ------------------------------------------------------------
   05. SCROLL PROGRESS
------------------------------------------------------------ */
NX.progress = {
  init() {
    const bar = NX.$('.scroll-progress i');
    if (!bar) return;
    const update = (y) => {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    };
    NX.scrollBus.add(update);
    update(window.scrollY);
  },
};

/* ------------------------------------------------------------
   06. NAVBAR
------------------------------------------------------------ */
NX.nav = {
  lastY: 0,
  init() {
    const navbar = NX.$('.navbar');
    if (!navbar) return;

    const onScroll = (y) => {
      navbar.classList.toggle('scrolled', y > 30);
      // hide on scroll down, show on scroll up (only past hero)
      if (y > 500 && y > this.lastY + 6) navbar.classList.add('hidden');
      else if (y < this.lastY - 6 || y < 120) navbar.classList.remove('hidden');
      this.lastY = y;
    };
    NX.scrollBus.add(onScroll.bind(this));
    onScroll.call(this, window.scrollY);

    // Active link highlighting from <body data-page="home">
    const page = document.body.dataset.page;
    if (page) {
      NX.$$('.nav-links a, .mobile-menu a').forEach((a) => {
        const target = a.dataset.nav;
        if (target === page) a.classList.add('active');
      });
    }
    this.mobile();
  },
  mobile() {
    const burger = NX.$('.hamburger');
    const menu = NX.$('.mobile-menu');
    if (!burger || !menu) return;

    const setOpen = (open) => {
      burger.classList.toggle('open', open);
      menu.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
      // stagger link entrances
      NX.$$('a', menu).forEach((a, i) => {
        a.style.transitionDelay = open ? `${0.06 * i + 0.1}s` : '0s';
      });
    };
    burger.addEventListener('click', () => setOpen(!menu.classList.contains('open')));
    NX.$$('a', menu).forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });
  },
};

/* ------------------------------------------------------------
   07. PAGE TRANSITIONS (curtain wipe between internal pages)
------------------------------------------------------------ */
NX.transitions = {
  init() {
    const curtain = NX.$('.page-curtain');
    if (!curtain || NX.REDUCED) return;
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || a.target === '_blank' ||
          href.startsWith('http') || href.startsWith('mailto:') ||
          href.startsWith('tel:') || href.startsWith('wa.me')) return;
      if (a.hasAttribute('download')) return;
      e.preventDefault();
      curtain.classList.add('in');
      setTimeout(() => { window.location.href = href; }, 480);
    });
    // Clear curtain if arriving via back button (bfcache)
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) curtain.classList.remove('in');
    });
  },
};

/* ------------------------------------------------------------
   08. REVEAL ON SCROLL
------------------------------------------------------------ */
NX.reveal = {
  init() {
    const els = NX.$$('[data-reveal]');
    if (!els.length) return;
    if (NX.REDUCED || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('revealed'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach((el) => io.observe(el));
  },
};

/* ------------------------------------------------------------
   09. STAT COUNTERS  —  <span data-count="24" data-suffix="+">
------------------------------------------------------------ */
NX.counters = {
  init() {
    const els = NX.$$('[data-count]');
    if (!els.length) return;
    const animate = (el) => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const duration = 1800;
      const start = performance.now();
      const step = (now) => {
        const t = NX.clamp((now - start) / duration, 0, 1);
        const eased = 1 - Math.pow(1 - t, 4); // easeOutQuart
        el.textContent = Math.round(target * eased) + suffix;
        if (t < 1) requestAnimationFrame(step);
      };
      if (NX.REDUCED) { el.textContent = target + suffix; return; }
      requestAnimationFrame(step);
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { animate(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.4 });
    els.forEach((el) => io.observe(el));
  },
};

/* ------------------------------------------------------------
   10. MAGNETIC BUTTONS  —  add [data-magnetic]
------------------------------------------------------------ */
NX.magnetic = {
  init() {
    if (NX.IS_TOUCH || NX.REDUCED) return;
    NX.$$('[data-magnetic]').forEach((el) => {
      const strength = parseFloat(el.dataset.magnetic) || 0.35;
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * strength;
        const y = (e.clientY - r.top - r.height / 2) * strength;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });
  },
};

/* ------------------------------------------------------------
   11. 3D TILT CARDS  —  add [data-tilt]
------------------------------------------------------------ */
NX.tilt = {
  init() {
    if (NX.IS_TOUCH || NX.REDUCED) return;
    NX.$$('[data-tilt]').forEach((el) => {
      const max = parseFloat(el.dataset.tilt) || 10;
      let raf = null;
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.style.transform =
            `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) translateY(-4px)`;
          el.style.setProperty('--mx', `${(px + 0.5) * 100}%`);
          el.style.setProperty('--my', `${(py + 0.5) * 100}%`);
        });
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });
  },
};

/* ------------------------------------------------------------
   12. PARALLAX  —  add [data-parallax="0.2"] (speed)
------------------------------------------------------------ */
NX.parallax = {
  init() {
    if (NX.IS_TOUCH || NX.REDUCED) return;
    const els = NX.$$('[data-parallax]');
    if (!els.length) return;
    const update = () => {
      const vh = innerHeight;
      els.forEach((el) => {
        const speed = parseFloat(el.dataset.parallax) || 0.2;
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const offset = (r.top + r.height / 2 - vh / 2) * speed;
        el.style.transform = `translateY(${offset.toFixed(1)}px)`;
      });
    };
    NX.scrollBus.add(update);
    update();
  },
};

/* ------------------------------------------------------------
   13. BACK TO TOP
------------------------------------------------------------ */
NX.backTop = {
  init() {
    const btn = NX.$('.back-top');
    if (!btn) return;
    NX.scrollBus.add((y) => btn.classList.toggle('show', y > 600));
    btn.addEventListener('click', () =>
      window.scrollTo({ top: 0, behavior: NX.REDUCED ? 'auto' : 'smooth' })
    );
  },
};

/* ------------------------------------------------------------
   14. MARQUEE  —  duplicates track content for seamless loop
------------------------------------------------------------ */
NX.marquee = {
  init() {
    NX.$$('.marquee-track').forEach((track) => {
      if (track.dataset.cloned) return;
      track.innerHTML += track.innerHTML;
      track.dataset.cloned = '1';
    });
  },
};

/* ------------------------------------------------------------
   15. HERO VIDEO SLOT
   <!-- VIDEO SLOT: drop your file at assets/videos/home.mp4 -->
   <video class="hero-video" data-video-slot muted loop playsinline preload="none">
     <source src="assets/videos/home.mp4" type="video/mp4">
   </video>
   If the file is missing → video fades out, 3D scene stays visible.
------------------------------------------------------------ */
NX.videoSlots = {
  init() {
    NX.$$('video[data-video-slot]').forEach((video) => {
      // Remember the slot's sources, then detach them so the browser
      // never fetches a missing clip — no 404 noise in the console.
      const sources = Array.from(video.querySelectorAll('source'));
      const srcList = sources.map((s) => ({
        src: s.getAttribute('src'),
        type: s.getAttribute('type'),
      }));
      sources.forEach((s) => s.remove());

      const activate = () => {
        srcList.forEach(({ src, type }) => {
          const s = document.createElement('source');
          if (src) s.setAttribute('src', src);
          if (type) s.setAttribute('type', type);
          video.appendChild(s);
        });
        const show = () => video.classList.add('ready');
        video.addEventListener('canplay', show, { once: true });
        video.addEventListener('error', () => video.remove(), true);
        video.load();
        const p = video.play();
        if (p && p.catch) p.catch(() => { /* autoplay blocked — fine, 3D scene shows */ });
      };

      const firstSrc = srcList.length ? srcList[0].src : null;
      if (!firstSrc) { video.remove(); return; }
      // HEAD-probe the clip: only attach sources when the file really exists.
      // If it's missing the video is removed silently and the 3D/canvas
      // scene stays visible — exactly like before, but without 404 logs.
      fetch(firstSrc, { method: 'HEAD' })
        .then((res) => (res.ok ? activate() : video.remove()))
        .catch(() => video.remove());
    });
  },
};

/* ------------------------------------------------------------
   16. NEWSLETTER FORMS  —  form[data-newsletter]
   ▶▶ BACKEND HOOK: replace the setTimeout below with a real
      fetch() to your endpoint / newsletter provider.
------------------------------------------------------------ */
NX.newsletter = {
  init() {
    NX.$$('form[data-newsletter]').forEach((form) => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = form.querySelector('input[type="email"]');
        const email = (input?.value || '').trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          NX.toast('Please enter a valid email address.', 'warn');
          input?.focus();
          return;
        }
        // ▶▶ BACKEND HOOK — plug your newsletter API here:
        // fetch('https://your-endpoint.example/subscribe', { method:'POST', body: JSON.stringify({ email }) })
        try { localStorage.setItem('nexora-newsletter', email); } catch (_) {}
        form.reset();
        NX.toast('Subscribed! Welcome to the Nexora Labz circle. 🚀');
      });
    });
  },
};

/* ------------------------------------------------------------
   17. TOAST SYSTEM
------------------------------------------------------------ */
NX.toast = (message, type = 'ok', duration = 3200) => {
  let zone = NX.$('.toast-zone');
  if (!zone) {
    zone = document.createElement('div');
    zone.className = 'toast-zone';
    zone.setAttribute('aria-live', 'polite');
    document.body.appendChild(zone);
  }
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `
    <span class="t-ico">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        ${type === 'warn'
          ? '<path d="M12 8v5"/><path d="M12 16.5h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>'
          : '<path d="M20 6 9 17l-5-5"/>'}
      </svg>
    </span>
    <span>${message}</span>`;
  zone.appendChild(el);
  setTimeout(() => {
    el.classList.add('leaving');
    setTimeout(() => el.remove(), 420);
  }, duration);
};

/* ------------------------------------------------------------
   18. SMOOTH SCROLLING — native.
   No scroll-hijacking library (Lenis was removed for
   performance: its wheel-hijack + lerp loop fought the browser's
   own smooth scrolling and made page scroll feel laggy).
   Anchor navigation is smoothed with CSS:
   html { scroll-behavior: smooth } in main.css.
------------------------------------------------------------ */

/* ------------------------------------------------------------
   18b. IMAGE ONE-TIME FADE  —  <img data-fade>
   The image is fully visible by default (no CSS hiding), so if
   JS or the load event ever fails, nothing stays invisible.
   JS hides it ONLY when it is still loading, then fades it in
   exactly once on the load event ({ once: true } — it can never
   re-trigger or double-paint). Already-cached images (the common
   case thanks to <link rel="preload">) skip the animation
   entirely — no second paint, no flicker.
------------------------------------------------------------ */
NX.imgFade = {
  init() {
    NX.$$('[data-fade]').forEach((img) => {
      if (NX.REDUCED) return;                       // respect reduced motion
      if (img.complete && img.naturalWidth > 0) return; // already loaded → show instantly
      img.classList.add('img-fade');
      const show = () => img.classList.add('img-loaded');
      img.addEventListener('load', show, { once: true });
      img.addEventListener('error', show, { once: true }); // never leave it hidden
    });
  },
};

/* ------------------------------------------------------------
   BOOT
------------------------------------------------------------ */
NX.onReady(() => {
  NX.scrollBus.init();
  NX.theme.init();
  NX.preloader.init();
  NX.cursor.init();
  NX.progress.init();
  NX.nav.init();
  NX.transitions.init();
  NX.reveal.init();
  NX.counters.init();
  NX.magnetic.init();
  NX.tilt.init();
  NX.parallax.init();
  NX.backTop.init();
  NX.marquee.init();
  NX.videoSlots.init();
  NX.newsletter.init();
  NX.imgFade.init();

  // Footer year  <span data-year></span>
  NX.$$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  // Generic form guard: never let demo forms actually navigate
  NX.$$('form:not([data-newsletter]):not([data-real-action])').forEach((form) => {
    form.addEventListener('submit', (e) => e.preventDefault());
  });
});
