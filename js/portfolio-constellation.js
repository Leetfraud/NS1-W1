/* ============================================================================
 * NexioSol — Portfolio Constellation
 * Adapted from portfolio-constellation.reference.js (v4)
 * Single source: PROJECTS drives both the constellation and .port-page-grid.
 * Desktop (≥961px, no-touch) shows the map; mobile shows the card grid.
 * Deck reuses .modal-overlay / .modal-card — does not fork the booking modal.
 * ========================================================================== */
(function () {
  'use strict';

  const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Service types ─────────────────────────────────────────────────────── */
  const TYPES = {
    software: { label: 'Software & Cloud', glyphs: ' .·:-=+*#',  hue: [205, 45, 34] },
    ai:       { label: 'AI & Automation',  glyphs: ' .,:;!=≡#',  hue: [215, 60, 42] },
    systems:  { label: 'Web3 & Systems',   glyphs: ' .·°*+×#',   hue: [175, 32, 30] },
    refactor: { label: 'Refactor & Grow',  glyphs: ' ·~–=≈→#',   hue: [150, 28, 30] },
  };
  const ORDER = ['software', 'ai', 'systems', 'refactor'];
  /* Full-catalogue: always get a wedge, even at 0 projects */
  const ALWAYS_SHOW = new Set(['software', 'ai', 'systems', 'refactor']);

  const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  /* ── Single source of project data ────────────────────────────────────── */
  const PROJECTS = [
    { num: '01', cat: 'software', tag: 'Web Platform',        title: 'DevProfile Analyzer',  desc: 'GitHub portfolio intelligence — contribution patterns, language breakdowns, side-by-side profile comparisons.', stack: ['React', 'Vite', 'Tailwind', 'GitHub API'] },
    { num: '04', cat: 'software', tag: 'Studio Web',          title: 'NexioSol Studio Site', desc: 'Dark editorial studio presence with a live ASCII render hero and a database-wired lead funnel.',              stack: ['HTML', 'Vercel', 'MongoDB'] },
    { num: '02', cat: 'ai',       tag: 'AI Desktop Agent',    title: 'Tabby',                desc: 'Offline-first desktop assistant pairing Whisper transcription, intent classification and gesture control.',      stack: ['Python', 'Whisper', 'Vision'] },
    { num: '05', cat: 'ai',       tag: 'Data Platform',       title: 'Project Five',         desc: 'Placeholder slot — your fifth AI project drops in here with three mockups and a one-line framing.',           stack: ['TBD', 'TBD'] },
    { num: '03', cat: 'systems',  tag: 'Systems Engineering', title: 'EV Charging Manager',  desc: 'Station management with a high-performance C++17 backend and a reactive real-time load dashboard.',            stack: ['C++17', 'React', 'REST'] },
    { num: '06', cat: 'systems',  tag: 'Systems',             title: 'Project Six',          desc: 'Placeholder slot — your sixth systems project drops in here with three mockups and a one-line framing.',      stack: ['TBD', 'TBD'] },
    { num: '07', cat: 'refactor', tag: 'Modernization',       title: 'Legacy Rebuild',       desc: 'A refactor / scale engagement — modernising an existing system and growing it under real load.',              stack: ['TBD'] },
  ];

  /* ── Desktop detection ─────────────────────────────────────────────────── */
  const isDesktop = () =>
    window.matchMedia('(min-width: 961px)').matches &&
    !('ontouchstart' in window) &&
    !(navigator.maxTouchPoints > 0);

  /* ── Grid card builder (both surfaces share this) ─────────────────────── */
  function buildGrid() {
    const grid = document.getElementById('portPageGrid');
    if (!grid) return;
    PROJECTS.forEach((p, i) => {
      const chips = p.stack.map(s => `<span class="port-chip">${s}</span>`).join('');
      const card = document.createElement('div');
      card.className = 'port-card reveal visible';
      card.dataset.cat = p.cat;
      card.dataset.index = String(i);
      card.style.cursor = 'pointer';
      card.innerHTML =
        `<span class="port-num">${p.num}</span>` +
        `<div class="port-tag">${p.tag}</div>` +
        `<h3 class="port-title">${p.title}</h3>` +
        `<p class="port-desc">${p.desc}</p>` +
        `<div class="port-stack">${chips}</div>`;
      card.addEventListener('click', () => openDeck(i));
      grid.appendChild(card);
    });
  }

  /* ── Filter (drives both grid and constellation) ───────────────────────── */
  let activeFilter = 'all';
  const filterBar = document.getElementById('filterBar');

  function applyFilter(k) {
    activeFilter = k;
    if (filterBar) {
      filterBar.querySelectorAll('.filter-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.filter === k));
    }
    document.querySelectorAll('#portPageGrid .port-card').forEach(card => {
      card.classList.toggle('hide', k !== 'all' && card.dataset.cat !== k);
    });
    document.querySelectorAll('.nodeG').forEach(g => {
      const show = k === 'all' || g.dataset.type === k;
      g.style.transition = 'opacity .4s cubic-bezier(.22,.61,.36,1)';
      g.style.opacity = show ? '1' : '0.1';
      g.style.pointerEvents = show ? 'auto' : 'none';
    });
    document.querySelectorAll('.wedge').forEach(w => {
      const on = k === 'all' || w.dataset.type === k;
      w.setAttribute('fill', on
        ? (k === 'all' ? 'rgba(134,18,17,0.04)' : 'rgba(134,18,17,0.10)')
        : 'rgba(134,18,17,0.01)');
      w.setAttribute('stroke', on ? 'rgba(224,81,79,0.18)' : 'rgba(224,81,79,0.04)');
    });
    document.querySelectorAll('.sectorLabel').forEach(l => {
      l.setAttribute('fill', (k === 'all' || l.dataset.type === k)
        ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.18)');
    });
  }

  if (filterBar) {
    filterBar.querySelectorAll('.filter-btn').forEach(btn =>
      btn.addEventListener('click', () => applyFilter(btn.dataset.filter)));
  }

  /* ── Deck (reuses .modal-overlay / .modal-card.deck-card) ─────────────── */
  const deckOverlay = document.getElementById('deckOverlay');
  const deckCard    = deckOverlay && deckOverlay.querySelector('.deck-card');
  let _lastFocus = null;
  let _curSlide  = 0;
  let _setSlide  = null;   // set by renderDeckContent so keydown can call it

  function renderDeckContent(idx) {
    const p    = PROJECTS[idx];
    const slug = slugify(p.title);

    const stackChips = p.stack.map(s =>
      `<span class="deck-chip">${s}</span>`).join('');

    deckCard.innerHTML =
      `<button class="modal-close deck-close" id="deckCloseBtn" aria-label="Close project deck">✕</button>` +
      `<div class="deck-slide-viewport">` +
        `<div id="deckSlideStage"></div>` +
        `<button class="deck-nav-btn deck-prev" id="deckPrev" aria-label="Previous mockup">‹</button>` +
        `<button class="deck-nav-btn deck-next" id="deckNext" aria-label="Next mockup">›</button>` +
        `<div id="deckDots" class="deck-dots"></div>` +
      `</div>` +
      `<div class="deck-body">` +
        `<div class="deck-meta">` +
          `<span class="deck-num">${p.num}</span>` +
          `<span class="deck-type-badge">${TYPES[p.cat].label}</span>` +
          `<span class="deck-tag">${p.tag}</span>` +
        `</div>` +
        `<h3 class="deck-title">${p.title}</h3>` +
        `<p class="deck-desc">${p.desc}</p>` +
        `<div class="deck-chips">${stackChips}</div>` +
      `</div>`;

    function setSlide(n) {
      _curSlide = n;
      const s = document.getElementById('deckSlideStage');
      s.innerHTML =
        `<picture>` +
          `<source srcset="assets/mockups/${slug}-${n + 1}.avif" type="image/avif">` +
          `<source srcset="assets/mockups/${slug}-${n + 1}.webp" type="image/webp">` +
          `<img src="assets/mockups/${slug}-${n + 1}.svg" loading="lazy"` +
               ` alt="${p.title} mockup ${n + 1} of 3"` +
               ` style="width:100%;height:100%;object-fit:cover;display:block;">` +
        `</picture>`;
      const dots = document.getElementById('deckDots');
      dots.innerHTML = '';
      for (let i = 0; i < 3; i++) {
        const d = document.createElement('button');
        d.className = 'deck-dot' + (i === n ? ' active' : '');
        d.setAttribute('aria-label', `View mockup ${i + 1}`);
        const idx2 = i;
        d.addEventListener('click', () => setSlide(idx2));
        dots.appendChild(d);
      }
    }

    _setSlide = setSlide;
    setSlide(0);

    document.getElementById('deckCloseBtn').addEventListener('click', closeDeck);
    document.getElementById('deckPrev').addEventListener('click', () => _setSlide((_curSlide + 2) % 3));
    document.getElementById('deckNext').addEventListener('click', () => _setSlide((_curSlide + 1) % 3));
  }

  function openDeck(i) {
    if (!deckOverlay || !deckCard) return;
    _lastFocus = document.activeElement;
    renderDeckContent(i);
    deckOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    const cb = document.getElementById('deckCloseBtn');
    if (cb) cb.focus();
  }

  function closeDeck() {
    if (!deckOverlay) return;
    deckOverlay.classList.remove('open');
    document.body.style.overflow = '';
    if (_lastFocus) _lastFocus.focus();
  }

  document.addEventListener('keydown', e => {
    if (!deckOverlay || !deckOverlay.classList.contains('open')) return;
    if (e.key === 'Escape')      { e.preventDefault(); closeDeck(); }
    else if (e.key === 'ArrowLeft')  { e.preventDefault(); if (_setSlide) _setSlide((_curSlide + 2) % 3); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); if (_setSlide) _setSlide((_curSlide + 1) % 3); }
  });

  if (deckOverlay) {
    deckOverlay.addEventListener('click', e => { if (e.target === deckOverlay) closeDeck(); });
  }

  /* Expose globally so grid cards (on mobile) can open the same deck */
  window.NexioDeck = { open: openDeck, close: closeDeck };

  /* ── Mobile path: build grid only, done ───────────────────────────────── */
  buildGrid();

  if (!isDesktop()) return;

  /* ── Desktop path: show map, hide grid ────────────────────────────────── */
  const mapWrap     = document.getElementById('mapWrap');
  const portGrid    = document.getElementById('portPageGrid');
  const moreNote    = document.getElementById('portMoreNote');
  if (mapWrap)   mapWrap.style.display   = 'block';
  if (portGrid)  portGrid.style.display  = 'none';
  if (moreNote)  moreNote.style.display  = 'none';

  /* ── Geometry (identical to reference v4) ─────────────────────────────── */
  const W = 680, H = 510;
  const CX = W / 2, CY = H / 2 + 16;
  const R  = Math.min(W, H) * 0.33;

  function layout() {
    const used = ORDER.filter(t =>
      PROJECTS.some(p => p.cat === t) || ALWAYS_SHOW.has(t));
    const n          = used.length;
    const sectorSpan = (Math.PI * 2) / n;
    const gap        = 0.18;
    const placed     = [];
    const sectorMeta = [];

    used.forEach((type, si) => {
      const inType = PROJECTS.filter(p => p.cat === type);
      const start  = -Math.PI / 2 + si * sectorSpan + (gap / 2) * sectorSpan;
      const end    = -Math.PI / 2 + (si + 1) * sectorSpan - (gap / 2) * sectorSpan;
      const mid    = (start + end) / 2;
      sectorMeta.push({ type, start, end, mid, count: inType.length });
      inType.forEach((p, k) => {
        const f   = inType.length === 1 ? 0.5 : k / (inType.length - 1);
        const ang = start + f * (end - start);
        const rr  = inType.length > 1 ? R * (k % 2 === 0 ? 1 : 0.82) : R * 0.92;
        placed.push({ ...p, ang, x: CX + Math.cos(ang) * rr, y: CY + Math.sin(ang) * rr });
      });
    });
    return { nodes: placed, sectors: sectorMeta };
  }

  const { nodes, sectors } = layout();
  const NS = 'http://www.w3.org/2000/svg';
  let hovered = -1;

  /* ── SVG: Wedges ─────────────────────────────────────────────────────── */
  const sectorsG = document.getElementById('sectors');
  if (sectorsG) {
    sectors.forEach(s => {
      const r0 = 44, r1 = R * 1.18;
      const ax0 = CX + Math.cos(s.start) * r0, ay0 = CY + Math.sin(s.start) * r0;
      const ax1 = CX + Math.cos(s.start) * r1, ay1 = CY + Math.sin(s.start) * r1;
      const bx0 = CX + Math.cos(s.end)   * r0, by0 = CY + Math.sin(s.end)   * r0;
      const bx1 = CX + Math.cos(s.end)   * r1, by1 = CY + Math.sin(s.end)   * r1;
      const large = (s.end - s.start) > Math.PI ? 1 : 0;

      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d',
        `M${ax0},${ay0} L${ax1},${ay1} A${r1},${r1} 0 ${large} 1 ${bx1},${by1} ` +
        `L${bx0},${by0} A${r0},${r0} 0 ${large} 0 ${ax0},${ay0} Z`);
      path.setAttribute('fill', 'rgba(134,18,17,0.04)');
      path.setAttribute('stroke', 'rgba(224,81,79,0.10)');
      path.setAttribute('stroke-width', '1');
      path.dataset.type = s.type;
      path.classList.add('wedge');
      sectorsG.appendChild(path);

      const lr = R * 1.30;
      const tx = document.createElementNS(NS, 'text');
      tx.setAttribute('x', CX + Math.cos(s.mid) * lr);
      tx.setAttribute('y', CY + Math.sin(s.mid) * lr);
      tx.setAttribute('text-anchor', 'middle');
      tx.setAttribute('font-family', "'JetBrains Mono',monospace");
      tx.setAttribute('font-size', '8.5');
      tx.setAttribute('letter-spacing', '0.08em');
      tx.setAttribute('fill', 'rgba(255,255,255,0.5)');
      tx.dataset.type = s.type;
      tx.classList.add('sectorLabel');
      tx.textContent = TYPES[s.type].label.toUpperCase();
      sectorsG.appendChild(tx);
    });
  }

  /* ── SVG: Orbit guides ───────────────────────────────────────────────── */
  const orbitsG = document.getElementById('orbits');
  if (orbitsG) {
    [0.82, 1].forEach(f => {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', CX); c.setAttribute('cy', CY); c.setAttribute('r', R * f);
      c.setAttribute('fill', 'none');
      c.setAttribute('stroke', 'rgba(255,255,255,0.05)');
      c.setAttribute('stroke-width', '1');
      c.setAttribute('stroke-dasharray', '2 6');
      orbitsG.appendChild(c);
    });
  }

  /* ── SVG: Core ───────────────────────────────────────────────────────── */
  const nodesG = document.getElementById('nodes');
  if (nodesG) {
    const coreG = document.createElementNS(NS, 'g');
    coreG.setAttribute('transform', `translate(${CX},${CY})`);
    coreG.innerHTML =
      '<circle r="34" fill="rgba(134,18,17,0.12)" stroke="rgba(224,81,79,0.5)" stroke-width="1"></circle>' +
      '<circle r="22" fill="#0c0c0b" stroke="#861211" stroke-width="1.2"></circle>' +
      '<text y="-1" text-anchor="middle" font-family="\'DM Serif Display\',serif" font-size="15" fill="#fff">N<tspan fill="#e0514f">S</tspan></text>' +
      '<text y="12" text-anchor="middle" font-family="\'JetBrains Mono\',monospace" font-size="6.5" fill="rgba(255,255,255,0.4)" letter-spacing="1">CORE</text>';
    nodesG.appendChild(coreG);

    /* ── SVG: Nodes ────────────────────────────────────────────────────── */
    nodes.forEach((n, i) => {
      const g = document.createElementNS(NS, 'g');
      g.style.cursor = 'pointer';
      g.dataset.type = n.cat;
      g.classList.add('nodeG');
      g.setAttribute('role', 'button');
      g.setAttribute('tabindex', '0');
      g.setAttribute('aria-label', `${n.title} — ${TYPES[n.cat].label}. Open project deck.`);

      const above = n.y < CY;
      const ly1   = above ? n.y - 26 : n.y + 30;
      const ly2   = above ? n.y - 12 : n.y + 44;

      g.innerHTML =
        `<circle cx="${n.x}" cy="${n.y}" r="15" fill="#0c0c0b" stroke="#e0514f" stroke-width="1.1" class="ring"></circle>` +
        `<circle cx="${n.x}" cy="${n.y}" r="4"  fill="#e0514f" class="dot"></circle>` +
        `<text x="${n.x}" y="${n.y + 3}" text-anchor="middle" font-family="'JetBrains Mono',monospace" font-size="8.5" fill="#e0514f" style="pointer-events:none;">${n.num}</text>` +
        `<text x="${n.x}" y="${ly1}" text-anchor="middle" font-family="'DM Serif Display',serif" font-size="13" fill="#fff" class="lbl" style="pointer-events:none;">${n.title}</text>` +
        `<text x="${n.x}" y="${ly2}" text-anchor="middle" font-family="'JetBrains Mono',monospace" font-size="8" fill="rgba(255,255,255,0.45)" letter-spacing="0.04em" style="pointer-events:none;">${n.tag}</text>`;

      const enter = () => {
        hovered = i;
        g.querySelector('.ring').setAttribute('r', '19');
        g.querySelector('.ring').setAttribute('fill', 'rgba(134,18,17,0.25)');
        g.querySelector('.dot').setAttribute('r', '5');
      };
      const leave = () => {
        hovered = -1;
        g.querySelector('.ring').setAttribute('r', '15');
        g.querySelector('.ring').setAttribute('fill', '#0c0c0b');
        g.querySelector('.dot').setAttribute('r', '4');
      };
      g.addEventListener('mouseenter', enter);
      g.addEventListener('mouseleave', leave);
      g.addEventListener('focus', enter);
      g.addEventListener('blur', leave);
      g.addEventListener('click', () => openDeck(i));
      g.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDeck(i); }
      });
      nodesG.appendChild(g);
    });
  }

  /* ── Canvas: ASCII branches ──────────────────────────────────────────── */
  const canvas = document.getElementById('asciiBranches');
  if (!canvas) return;
  const ctx2 = canvas.getContext('2d');
  const dpr  = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    const rect = canvas.getBoundingClientRect();
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
    ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
    canvas._w = rect.width;
    canvas._h = rect.height;
  }

  let t = 0;
  function frame() {
    const w = canvas._w || 680, h = canvas._h || 510;
    const sx = w / W, sy = h / H;
    ctx2.clearRect(0, 0, w, h);
    ctx2.textAlign    = 'center';
    ctx2.textBaseline = 'middle';

    nodes.forEach((n, i) => {
      const dimByFilter = !(activeFilter === 'all' || n.cat === activeFilter);
      const active = (hovered === -1 || hovered === i) && !dimByFilter;
      const G = TYPES[n.cat].glyphs, hue = TYPES[n.cat].hue;
      const steps = 23;
      const mx = (CX + n.x) / 2, my = (CY + n.y) / 2;
      const dx = n.x - CX, dy = n.y - CY;
      const px = -dy, py = dx, plen = Math.hypot(px, py) || 1;
      const bend = 15 * Math.sin(t * 0.5 + i);
      const cxp = mx + (px / plen) * bend, cyp = my + (py / plen) * bend;

      for (let s = 1; s < steps; s++) {
        const u  = s / steps;
        const bx = (1-u)*(1-u)*CX + 2*(1-u)*u*cxp + u*u*n.x;
        const by = (1-u)*(1-u)*CY + 2*(1-u)*u*cyp + u*u*n.y;
        const dens    = (1 - u) * 0.8 + 0.2;
        const shimmer = (Math.sin(t * 2 + s * 0.7 + i * 1.3) + 1) / 2;
        let gi = Math.floor((dens * 0.7 + shimmer * 0.4) * (G.length - 1));
        gi = Math.max(0, Math.min(G.length - 1, gi));
        const baseA = dimByFilter ? 0.05 : (active ? 0.82 : 0.15);
        const alpha = baseA * (0.4 + dens * 0.6);
        const size  = (active ? 10 : 8.5) * (0.7 + dens * 0.5);
        ctx2.font = size + 'px "JetBrains Mono", monospace';
        const r  = Math.floor(hue[0] + dens * 55);
        const gg = Math.floor(hue[1] + shimmer * 25);
        const bb = hue[2];
        ctx2.fillStyle = `rgba(${r},${gg},${bb},${alpha})`;
        ctx2.fillText(G[gi], bx * sx, by * sy);
      }
    });

    t += 0.016;
    if (!REDUCE) requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener('resize', resize);
  frame();

})();
