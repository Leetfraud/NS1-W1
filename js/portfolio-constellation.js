/* ============================================================================
 * NexioSol — Portfolio Constellation
 * Adapted from portfolio-constellation.reference.js (v4)
 * Single source: PROJECTS drives both the constellation and .port-page-grid.
 * Gate: ≥961px + hover:hover + pointer:fine → map. Coarse-pointer → grid.
 * Deck reuses .modal-overlay / .modal-card — does not fork the booking modal.
 * ========================================================================== */
(function () {
  'use strict';

  const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Service types ─────────────────────────────────────────────────────── */
  const TYPES = {
    software: { label: 'Software Development', glyphs: ' .·:-=+*#',  hue: [205, 45, 34] },
    crm:      { label: 'CRM Solutions',        glyphs: ' ·~–=≈→#',   hue: [150, 28, 30] },
    ai:       { label: 'AI & Automation',      glyphs: ' .,:;!=≡#',  hue: [215, 60, 42] },
  };
  const ORDER = ['software', 'crm', 'ai'];
  /* Full-catalogue: always get a wedge, even at 0 projects */
  const ALWAYS_SHOW = new Set(['software', 'crm', 'ai']);

  const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  /* How many mockups a project ships. `screens` wins, then the length of
     `exts`, then the 3-slide default — so a project with 2 or 4 screenshots
     needs no code change, just the right number of files on disk. */
  const DEFAULT_SLIDES = 3;
  const slideCount = p => p.screens || (p.exts && p.exts.length) || DEFAULT_SLIDES;
  const mockupSrc = (p, i) => p.mockups
    ? `assets/mockups/${p.mockups[i]}`
    : `assets/mockups/${slugify(p.title)}-${i + 1}.${(p.exts && p.exts[i]) || 'webp'}`;

  /* ── Single source of project data ────────────────────────────────────── */
  const PROJECTS = [
    { num: '01', cat: 'ai',       tag: 'AI Desktop Agent',    title: 'Tabby',                desc: 'Offline-first desktop assistant pairing Whisper transcription, intent classification and gesture control.',      stack: ['Python', 'Whisper', 'Vision'], problem: 'Cloud voice assistants leak data and stop working the moment they go offline.', solution: 'An offline-first desktop agent combining local Whisper transcription, intent classification and gesture control.' },
    { num: '03', cat: 'software', tag: 'Mobile · PropTech / AI', title: 'Auri', desc: 'A concierge for your entire property portfolio — role-aware dashboards for Owner, Manager and Vendor, with an embedded AI assistant answering through interactive widgets.', stack: ['React Native', 'NestJS', 'PostgreSQL', 'Stripe Connect'], layout: 'mobile', screens: 3, problem: 'Owners, managers and vendors work from disconnected tools with no shared source of truth.', solution: 'Role-aware dashboards backed by an embedded AI assistant that answers through interactive widgets.' },
    { num: '02', cat: 'software', tag: 'Web3 · Tokenized RWA · Concept', title: 'Anchorpoint', desc: 'A tokenization platform that turns real estate, private credit and commodities into fractional on-chain shares investors can buy, trade and earn distributions from.', stack: ['Polygon', 'ERC-3643', 'Solidity', 'Smart Contracts', 'KYC / AML', 'Fiat On-Ramp'], problem: 'Real-world assets lock capital into whole units, so smaller investors cannot take a position and owners cannot release value without a full sale.', solution: 'Each asset is wrapped in an SPV and issued as a compliance-aware token, with transfer restrictions, KYC gating and smart-contract distributions governing who can hold it and how income is paid out.' },
    { num: '04', cat: 'crm',      tag: 'Custom CRM · Outreach', title: 'Exodus', desc: 'A role-based CRM for email and LinkedIn outreach, refactored around the team’s actual workflow, from prospect capture to close.', stack: ['React', 'Tailwind CSS', 'Vite', 'Supabase', 'Vercel', 'Zapier', 'Stripe', 'Inngest', 'Clerk'], problem: 'The existing outreach tooling did not match how the team actually worked, so email and LinkedIn pipelines sprawled into spreadsheets with no visibility.', solution: 'We refactored the CRM to follow that workflow end to end, tracking every prospect from first touch to close in one role-based pipeline.' },
    { num: '07', cat: 'crm',      tag: 'Custom CRM · Real Estate', title: 'Meridian', desc: 'A sales and recovery platform for Meridian Heights, covering apartment inventory, customer records, bookings, payments and installment tracking.', stack: ['React', 'Tailwind CSS', 'Vite'], mockups: ['Meridian-1.webp', 'Meridian-2.webp', 'Meridian-3.webp'], problem: 'Real-estate sales teams need a clear operating layer for units, buyers, bookings and payment recovery without bouncing between spreadsheets.', solution: 'A centralized dashboard brings inventory, customer data, transactions, installments, reports and audit history into one role-ready workspace.' },
    { num: '05', cat: 'ai',       tag: 'Mobile · Fitness / AI', title: 'Fittish', desc: 'A fitness app built around a coach that knows you — activity rings, workouts and meal logs feed an assistant that answers in the context of your own numbers.', stack: ['React Native', 'Expo', 'NestJS', 'PostgreSQL', 'Claude API', 'HealthKit', 'Google Fit'], layout: 'mobile', screens: 3, problem: 'Fitness apps log everything and explain nothing — rings close, numbers pile up, and the user is still left to work out what to do next.', solution: 'Activity, training and meal data feed an in-app coach that answers in the context of their own numbers, with progress, records and streaks closing the loop.' },
    { num: '06', cat: 'ai',       tag: 'Mobile · Enterprise AI', title: 'PowerRay', desc: 'An enterprise AI knowledge platform for secure document search, workflow automation, role-aware access and real-time operational insight.', stack: ['Next.js', 'TypeScript', 'NestJS', 'PostgreSQL', 'OpenAI API', 'LangChain', 'Pinecone', 'AWS'], layout: 'mobile', mockups: ['PowerRay-2.webp', 'PowerRay-3.webp', 'PowerRay-4.webp'], problem: 'Enterprise knowledge is scattered across tools, documents and teams, making it slow to find trusted answers or coordinate internal workflows.', solution: 'A unified AI workspace centralizes company resources, adds natural-language search and summaries, and pairs role-based access with analytics and integrations.' },
    { num: '08', cat: 'ai',       tag: 'Mobile · Wellness / AI', title: 'Traino', desc: 'An AI fitness platform where the agent is the interface. Users talk to a coach instead of navigating menus, while plans, tracking and analytics run underneath.', stack: ['React Native', 'Expo', 'TypeScript', 'Node.js', 'PostgreSQL', 'Prisma', 'FastAPI', 'AWS'], layout: 'mobile', screens: 3, problem: 'Fitness apps bury the user in tabs, charts and settings, so operating the app competes with the training it is meant to support.', solution: 'The AI agent becomes the entire interface. Users state a goal or log a session in plain language while the backend handles plan generation, progress tracking and analytics out of sight.' },
    { num: '09', cat: 'software', tag: 'Fundraising Platform', title: 'Founders & Funders', desc: 'A fundraising workspace connecting founders with investors, funding opportunities and the documents that move a raise forward.', stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Node.js', 'PostgreSQL', 'Prisma', 'Redis', 'AWS'], problem: 'Founders chase investors across scattered inboxes and spreadsheets, with no single view of where a raise actually stands.', solution: 'Structured venture profiles, investor matching and pitch-deck management run the whole raise from one dashboard, with role-based access for both sides.' },
  ];

  /* ── Desktop gate: interaction model, not touch capability ───────────────
   * hover:hover + pointer:fine = trackpad/mouse device (touchscreen laptops
   * included). pointer:coarse = phone/tablet → grid fallback.
   * ────────────────────────────────────────────────────────────────────── */
  const useConstellation =
    window.matchMedia('(min-width: 961px)').matches &&
    window.matchMedia('(hover: hover)').matches &&
    window.matchMedia('(pointer: fine)').matches;
  if (!useConstellation)
    console.warn('[constellation] skipped — not a wide hover+fine-pointer screen');

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
    const p        = PROJECTS[idx];
    const isMobile = p.layout === 'mobile';

    deckCard.classList.toggle('deck-card--mobile', isMobile);

    const stackChips = p.stack.map(s =>
      `<span class="deck-chip">${s}</span>`).join('');

    const stageInner =
      `<div id="deckSlideStage"></div>` +
      `<button class="deck-nav-btn deck-prev" id="deckPrev" aria-label="Previous mockup">‹</button>` +
      `<button class="deck-nav-btn deck-next" id="deckNext" aria-label="Next mockup">›</button>`;
    const dotsHTML = `<div id="deckDots" class="deck-dots"></div>`;

    // Mobile: dots sit below the phone as their own grid cell, not overlaid
    // on the stage — desktop keeps dots overlaid inside the viewport as before.
    const stageHTML = isMobile
      ? `<div class="deck-slide-viewport">${stageInner}</div>`
      : `<div class="deck-slide-viewport">${stageInner}${dotsHTML}</div>`;

    const bodyHTML =
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

    deckCard.innerHTML =
      `<button class="modal-close deck-close" id="deckCloseBtn" aria-label="Close project deck">✕</button>` +
      (isMobile ? (bodyHTML + stageHTML + dotsHTML) : (stageHTML + bodyHTML));

    const count = slideCount(p);

    // Wraps internally, so callers pass a raw ±1 and never need the count.
    function setSlide(n) {
      const cur = ((n % count) + count) % count;
      _curSlide = cur;
      const src = mockupSrc(p, cur);
      const s = document.getElementById('deckSlideStage');
      s.innerHTML =
        `<img class="deck-slide-bg" src="${src}" alt="" aria-hidden="true">` +
        `<img class="deck-slide-img" src="${src}" decoding="async"` +
             ` alt="${p.title} mockup ${cur + 1} of ${count}">`;
      const dots = document.getElementById('deckDots');
      dots.innerHTML = '';
      dots.classList.toggle('is-hidden', count < 2);
      for (let i = 0; i < count; i++) {
        const d = document.createElement('button');
        d.className = 'deck-dot' + (i === cur ? ' active' : '');
        d.setAttribute('aria-label', `View mockup ${i + 1}`);
        d.addEventListener('click', () => setSlide(i));
        dots.appendChild(d);
      }
    }

    _setSlide = setSlide;
    setSlide(0);

    document.getElementById('deckCloseBtn').addEventListener('click', closeDeck);
    document.getElementById('deckPrev').addEventListener('click', () => _setSlide(_curSlide - 1));
    document.getElementById('deckNext').addEventListener('click', () => _setSlide(_curSlide + 1));
  }

  /* ── Focus trap ──────────────────────────────────────────────────────────
   * While the deck is open, Tab cycles only through the deck's own controls
   * (close, prev, next, dot buttons). Released on close.
   * ────────────────────────────────────────────────────────────────────── */
  let _trapHandler = null;

  function getFocusable() {
    return [...deckCard.querySelectorAll(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )].filter(el => !el.closest('[hidden]') && el.offsetParent !== null);
  }

  function attachFocusTrap() {
    _trapHandler = e => {
      if (e.key !== 'Tab') return;
      const els = getFocusable();
      if (!els.length) { e.preventDefault(); return; }
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', _trapHandler);
  }

  function detachFocusTrap() {
    if (_trapHandler) {
      document.removeEventListener('keydown', _trapHandler);
      _trapHandler = null;
    }
  }

  function openDeck(i) {
    if (!deckOverlay || !deckCard) return;
    _lastFocus = document.activeElement;
    renderDeckContent(i);
    deckOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    attachFocusTrap();
    const cb = document.getElementById('deckCloseBtn');
    if (cb) cb.focus();
  }

  function closeDeck() {
    if (!deckOverlay) return;
    detachFocusTrap();
    deckOverlay.classList.remove('open');
    document.body.style.overflow = '';
    if (_lastFocus) _lastFocus.focus();
  }

  document.addEventListener('keydown', e => {
    if (!deckOverlay || !deckOverlay.classList.contains('open')) return;
    if (e.key === 'Escape')      { e.preventDefault(); closeDeck(); }
    else if (e.key === 'ArrowLeft')  { e.preventDefault(); if (_setSlide) _setSlide(_curSlide - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); if (_setSlide) _setSlide(_curSlide + 1); }
  });

  if (deckOverlay) {
    deckOverlay.addEventListener('click', e => {
      if (e.target === deckOverlay) closeDeck();
    });
  }

  /* Expose globally so grid cards (on mobile) can open the same deck */
  window.NexioDeck = { open: openDeck, close: closeDeck };

  /* ── Mobile / coarse-pointer path: build grid only, done ─────────────── */
  buildGrid();

  if (!useConstellation) return;

  /* ── Desktop path: show map, hide grid ────────────────────────────────── */
  const mapWrap     = document.getElementById('mapWrap');
  const portGrid    = document.getElementById('portPageGrid');
  const moreNote    = document.getElementById('portMoreNote');
  if (mapWrap)   mapWrap.style.display   = 'block';
  if (portGrid)  portGrid.style.display  = 'none';
  if (moreNote)  moreNote.style.display  = 'none';

  /* ── Geometry (identical to reference v4) ─────────────────────────────── */
  const W = 1200, H = 720;
  const CX = W / 2, CY = H / 2 + 16;
  const R  = H * 0.38;

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
        placed.push({ ...p, ang, x: CX + Math.cos(ang) * rr, y: CY + Math.sin(ang) * rr, _pIdx: PROJECTS.indexOf(p) });
      });
    });
    return { nodes: placed, sectors: sectorMeta };
  }

  const { nodes, sectors } = layout();
  const NS = 'http://www.w3.org/2000/svg';
  let hovered = -1;

  /* ── Project panel (constellation path only) ──────────────────────────── */
  const stageEl   = document.getElementById('portStage');
  const panelEl   = document.getElementById('projPanel');
  const scrimEl   = document.getElementById('panelScrim');
  const beaconEl  = document.getElementById('beacon');
  const beaconNum = document.getElementById('beaconNum');
  const pnlStage  = document.getElementById('pnlStage');
  const pnlDots   = document.getElementById('pnlDots');
  const pnlTech   = document.getElementById('pnlTech');
  const pnlBody   = document.getElementById('pnlBody');

  let _pCur = 0, _pLastFocus = null, _pNode = null, _pTrap = null;
  let _pSlides = DEFAULT_SLIDES;  // slide count for the open project (1 if grouped)

  function placeBeacon(n) {
    const svg  = document.getElementById('overSvg');
    const rect = svg.getBoundingClientRect();
    beaconEl.style.left = (n.x * (rect.width  / W)) + 'px';
    beaconEl.style.top  = (n.y * (rect.height / H)) + 'px';
    beaconNum.textContent = n.num;
  }

  /* ── Mockup preloading ──────────────────────────────────────────────────
     Panel images used to be requested on click, so they landed after the
     slide-in had finished. Warm the cache ahead of the click instead: the
     project's first frame on hover/focus, and every project's first frame
     once the page goes idle. A mobile project shows all its phones at once,
     so its whole set is the "first frame". */
  const _preloaded = new Set();
  const firstFrameCount = p => p.layout === 'mobile' ? slideCount(p) : 1;

  function preloadMockups(p) {
    for (let i = 0; i < firstFrameCount(p); i++) {
      const src = mockupSrc(p, i);
      if (_preloaded.has(src)) continue;
      _preloaded.add(src);
      new Image().src = src;
    }
  }

  // Skip the idle sweep on Data Saver; hover still preloads the one project.
  if (!(navigator.connection && navigator.connection.saveData)) {
    const idle = window.requestIdleCallback || (cb => setTimeout(cb, 300));
    const sweep = () => idle(() => PROJECTS.forEach(preloadMockups));
    if (document.readyState === 'complete') sweep();
    else window.addEventListener('load', sweep, { once: true });
  }

  /* Fade each image in once it has arrived (.is-loaded), and hold the stage's
     shimmer until the first frame is in. `_pRender` drops callbacks from a
     project the user already closed or switched away from. */
  let _pRender = 0;
  function trackLoad(img, onSettle) {
    const done = ok => { if (ok) img.classList.add('is-loaded'); if (onSettle) onSettle(); };
    if (img.complete) { done(img.naturalWidth > 0); return; }
    img.addEventListener('load',  () => done(true),  { once: true });
    img.addEventListener('error', () => done(false), { once: true });
  }

  function renderPanel(idx) {
    const p = PROJECTS[idx];
    const isGroup = p.layout === 'mobile';   // one slide, phones side by side
    const token = ++_pRender;

    pnlStage.classList.toggle('is-group', isGroup);
    pnlStage.classList.add('is-loading');
    pnlStage.innerHTML = '';
    _pSlides = isGroup ? 1 : slideCount(p);

    let pending = firstFrameCount(p);
    const firstFrameSettled = () => {
      if (token === _pRender && --pending === 0) pnlStage.classList.remove('is-loading');
    };

    if (isGroup) {
      // Single static frame — all phones visible at once, no carousel.
      const n = slideCount(p);
      const group = document.createElement('div');
      group.className = 'phone-group';
      for (let i = 0; i < n; i++) {
        const cell = document.createElement('div');
        cell.className = 'phone';
        const img = document.createElement('img');
        img.decoding = 'async';   // keep decode off the transition's frames
        img.src = mockupSrc(p, i);
        img.alt = `${p.title} — screen ${i + 1} of ${n}`;
        // No loading="lazy" here: all n phones are on screen at once, and the
        // panel is still parked off-stage when they're built — deferring them
        // just means they pop in after the slide finishes.
        trackLoad(img, firstFrameSettled);
        cell.appendChild(img);
        group.appendChild(cell);
      }
      pnlStage.appendChild(group);
    } else {
      for (let i = 0; i < _pSlides; i++) {
        const img = document.createElement('img');
        img.className = 'pnl-slide' + (i === 0 ? ' active' : '');
        img.decoding = 'async';   // keep decode off the transition's frames
        img.src = mockupSrc(p, i);
        img.alt = `${p.title} mockup ${i + 1} of ${_pSlides}`;
        if (i > 0) img.loading = 'lazy';
        trackLoad(img, i === 0 ? firstFrameSettled : null);
        pnlStage.appendChild(img);
      }
    }

    pnlDots.innerHTML = '';
    pnlDots.classList.toggle('is-hidden', _pSlides < 2);
    if (_pSlides > 1) {
      for (let i = 0; i < _pSlides; i++) {
        const d = document.createElement('button');
        d.className = 'pnl-dot' + (i === 0 ? ' active' : '');
        d.setAttribute('aria-label', `View mockup ${i + 1}`);
        d.addEventListener('click', () => setPanelSlide(i));
        pnlDots.appendChild(d);
      }
    }
    _pCur = 0;

    // Right column: tech stack pills sit under the hooked image.
    pnlTech.innerHTML =
      `<div class="pnl-tech-label">Stack</div>` +
      `<div class="pnl-chips">${p.stack.map(s => `<span class="pnl-chip">${s}</span>`).join('')}</div>`;

    // Left column: description, then Problem / Solution (omitted if absent).
    pnlBody.innerHTML =
      `<div class="pnl-meta">` +
        `<span class="pnl-num">${p.num}</span>` +
        `<span class="pnl-badge">${TYPES[p.cat].label}</span>` +
        `<span class="pnl-tag">${p.tag}</span>` +
      `</div>` +
      `<h3 class="pnl-title" id="pnlTitle">${p.title}</h3>` +
      `<p class="pnl-desc">${p.desc}</p>` +
      (p.problem ? `<div class="pnl-section"><div class="pnl-label">Problem</div><p class="pnl-sec-text">${p.problem}</p></div>` : '') +
      (p.solution ? `<div class="pnl-section"><div class="pnl-label">Solution</div><p class="pnl-sec-text">${p.solution}</p></div>` : '');
  }

  function setPanelSlide(n) {
    if (_pSlides < 2) return;                 // grouped mobile slide: nothing to page
    _pCur = (n + _pSlides) % _pSlides;
    [...pnlStage.children].forEach((el, i) => el.classList.toggle('active', i === _pCur));
    [...pnlDots.children].forEach((el, i) => el.classList.toggle('active', i === _pCur));
  }

  function openPanel(idx, node) {
    _pLastFocus = document.activeElement;
    _pNode = node;
    renderPanel(idx);
    placeBeacon(node);
    panelEl.setAttribute('aria-hidden', 'false');
    panelEl.scrollTop = 0;
    attachPanelTrap();

    // preventScroll is load-bearing here. #portStage is a scroll container
    // (overflow:hidden still scrolls programmatically) and the panel is parked
    // off-stage at translateX(100%) at this point. A plain focus() makes the
    // browser scroll #portStage right to reveal it — dragging the map along —
    // then snap scrollLeft back to 0 once the panel lands inside the box.
    document.getElementById('pnlClose').focus({ preventScroll: true });
    stageEl.scrollLeft = 0;

    // Let the freshly-injected mockups lay out and start decoding for one frame
    // before the transform begins, so the decode doesn't land mid-transition.
    requestAnimationFrame(() => stageEl.classList.add('panel-open'));
  }

  function closePanel() {
    stageEl.classList.remove('panel-open');
    panelEl.setAttribute('aria-hidden', 'true');
    detachPanelTrap();
    // Restore focus, but don't leave the orb stuck in its hover-grown state:
    // the node's `focus` listener calls enter(), which grows ring/dot.
    if (_pLastFocus && _pLastFocus.focus) {
      const el = _pLastFocus;
      el.focus({ preventScroll: true });
      if (el.classList && el.classList.contains('nodeG')) {
        const ring = el.querySelector('.ring'), dot = el.querySelector('.dot');
        if (ring) { ring.setAttribute('r', '20'); ring.setAttribute('fill', '#0c0c0b'); }
        if (dot)  { dot.setAttribute('r', '5'); }
        hovered = -1;
      }
    }
    _pNode = null;
  }

  function attachPanelTrap() {
    _pTrap = e => {
      if (e.key !== 'Tab') return;
      const els = [...panelEl.querySelectorAll('button:not([disabled]),[href],[tabindex]:not([tabindex="-1"])')]
        .filter(el => el.offsetParent !== null);
      if (!els.length) { e.preventDefault(); return; }
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', _pTrap);
  }
  function detachPanelTrap() {
    if (_pTrap) { document.removeEventListener('keydown', _pTrap); _pTrap = null; }
  }

  document.getElementById('pnlClose').addEventListener('click', closePanel);
  scrimEl.addEventListener('click', closePanel);

  document.addEventListener('keydown', e => {
    if (!stageEl.classList.contains('panel-open')) return;
    if (e.key === 'Escape')          { e.preventDefault(); closePanel(); }
    else if (e.key === 'ArrowLeft')  { e.preventDefault(); setPanelSlide(_pCur - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); setPanelSlide(_pCur + 1); }
  });

  // Beacon is positioned from measured SVG geometry — reposition on resize.
  window.addEventListener('resize', () => {
    if (_pNode && stageEl.classList.contains('panel-open')) placeBeacon(_pNode);
  });

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
      // a sector centred straight down (odd sector counts) would put its label below the viewBox
      tx.setAttribute('y', Math.min(CY + Math.sin(s.mid) * lr, H - 12));
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
      '<circle r="40" fill="rgba(134,18,17,0.12)" stroke="rgba(224,81,79,0.5)" stroke-width="1"></circle>' +
      '<circle r="26" fill="#0c0c0b" stroke="#861211" stroke-width="1.2"></circle>' +
      '<text y="-1" text-anchor="middle" font-family="\'DM Serif Display\',serif" font-size="18" fill="#fff">N<tspan fill="#e0514f">S</tspan></text>' +
      '<text y="12" text-anchor="middle" font-family="\'JetBrains Mono\',monospace" font-size="7.5" fill="rgba(255,255,255,0.4)" letter-spacing="1">CORE</text>';
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
      const ly1   = above ? n.y - 38 : n.y + 44;
      const ly2   = above ? n.y - 22 : n.y + 60;

      g.innerHTML =
        `<circle cx="${n.x}" cy="${n.y}" r="20" fill="#0c0c0b" stroke="#e0514f" stroke-width="1.1" class="ring"></circle>` +
        `<circle cx="${n.x}" cy="${n.y}" r="5"  fill="#e0514f" class="dot"></circle>` +
        `<text x="${n.x}" y="${n.y + 3}" text-anchor="middle" font-family="'JetBrains Mono',monospace" font-size="10" fill="#e0514f" style="pointer-events:none;">${n.num}</text>` +
        `<text x="${n.x}" y="${ly1}" text-anchor="middle" font-family="'DM Serif Display',serif" font-size="17" fill="#fff" class="lbl" style="pointer-events:none;">${n.title}</text>` +
        `<text x="${n.x}" y="${ly2}" text-anchor="middle" font-family="'JetBrains Mono',monospace" font-size="9.5" fill="rgba(255,255,255,0.45)" letter-spacing="0.04em" style="pointer-events:none;">${n.tag}</text>`;

      const enter = () => {
        hovered = i;
        preloadMockups(PROJECTS[n._pIdx]);   // hover usually leads the click by 200ms+
        g.querySelector('.ring').setAttribute('r', '24');
        g.querySelector('.ring').setAttribute('fill', 'rgba(134,18,17,0.25)');
        g.querySelector('.dot').setAttribute('r', '6');
      };
      const leave = () => {
        hovered = -1;
        g.querySelector('.ring').setAttribute('r', '20');
        g.querySelector('.ring').setAttribute('fill', '#0c0c0b');
        g.querySelector('.dot').setAttribute('r', '5');
      };
      g.addEventListener('mouseenter', enter);
      g.addEventListener('mouseleave', leave);
      g.addEventListener('focus', enter);
      g.addEventListener('blur', leave);
      g.addEventListener('click', () => openPanel(n._pIdx, n));
      g.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPanel(n._pIdx, n); }
      });
      nodesG.appendChild(g);
    });
  }

  /* ── Canvas: ASCII branches ──────────────────────────────────────────── */
  const canvas = document.getElementById('asciiBranches');
  if (!canvas) return;
  const ctx2 = canvas.getContext('2d');
  const cores = Math.max(1, navigator.hardwareConcurrency || 4);
  const mem = navigator.deviceMemory || 4;
  const lowPower = cores <= 4 || mem <= 4;
  let dpr = 1;
  let raf = null;
  let visible = true;
  let lastTick = 0;
  let fpsInterval = 1000 / (lowPower ? 20 : 24);

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = lowPower || rect.width < 900 ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
    ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
    canvas._w = rect.width;
    canvas._h = rect.height;
    fpsInterval = 1000 / (lowPower || rect.width < 900 ? 20 : 24);
  }

  let t = 0;
  function frame(now = 0) {
    if (!visible || document.hidden) return;
    raf = requestAnimationFrame(frame);
    if (now - lastTick < fpsInterval) return;
    lastTick = now;

    const w = canvas._w || 680, h = canvas._h || 720;
    const scale = Math.min(w / W, h / H);
    const ox = (w - W * scale) / 2;
    const oy = (h - H * scale) / 2;
    ctx2.clearRect(0, 0, w, h);
    ctx2.textAlign    = 'center';
    ctx2.textBaseline = 'middle';

    nodes.forEach((n, i) => {
      const dimByFilter = !(activeFilter === 'all' || n.cat === activeFilter);
      const active = (hovered === -1 || hovered === i) && !dimByFilter;
      const G = TYPES[n.cat].glyphs, hue = TYPES[n.cat].hue;
      const steps = lowPower ? 13 : 17;
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
        ctx2.fillText(G[gi], ox + bx * scale, oy + by * scale);
      }
    });

    t += fpsInterval / 1000;
  }

  function start() {
    if (raf || REDUCE) return;
    lastTick = 0;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    cancelAnimationFrame(raf);
    raf = null;
  }

  resize();
  window.addEventListener('resize', resize);
  new IntersectionObserver(entries => entries.forEach(entry => {
    visible = entry.isIntersecting;
    if (visible && !document.hidden) start();
    else stop();
  }), { threshold: 0 }).observe(canvas);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (visible) start();
  });

})();
