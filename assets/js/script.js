'use strict';

(function () {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- year ---------- */
  const year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- theme toggle ---------- */
  const themeBtn = $('[data-theme-toggle]');
  const isDark = () =>
    root.getAttribute('data-theme')
      ? root.getAttribute('data-theme') === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
  themeBtn?.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) { /* storage blocked */ }
  });

  /* ---------- nav: scrolled state, progress bar, mobile menu, active link ---------- */
  const nav = $('[data-nav]');
  const progress = $('.scroll-progress span');
  const menuBtn = $('[data-menu-btn]');
  const navLinks = $('[data-nav-links]');

  menuBtn?.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  $$('[data-link]').forEach((a) =>
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      menuBtn?.setAttribute('aria-expanded', 'false');
    })
  );

  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          $$('[data-link]').forEach((l) => l.classList.remove('active'));
          $(`[data-link][href="#${e.target.id}"]`)?.classList.add('active');
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    $$('main section[id]').forEach((s) => spy.observe(s));
  }

  /* ---------- reveal on scroll (stagger inside groups) ---------- */
  const reveals = $$('.reveal');
  $$('.service-grid, .stats, .project-grid, .skill-grid, .timeline').forEach((group) => {
    $$('.reveal', group).forEach((el, i) => el.style.setProperty('--d', `${i * 90}ms`));
  });
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    reveals.forEach((el) => io.observe(el));
  }

  /* ---------- typewriter ---------- */
  const typed = $('[data-typed]');
  if (typed && !reduceMotion) {
    let words = [];
    try { words = JSON.parse(typed.dataset.words); } catch (e) { words = [typed.textContent]; }
    let w = 0, c = words[0].length, deleting = true;
    const tick = () => {
      const word = words[w];
      c += deleting ? -1 : 1;
      typed.textContent = word.slice(0, c);
      let delay = deleting ? 32 : 62;
      if (!deleting && c === word.length) { deleting = true; delay = 1900; }
      else if (deleting && c === 0) { deleting = false; w = (w + 1) % words.length; delay = 350; }
      setTimeout(tick, delay);
    };
    setTimeout(tick, 2200);
  }

  /* ---------- counters ---------- */
  const counters = $$('[data-count]');
  const fmt = (n, el) => (el.dataset.format === 'comma' ? n.toLocaleString('en-US') : String(n));
  if (!reduceMotion && 'IntersectionObserver' in window) {
    counters.forEach((el) => (el.textContent = '0'));
    const co = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target, target = Number(el.dataset.count), start = performance.now();
        const step = (t) => {
          const p = Math.min((t - start) / 1600, 1);
          el.textContent = fmt(Math.round(target * (1 - Math.pow(1 - p, 3))), el);
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        co.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => co.observe(el));
  }

  /* ---------- agent pipeline: light up steps in sequence ---------- */
  const steps = $$('[data-step]');
  const pipeline = $('[data-pipeline]');
  if (steps.length && pipeline) {
    let i = 0, timer = null;
    const light = () => {
      steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
      i = (i + 1) % steps.length;
    };
    if (reduceMotion || !('IntersectionObserver' in window)) {
      steps[0].classList.add('is-active');
    } else {
      new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !timer) { light(); timer = setInterval(light, 1400); }
          else if (!e.isIntersecting && timer) { clearInterval(timer); timer = null; }
        });
      }).observe(pipeline);
    }
  }

  /* ---------- timeline progress line ---------- */
  const timeline = $('[data-timeline]');
  const updateTimeline = () => {
    if (!timeline) return;
    const r = timeline.getBoundingClientRect();
    const p = Math.min(Math.max((window.innerHeight * 0.75 - r.top) / r.height, 0), 1);
    timeline.style.setProperty('--tl-progress', reduceMotion ? 1 : p);
  };

  /* ---------- project cards: whole card opens its repo ---------- */
  $$('.project[data-cursor]').forEach((card) => {
    const link = $('a[href]', card);
    if (!link) { card.removeAttribute('data-cursor'); return; }
    card.addEventListener('click', (e) => {
      if (e.target.closest('a, button')) return;
      window.open(link.href, '_blank', 'noopener');
    });
  });

  /* ---------- pointer effects (desktop only) ---------- */
  const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2, nx: 0, ny: 0 };
  window.addEventListener('pointermove', (e) => {
    pointer.x = e.clientX; pointer.y = e.clientY;
    pointer.nx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ny = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  if (finePointer && !reduceMotion) {
    // custom cursor: dot follows exactly, ring trails behind and morphs over targets
    const cursor = $('.cursor');
    const dot = $('.cursor-dot');
    const ring = $('.cursor-ring');
    const label = $('[data-cursor-label]');
    if (cursor && dot && ring) {
      root.classList.add('has-cursor');
      let rx = pointer.x, ry = pointer.y;
      const loop = () => {
        rx = lerp(rx, pointer.x, 0.18); ry = lerp(ry, pointer.y, 0.18);
        dot.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`;
        ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
        requestAnimationFrame(loop);
      };
      loop();
      document.addEventListener('pointerover', (e) => {
        const t = e.target;
        const field = t.closest('input, textarea');
        const link = t.closest('a, button, label');
        const labelled = t.closest('[data-cursor]');
        cursor.classList.toggle('is-hidden', !!field);
        cursor.classList.toggle('is-link', !!link && !field);
        cursor.classList.toggle('is-label', !!labelled && !link && !field);
        if (labelled && label) label.textContent = labelled.dataset.cursor;
      });
      document.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
      document.addEventListener('pointerup', () => cursor.classList.remove('is-down'));
      document.documentElement.addEventListener('pointerleave', () => cursor.classList.add('is-hidden'));
      document.documentElement.addEventListener('pointerenter', () => cursor.classList.remove('is-hidden'));
    }

    // spotlight inside cards
    $$('[data-spotlight]').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });

    // 3D tilt on project cards
    $$('[data-tilt]').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(1000px) rotateX(${(-py * 7).toFixed(2)}deg) rotateY(${(px * 8).toFixed(2)}deg) translateY(-4px)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });

    // hero visual leans toward the cursor
    const heroVisual = $('.hero-visual .avatar-wrap');
    if (heroVisual) {
      let hx = 0, hy = 0;
      const lean = () => {
        hx = lerp(hx, pointer.nx, 0.06); hy = lerp(hy, pointer.ny, 0.06);
        heroVisual.style.transform = `rotateY(${hx * 14}deg) rotateX(${-hy * 10}deg)`;
        requestAnimationFrame(lean);
      };
      lean();
    }

    // magnetic buttons
    $$('.magnetic').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.25}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---------- 3D scene: clay shapes drifting behind the whole page ---------- */
  const startScene = () => {
    const canvas = $('[data-scene]');
    const THREE = window.THREE;
    if (!canvas || !THREE) return null;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch (e) {
      return null; // no WebGL: the page works fine without the scene
    }
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 18);

    const hemi = new THREE.HemisphereLight(0xfff4e6, 0x5c4433, 0.85);
    const key = new THREE.DirectionalLight(0xffe2c4, 0.9);
    key.position.set(6, 9, 8);
    const rim = new THREE.DirectionalLight(0xc9d6bd, 0.35);
    rim.position.set(-8, -4, 4);
    scene.add(hemi, key, rim);

    const palettes = {
      light: [0xc8553d, 0x8a9a7b, 0xd4a017, 0x5c4433, 0xd9c3a5, 0xe08a6d],
      dark: [0xe07856, 0x9fb08f, 0xe0b23c, 0x8a6a52, 0xcdb593, 0xf0a184],
    };
    const geos = [
      new THREE.IcosahedronGeometry(1.15, 0),
      new THREE.TorusGeometry(0.95, 0.36, 14, 40),
      new THREE.OctahedronGeometry(1.1, 0),
      new THREE.TorusKnotGeometry(0.75, 0.26, 90, 10),
      new THREE.DodecahedronGeometry(1, 0),
      new THREE.ConeGeometry(0.95, 1.6, 6),
      new THREE.BoxGeometry(1.3, 1.3, 1.3),
      new THREE.CylinderGeometry(0.75, 0.75, 1.3, 7),
    ];

    const meshes = [];
    const rand = (a, b) => a + Math.random() * (b - a);
    const viewH = 2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360); // world units per screen height
    const PARALLAX = 0.55; // shapes move slower than the page, so they feel deeper

    const build = () => {
      meshes.forEach((m) => { scene.remove(m); m.material.dispose(); });
      meshes.length = 0;
      const aspect = window.innerWidth / window.innerHeight;
      const halfW = (viewH * aspect) / 2;
      const mobile = window.innerWidth < 700;
      const pages = document.documentElement.scrollHeight / window.innerHeight;
      const span = pages * viewH * PARALLAX + viewH;
      const count = Math.round(Math.min(mobile ? 10 : 22, 6 + pages * (mobile ? 1.2 : 2.6)));
      const colors = isDark() ? palettes.dark : palettes.light;

      for (let i = 0; i < count; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        // Hug the left/right screen edges (partly off-screen) so shapes frame the
        // content instead of sitting under it. Width at depth z grows with distance.
        const z = rand(-7, -1.5);
        const halfAtZ = halfW * (camera.position.z - z) / camera.position.z;
        const x = side * halfAtZ * rand(mobile ? 0.92 : 0.86, mobile ? 1.12 : 1.06);
        // start below the nav band so nothing sits behind the top bar
        const y = viewH / 2 - 2.2 - (i / count) * span + rand(-1, 1);
        const mat = new THREE.MeshStandardMaterial({
          color: colors[i % colors.length], roughness: 0.78, metalness: 0.04, flatShading: true,
          transparent: mobile, opacity: mobile ? 0.8 : 1,
        });
        const mesh = new THREE.Mesh(geos[i % geos.length], mat);
        const s = rand(0.55, 1.1) * (mobile ? 0.7 : 1);
        mesh.scale.setScalar(s);
        mesh.position.set(x, y, z);
        mesh.rotation.set(rand(0, Math.PI), rand(0, Math.PI), 0);
        mesh.userData = { baseY: y, spinX: rand(0.08, 0.25) * (Math.random() < 0.5 ? -1 : 1), spinY: rand(0.1, 0.3), bob: rand(0.4, 0.9), phase: rand(0, Math.PI * 2) };
        meshes.push(mesh);
        scene.add(mesh);
      }
    };

    const recolor = () => {
      const colors = isDark() ? palettes.dark : palettes.light;
      meshes.forEach((m, i) => m.material.color.setHex(colors[i % colors.length]));
      render(performance.now());
    };
    new MutationObserver(recolor).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    const resize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      build();
    };

    let camX = 0, camY = 0, last = performance.now();
    const render = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const scrollY = window.scrollY;
      const targetY = -(scrollY / window.innerHeight) * viewH * PARALLAX;
      camY = reduceMotion ? targetY : lerp(camY, targetY, 0.08);
      camX = reduceMotion ? 0 : lerp(camX, pointer.nx * 0.9, 0.04);
      camera.position.x = camX;
      camera.position.y = camY - (reduceMotion ? 0 : pointer.ny * 0.5);
      camera.lookAt(camX * 0.4, camY, 0);

      if (!reduceMotion) {
        const t = now / 1000;
        const scrollSpin = scrollY * 0.0012;
        meshes.forEach((m) => {
          const d = m.userData;
          m.rotation.x += d.spinX * dt;
          m.rotation.y += d.spinY * dt;
          m.rotation.z = scrollSpin * d.spinX * 4;
          m.position.y = d.baseY + Math.sin(t * d.bob + d.phase) * 0.35;
        });
      }
      renderer.render(scene, camera);
    };

    let running = true, raf = 0;
    const loop = (now) => {
      render(now);
      if (running) raf = requestAnimationFrame(loop);
    };

    resize();
    render(performance.now());
    canvas.classList.add('ready');

    let rt;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => { resize(); render(performance.now()); }, 150);
    });

    if (reduceMotion) {
      // no continuous animation: just keep the camera in sync with scroll
      window.addEventListener('scroll', () => render(performance.now()), { passive: true });
    } else {
      raf = requestAnimationFrame(loop);
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) { running = false; cancelAnimationFrame(raf); }
        else if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(loop); }
      });
    }

    // the page can grow after fonts/images load; rebuild so shapes cover it
    window.addEventListener('load', () => { build(); render(performance.now()); });
    return true;
  };
  startScene();

  /* ---------- copy email ---------- */
  $$('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        btn.textContent = 'Copied!';
      } catch (e) {
        btn.textContent = 'Press Ctrl+C';
      }
      setTimeout(() => (btn.textContent = 'Copy'), 1800);
    });
  });

  /* ---------- contact form (FormSubmit AJAX, falls back to normal POST) ---------- */
  const form = $('[data-form]');
  if (form) {
    const btn = $('[data-form-btn]', form);
    const label = $('[data-btn-label]', form);
    const status = $('[data-form-status]', form);
    form.addEventListener('submit', async (e) => {
      if (!window.fetch) return;
      e.preventDefault();
      if (form._honey && form._honey.value) return;
      btn.disabled = true;
      label.textContent = 'Sending…';
      status.className = 'form-status';
      status.textContent = '';
      try {
        const data = Object.fromEntries(new FormData(form).entries());
        const res = await fetch('https://formsubmit.co/ajax/riteshyad672@gmail.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('bad status');
        form.reset();
        status.classList.add('ok');
        status.textContent = 'Thanks! Your message is on its way. I will reply soon.';
      } catch (err) {
        status.classList.add('err');
        status.textContent = 'Could not send right now. Please email riteshyad672@gmail.com directly.';
      } finally {
        btn.disabled = false;
        label.textContent = 'Send message';
      }
    });
  }

  /* ---------- scroll-driven bits ---------- */
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 20);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    updateTimeline();
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
