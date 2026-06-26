  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── ASCII 3D torus-knot (red) ── */
  (function () {
    const canvas = document.getElementById('asciiCanvas');
    const hero = document.getElementById('hero');
    if (!canvas || !hero) return;
    const ctx = canvas.getContext('2d');
    const CHARS = " .:-=+*#%@";
    let frame, time = 0, w, h, dpr;
    const mouse = { x: 0.65, y: 0.5 };

    function resize() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = hero.clientWidth; h = hero.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize(); addEventListener('resize', resize);
    addEventListener('mousemove', e => { mouse.x = e.clientX / innerWidth; mouse.y = e.clientY / innerHeight; });

    // generate torus knot points
    const pts = [];
    const P = 2, Q = 3, SEG = 128, TUBE = 16, tubeR = 0.4;
    for (let i = 0; i < SEG; i++) for (let j = 0; j < TUBE; j++) {
      const u = (i / SEG) * Math.PI * 2, v = (j / TUBE) * Math.PI * 2;
      const r = 2 + Math.cos(Q * u);
      const x = r * Math.cos(P * u), y = r * Math.sin(P * u), z = -Math.sin(Q * u);
      const nx = Math.cos(P * u) * Math.cos(v), ny = Math.sin(P * u) * Math.cos(v), nz = Math.sin(v);
      pts.push({ x: x + tubeR * nx, y: y + tubeR * ny, z: z + tubeR * nz });
    }
    function rot(p, ax, ay, az) {
      let { x, y, z } = p;
      let cy1 = Math.cos(ax), sy1 = Math.sin(ax); let ny = y * cy1 - z * sy1, nz = y * sy1 + z * cy1; y = ny; z = nz;
      let cx = Math.cos(ay), sx = Math.sin(ay); let nx = x * cx + z * sx; z = -x * sx + z * cx; x = nx;
      let cz = Math.cos(az), sz = Math.sin(az); return { x: x * cz - y * sz, y: x * sz + y * cz, z };
    }
    function render() {
      const cx = w * 0.66, cy = h * 0.5, scale = Math.min(w, h) * 0.34;
      ctx.clearRect(0, 0, w, h);
      const mInfX = (mouse.x - 0.5) * 0.5, mInfY = (mouse.y - 0.5) * 0.5;
      const ax = time * 0.3 + mInfY, ay = time * 0.5 + mInfX, az = time * 0.2;
      const proj = pts.map(p => {
        const r = rot(p, ax, ay, az);
        const persp = 5, f = persp / (persp + r.z);
        return { x: cx + r.x * scale * f, y: cy + r.y * scale * f, z: r.z };
      }).sort((a, b) => a.z - b.z);
      const cs = Math.max(13, Math.min(w, h) * 0.028);
      ctx.font = cs + 'px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      proj.forEach(p => {
        const nz = (p.z + 3) / 6;
        const ch = CHARS[Math.max(0, Math.min(CHARS.length - 1, Math.floor(nz * (CHARS.length - 1))))];
        const bright = 0.18 + nz * 0.82;
        // red palette: deepen channel toward bright red with depth
        const rr = Math.floor(150 + nz * 95);
        const gg = Math.floor(18 + nz * 30);
        const bb = Math.floor(17 + nz * 26);
        ctx.fillStyle = `rgba(${rr},${gg},${bb},${bright})`;
        ctx.fillText(ch, p.x, p.y);
      });
      // floating particles
      for (let i = 0; i < 46; i++) {
        const px = (Math.sin(time * 0.5 + i * 0.5) * 0.32 + 0.66) * w;
        const py = (Math.cos(time * 0.3 + i * 0.7) * 0.32 + 0.5) * h;
        const pz = Math.sin(time + i) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(185,28,26,${pz * 0.28})`;
        ctx.fillText(CHARS[Math.floor(pz * (CHARS.length - 1))], px, py);
      }
      time += 0.008;
      frame = requestAnimationFrame(render);
    }
    if (!reduce) {
      render();
      new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) { cancelAnimationFrame(frame); render(); }
        else cancelAnimationFrame(frame);
      }), { threshold: 0 }).observe(hero);
    }
  })();

  /* ── Hero cycling blur-in word ── */
  (function () {
    const el = document.getElementById('cycleWord');
    if (!el) return;
    const words = ['ship', 'scale', 'endure', 'perform'];
    let wi = 0;
    function setWord(word) {
      el.innerHTML = '';
      const letters = word.split('');
      const STAG = 45, DUR = 500;
      letters.forEach((ch, i) => {
        const s = document.createElement('span');
        s.textContent = ch; s.style.display = 'inline-block';
        s.style.opacity = '0'; s.style.filter = 'blur(20px)';
        el.appendChild(s);
        if (reduce) { s.style.opacity = '1'; s.style.filter = 'none'; return; }
        setTimeout(() => {
          const start = performance.now();
          (function tick(now) {
            const p = Math.min((now - start) / DUR, 1);
            const e = 1 - Math.pow(1 - p, 3);
            s.style.opacity = e; s.style.filter = `blur(${20 * (1 - e)}px)`;
            if (p < 1) requestAnimationFrame(tick);
          })(performance.now());
        }, i * STAG);
      });
    }
    setWord(words[0]);
    if (!reduce) setInterval(() => { wi = (wi + 1) % words.length; setWord(words[wi]); }, 2600);
  })();

  /* ── Scroll reveal ── */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } }), { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* ── Counters (hero + metrics) ── */
  function runCount(el) {
    const target = parseFloat(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    const decimals = +(el.dataset.decimals || 0);
    const dur = 1800, start = performance.now();
    (function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 4);
      const val = target * e;
      el.textContent = (decimals ? val.toFixed(decimals) : Math.floor(val)) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    })(performance.now());
  }
  const heroCountIO = new IntersectionObserver((es, obs) => es.forEach(e => { if (e.isIntersecting) { document.querySelectorAll('.hstat .num').forEach(runCount); obs.disconnect(); } }), { threshold: 0.4 });
  const heroStatsEl = document.querySelector('.hero-stats');
  if (heroStatsEl) heroCountIO.observe(heroStatsEl);
  const metricIO = new IntersectionObserver((es, obs) => es.forEach(e => { if (e.isIntersecting) { document.querySelectorAll('#metrics .count').forEach(runCount); obs.disconnect(); } }), { threshold: 0.4 });
  const metricsEl = document.getElementById('metrics');
  if (metricsEl) metricIO.observe(metricsEl);

  /* ── Nav scroll + mobile ── */
  const nav = document.getElementById('nav');
  addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 24), { passive: true });
  const navLinks = document.getElementById('navLinks');
  document.getElementById('navToggle').addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

  /* ── Magnetic CTA ── */
  document.querySelectorAll('.btn, .nav-cta').forEach(btn => {
    btn.addEventListener('mousemove', e => { const r = btn.getBoundingClientRect(); btn.style.transform = `translate(${(e.clientX-r.left-r.width/2)*0.2}px,${(e.clientY-r.top-r.height/2)*0.3}px)`; });
    btn.addEventListener('mouseleave', () => btn.style.transform = 'translate(0,0)');
  });

  /* ── Process auto-cycle + code ── */
  (function () {
    const snippets = [
      { name: 'define.ts', html: `<span class="c">// scope the build</span>\n<span class="k">const</span> project = <span class="k">new</span> <span class="f">Build</span>({\n  goal: <span class="s">'Ship the MVP'</span>,\n  stack: [<span class="s">'react'</span>, <span class="s">'node'</span>, <span class="s">'ai'</span>],\n  timeline: <span class="s">'1 sprint'</span>,\n})` },
      { name: 'build.ts', html: `<span class="c">// parallel deep work</span>\n<span class="k">await</span> project.<span class="f">execute</span>({\n  tracks: [<span class="s">'design'</span>, <span class="s">'core'</span>, <span class="s">'qa'</span>],\n  review: <span class="k">true</span>,\n  mode: <span class="s">'continuous'</span>,\n})` },
      { name: 'ship.ts', html: `<span class="c">// deploy + iterate</span>\nproject.<span class="f">ship</span>({\n  deploy: <span class="s">'production'</span>,\n  handoff: <span class="k">true</span>,\n})\n<span class="c">// 100% on-time delivery</span>` },
    ];
    const steps = [...document.querySelectorAll('.proc-step')];
    const codeBlock = document.getElementById('codeBlock');
    if (!codeBlock) return;
    const codeName = document.getElementById('codeName');
    let active = 0, timer;
    function set(i) {
      active = i;
      steps.forEach((s, k) => s.classList.toggle('active', k === i));
      codeBlock.innerHTML = snippets[i].html;
      codeName.textContent = snippets[i].name;
    }
    function start() { if (reduce) return; timer = setInterval(() => set((active + 1) % steps.length), 6000); }
    steps.forEach((s, i) => s.addEventListener('click', () => { clearInterval(timer); set(i); start(); }));
    set(0); start();
  })();

  /* ── Pills ── */
  document.querySelectorAll('#pillGroup .pill').forEach(p => p.addEventListener('click', () => {
    document.querySelectorAll('#pillGroup .pill').forEach(x => x.classList.remove('selected')); p.classList.add('selected');
  }));

  /* ── Multi-step form ── */
  (function () {
    const form = document.getElementById('projForm');
    if (!form) return; // not on the home page
    let step = 1; const total = 3;
    const panels = document.querySelectorAll('.form-panel');
    const sbSteps = document.querySelectorAll('.sb-step');
    const btnNext = document.getElementById('btnNext');
    const btnBack = document.getElementById('btnBack');
    const stepNow = document.getElementById('stepNow');
    const errEl = document.getElementById('formErr');

    // field refs
    const nameEl = document.getElementById('f-name');
    const emailEl = document.getElementById('f-email');
    const budgetEl = document.getElementById('f-budget');
    const detailsEl = document.getElementById('f-details');

    function render() {
      panels.forEach(p => p.classList.toggle('active', +p.dataset.panel === step));
      sbSteps.forEach(s => { const n = +s.dataset.step; s.classList.toggle('active', n === step); s.classList.toggle('done', n < step); });
      stepNow.textContent = step;
      btnBack.hidden = step === 1;
      btnNext.innerHTML = step === total ? 'Send request <i class="ti ti-send"></i>' : 'Next <i class="ti ti-arrow-right"></i>';
    }

    function setErr(msg) { if (errEl) errEl.textContent = msg || ''; }

    // basic per-step validation before advancing
    function validateStep() {
      setErr('');
      if (step === 1) {
        if (!nameEl.value.trim()) { setErr('Please enter your name.'); return false; }
        const em = emailEl.value.trim();
        if (!em || !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(em)) { setErr('Please enter a valid email address.'); return false; }
      }
      return true;
    }

    async function submitLead() {
      const selectedPill = document.querySelector('#pillGroup .pill.selected');
      const payload = {
        name: nameEl.value.trim(),
        email: emailEl.value.trim(),
        service: selectedPill ? selectedPill.textContent.trim() : '',
        budget: budgetEl.value || '',
        details: detailsEl.value.trim(),
      };
      setErr('');
      btnNext.classList.add('loading');
      btnNext.innerHTML = 'Sending… <i class="ti ti-loader-2"></i>';
      try {
        const res = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Something went wrong. Please try again.');
        }
        // success
        form.style.display = 'none';
        document.querySelector('.steps-bar').style.opacity = '.4';
        document.getElementById('formSuccess').classList.add('show');
      } catch (err) {
        setErr(err.message || 'Network error. Please try again.');
        btnNext.classList.remove('loading');
        btnNext.innerHTML = 'Send request <i class="ti ti-send"></i>';
      }
    }

    btnNext.addEventListener('click', () => {
      if (step < total) { if (!validateStep()) return; step++; render(); }
      else { submitLead(); }
    });
    btnBack.addEventListener('click', () => { if (step > 1) { setErr(''); step--; render(); } });
    render();
  })();

  /* ── Booking modal (Book a call) ── */
  (function () {
    const overlay = document.getElementById('bookModal');
    if (!overlay) return;
    const openers = document.querySelectorAll('[data-book]');
    const closeBtn = overlay.querySelector('.modal-close');
    function open(e) { if (e) e.preventDefault(); overlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
    function close() { overlay.classList.remove('open'); document.body.style.overflow = ''; }
    openers.forEach(a => a.addEventListener('click', open));
    if (closeBtn) closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  })();

  /* ── Portfolio filter (portfolio.html only) ── */
  (function () {
    const bar = document.getElementById('filterBar');
    if (!bar) return;
    const cards = document.querySelectorAll('.port-page-grid .port-card');
    bar.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        bar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const f = btn.dataset.filter;
        let n = 0;
        cards.forEach(card => {
          const show = f === 'all' || card.dataset.cat === f;
          card.classList.toggle('hide', !show);
          if (show) { card.querySelector('.port-num').textContent = String(++n).padStart(2, '0'); }
        });
      });
    });
  })();
