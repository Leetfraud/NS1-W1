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
      { name: 'shape.ts',  html: `<span class="c">// pressure-test the vision</span>\n<span class="k">const</span> idea = <span class="k">await</span> <span class="f">shape</span>({\n  vision: <span class="s">'rough concept'</span>,\n  weeks: 2,\n  output: <span class="s">'buildable spec'</span>,\n})` },
      { name: 'define.ts', html: `<span class="c">// scope the build</span>\n<span class="k">const</span> project = <span class="k">new</span> <span class="f">Build</span>({\n  goal: <span class="s">'Ship the MVP'</span>,\n  stack: [<span class="s">'react'</span>, <span class="s">'node'</span>, <span class="s">'ai'</span>],\n  timeline: <span class="s">'1 sprint'</span>,\n})` },
      { name: 'build.ts',  html: `<span class="c">// parallel deep work</span>\n<span class="k">await</span> project.<span class="f">execute</span>({\n  tracks: [<span class="s">'design'</span>, <span class="s">'core'</span>, <span class="s">'qa'</span>],\n  review: <span class="k">true</span>,\n  mode: <span class="s">'continuous'</span>,\n})` },
      { name: 'ship.ts',   html: `<span class="c">// deploy + iterate</span>\nproject.<span class="f">ship</span>({\n  deploy: <span class="s">'production'</span>,\n  handoff: <span class="k">true</span>,\n})\n<span class="c">// 100% on-time delivery</span>` },
    ];
    const steps = [...document.querySelectorAll('.proc-step')];
    const tabs  = [...document.querySelectorAll('.proc-tab')];
    const codeBlock = document.getElementById('codeBlock');
    if (!codeBlock) return;
    let active = 0, timer;
    function set(i) {
      active = i;
      steps.forEach((s, k) => s.classList.toggle('active', k === i));
      tabs.forEach((t, k)  => t.classList.toggle('active', k === i));
      codeBlock.innerHTML = snippets[i].html;
    }
    function start() { if (reduce) return; timer = setInterval(() => set((active + 1) % snippets.length), 6000); }
    function pick(i) { clearInterval(timer); set(i); start(); }
    steps.forEach((s, i) => s.addEventListener('click', () => pick(i)));
    tabs.forEach((t, i)  => t.addEventListener('click', () => pick(+t.dataset.tab)));
    set(0); start();
  })();

  /* ── Capabilities accordion ── */
  (function () {
    const rows = document.querySelectorAll('.cap-row');
    if (!rows.length) return;
    function open(i) {
      rows.forEach((row, k) => {
        const on = k === i;
        row.classList.toggle('active', on);
        row.querySelector('.cap-hd').setAttribute('aria-expanded', on);
        const icon = row.querySelector('.cap-toggle');
        icon.classList.toggle('ti-minus', on);
        icon.classList.toggle('ti-plus', !on);
      });
    }
    rows.forEach((row, i) => row.querySelector('.cap-hd').addEventListener('click', () => open(i)));
    open(0);
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
        btnNext.classList.remove('loading');
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

  /* ── Portfolio image-style cards ── */
  (function () {
    const grid = document.getElementById('portGrid');
    if (!grid) return;

    const PROJECTS = [
      { num: '01', tag: 'Web Platform',       title: 'DevProfile Analyzer',  line: 'Turns any GitHub profile into a readable signal.',    chips: ['React','Vite','Tailwind','GitHub API'], treatment: 'heatmap',  delay: ''   },
      { num: '02', tag: 'AI Desktop Agent',   title: 'Tabby',                line: 'Voice, intent and gesture in one offline interface.', chips: ['Python','Whisper','Vision'],            treatment: 'waveform', delay: 'd1' },
      { num: '03', tag: 'Systems Engineering', title: 'EV Charging Manager', line: 'Real-time control over every charging session.',      chips: ['C++17','React','REST'],                 treatment: 'gauge',    delay: 'd2' },
    ];

    const HEATMAP = [
      [0,0,0,0,0,0,3,0,0,3,2,2,0,0,1,1,3,1,2,3],
      [3,2,0,0,2,0,2,0,3,0,2,0,0,1,1,0,0,1,0,0],
      [0,1,0,0,1,0,0,3,0,0,3,0,1,3,3,0,1,2,0,2],
      [1,0,0,3,0,2,0,1,0,1,2,2,3,1,2,0,1,3,0,2],
      [0,0,3,1,0,0,2,2,0,0,0,2,0,0,1,1,0,3,1,0],
      [0,2,1,3,0,0,0,0,0,1,0,3,0,0,0,2,1,3,1,0],
      [1,2,1,1,3,1,0,2,1,0,2,1,0,0,1,1,1,2,0,2],
    ];
    const LEVEL_BG = ['rgba(255,255,255,.06)','rgba(185,28,26,.3)','rgba(185,28,26,.6)','rgba(214,90,60,.95)'];

    function buildHeatmap() {
      return `<div class="treat-panel">
        <div class="treat-row">
          <span class="treat-label">Contributions</span>
          <span class="treat-year">2025</span>
        </div>
        <div class="treat-stat-row">
          <span class="treat-big">2,847</span>
          <span class="treat-delta">+18%</span>
        </div>
        <div class="treat-heatmap" id="portHeatmap"></div>
      </div>`;
    }

    function buildWaveform() {
      const N = 34;
      const bars = [];
      for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        const bell = Math.exp(-Math.pow((t - 0.5) * 3.6, 2));
        const h = Math.max(8, Math.round(bell * 58 + 8 + (Math.random() - 0.5) * 8));
        const isRed = i % 3 === 0;
        const bg = isRed ? 'background:linear-gradient(to top,#861211,#d65a3c)' : 'background:rgba(255,255,255,.32)';
        const anim = reduce ? '' : `;animation:waveBar ${(0.9 + Math.random() * 0.7).toFixed(2)}s ease-in-out ${Math.round(Math.random() * 800)}ms infinite alternate`;
        bars.push(`<div class="treat-bar" style="height:${h}px;${bg}${anim}"></div>`);
      }
      return `<div class="treat-wave-wrap">
        <div class="treat-wave-glow"></div>
        <div class="treat-listening"><span class="treat-dot"></span>Listening</div>
        <div class="treat-bars">${bars.join('')}</div>
        <div class="treat-transcript">"open the dashboard"</div>
      </div>`;
    }

    function buildGauge() {
      const r = 42, sw = 8;
      const circ = +(2 * Math.PI * r).toFixed(2);
      const offset = +(circ * (1 - 0.78)).toFixed(2);
      return `<div class="treat-panel">
        <div class="treat-row">
          <span class="treat-label">Station load</span>
          <span class="treat-label"><span class="treat-active-dot">●</span> 12 active</span>
        </div>
        <div class="treat-gauge-row">
          <div class="treat-gauge-inner">
            <svg class="treat-gauge-svg" width="108" height="108" viewBox="0 0 108 108" fill="none">
              <circle cx="54" cy="54" r="${r}" stroke="rgba(255,255,255,.1)" stroke-width="${sw}" fill="none"/>
              <circle cx="54" cy="54" r="${r}" stroke="#d65a3c" stroke-width="${sw}" fill="none"
                stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${offset}"/>
            </svg>
            <div class="treat-gauge-label">
              <span class="treat-gauge-pct">78%</span>
              <span class="treat-gauge-sub">charged</span>
            </div>
          </div>
          <div class="treat-sessions">
            <div class="treat-session"><span class="treat-session-num">#1</span><div class="treat-track"><div class="treat-fill" style="width:90%"></div></div><span class="treat-kw">7.4kW</span></div>
            <div class="treat-session"><span class="treat-session-num">#2</span><div class="treat-track"><div class="treat-fill" style="width:62%"></div></div><span class="treat-kw">5.1kW</span></div>
            <div class="treat-session"><span class="treat-session-num">#3</span><div class="treat-track"><div class="treat-fill" style="width:78%"></div></div><span class="treat-kw">6.4kW</span></div>
          </div>
        </div>
      </div>`;
    }

    const treatments = { heatmap: buildHeatmap, waveform: buildWaveform, gauge: buildGauge };

    PROJECTS.forEach(p => {
      const chips = p.chips.map(c => `<span class="port-chip">${c}</span>`).join('');
      const card = document.createElement('div');
      card.className = `port-card reveal${p.delay ? ' ' + p.delay : ''}`;
      card.innerHTML = `
        <div class="port-treatment">${treatments[p.treatment]()}</div>
        <div class="port-veil"></div>
        <div class="port-top">
          <span class="port-num">${p.num}</span>
          <span class="port-tag">${p.tag}</span>
        </div>
        <div class="port-bottom">
          <div class="port-title">${p.title}</div>
          <div class="port-line">${p.line}</div>
          <div class="port-chips">${chips}</div>
        </div>`;
      grid.appendChild(card);
      io.observe(card);
    });

    const heatmapEl = document.getElementById('portHeatmap');
    if (heatmapEl) {
      HEATMAP.flat().forEach(l => {
        const cell = document.createElement('div');
        cell.className = 'treat-cell';
        cell.style.background = LEVEL_BG[l];
        heatmapEl.appendChild(cell);
      });
    }
  })();
