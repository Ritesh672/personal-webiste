'use strict';

(function () {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

  /* ---------- year ---------- */
  const year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- theme toggle ---------- */
  const themeBtn = $('[data-theme-toggle]');
  const currentTheme = () =>
    root.getAttribute('data-theme') ||
    (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  themeBtn?.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) { /* storage blocked */ }
  });

  /* ---------- nav: scrolled state, progress bar, mobile menu, active link ---------- */
  const nav = $('[data-nav]');
  const progress = $('.scroll-progress span');
  const menuBtn = $('[data-menu-btn]');
  const navLinks = $('[data-nav-links]');

  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 20);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    updateTimeline();
  };

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

  const sections = $$('main section[id]');
  const linkFor = (id) => $(`[data-link][href="#${id}"]`);
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            $$('[data-link]').forEach((l) => l.classList.remove('active'));
            linkFor(e.target.id)?.classList.add('active');
          }
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- reveal on scroll (with stagger inside groups) ---------- */
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
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
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
  const format = (n, el) => (el.dataset.format === 'comma' ? n.toLocaleString('en-US') : String(n));
  const runCounter = (el) => {
    const target = Number(el.dataset.count);
    const start = performance.now();
    const dur = 1600;
    const step = (t) => {
      const p = Math.min((t - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = format(Math.round(target * eased), el);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if (!reduceMotion && 'IntersectionObserver' in window) {
    counters.forEach((el) => (el.textContent = '0'));
    const co = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { runCounter(e.target); co.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => co.observe(el));
  }

  /* ---------- agent pipeline: light up steps in sequence ---------- */
  const steps = $$('[data-step]');
  if (steps.length) {
    let i = 0, timer = null;
    const light = () => {
      steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
      i = (i + 1) % steps.length;
    };
    const pipeline = $('[data-pipeline]');
    if (reduceMotion) {
      steps[0].classList.add('is-active');
    } else if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !timer) { light(); timer = setInterval(light, 1300); }
          else if (!e.isIntersecting && timer) { clearInterval(timer); timer = null; }
        });
      }).observe(pipeline);
    }
  }

  /* ---------- timeline progress line ---------- */
  const timeline = $('[data-timeline]');
  function updateTimeline() {
    if (!timeline) return;
    const r = timeline.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = Math.min(Math.max((vh * 0.75 - r.top) / r.height, 0), 1);
    timeline.style.setProperty('--tl-progress', reduceMotion ? 1 : p);
  }

  /* ---------- pointer effects (desktop only) ---------- */
  if (finePointer && !reduceMotion) {
    const glow = $('.cursor-glow');
    let gx = 0, gy = 0, tx = 0, ty = 0;
    window.addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    const follow = () => {
      gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
      if (glow) glow.style.transform = `translate(${gx - 260}px, ${gy - 260}px)`;
      requestAnimationFrame(follow);
    };
    follow();

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
        card.style.transform = `perspective(1000px) rotateX(${(-py * 5).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg) translateY(-4px)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });

    // magnetic buttons
    $$('.magnetic').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.18}px, ${y * 0.25}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---------- hero neural-network canvas ---------- */
  const canvas = $('[data-network]');
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    let w, h, dpr, nodes = [], running = true, raf;
    const mouse = { x: -9999, y: -9999 };

    const colors = () => {
      const s = getComputedStyle(root);
      return { a1: s.getPropertyValue('--a1').trim(), a2: s.getPropertyValue('--a2').trim() };
    };
    let palette = colors();
    new MutationObserver(() => (palette = colors())).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(90, (w * h) / 16000));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.8,
      }));
    };

    const hexA = (hex, a) => {
      const m = hex.replace('#', '');
      const n = parseInt(m.length === 3 ? m.split('').map((c) => c + c).join('') : m, 16);
      return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const link = 130;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        if (!reduceMotion) {
          a.x += a.vx; a.y += a.vy;
          if (a.x < 0 || a.x > w) a.vx *= -1;
          if (a.y < 0 || a.y > h) a.vy *= -1;
          const dx = a.x - mouse.x, dy = a.y - mouse.y, d = Math.hypot(dx, dy);
          if (d < 140 && d > 0) { a.x += (dx / d) * 1.1; a.y += (dy / d) * 1.1; }
        }
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < link) {
            ctx.strokeStyle = hexA(palette.a1, (1 - d / link) * 0.28);
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        // links to the cursor
        const md = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (md < 180) {
          ctx.strokeStyle = hexA(palette.a2, (1 - md / 180) * 0.45);
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
        ctx.fillStyle = hexA(palette.a2, 0.85);
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
      }
      if (running && !reduceMotion) raf = requestAnimationFrame(draw);
    };

    resize();
    draw();
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { resize(); if (reduceMotion) draw(); }, 150); });
    const hero = canvas.parentElement;
    hero.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });

    // pause when the hero is off-screen or the tab is hidden
    if ('IntersectionObserver' in window && !reduceMotion) {
      new IntersectionObserver(([e]) => {
        const was = running;
        running = e.isIntersecting && !document.hidden;
        if (running && !was) draw();
        if (!running) cancelAnimationFrame(raf);
      }).observe(hero);
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { running = false; cancelAnimationFrame(raf); }
      else if (!reduceMotion && hero.getBoundingClientRect().bottom > 0) { running = true; draw(); }
    });
  }

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
      if (!window.fetch) return; // let the browser post normally
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

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
