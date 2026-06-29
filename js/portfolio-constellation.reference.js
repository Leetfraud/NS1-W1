/* ============================================================================
 * NexioSol — Portfolio Constellation (v4)  ·  REFERENCE IMPLEMENTATION
 * ----------------------------------------------------------------------------
 * This is the SOURCE OF TRUTH for the portfolio constellation. It was tuned
 * interactively (layout math, ASCII rendering, glyph sets, timing) and should
 * be ADAPTED into the real portfolio.html — not reinvented.
 *
 * What this file is:
 *   - A self-contained, commented version of the working v4 prototype.
 *   - Runnable as-is against the matching HTML scaffold (see HTML SCAFFOLD at
 *     the bottom of this comment block).
 *
 * What you (Claude Code) must change when integrating — see INTEGRATION NOTES
 * at the bottom. The short version:
 *   1. Wedge layout already rebalances to the number of categories that have
 *      projects. Per the product decision, Refactor & Grow is FULL CATALOGUE:
 *      it always gets a wedge even with 0 projects (see ALWAYS_SHOW_TYPES).
 *   2. Replace SVG placeholder mockups with real <img srcset> (AVIF/WebP, 1x/2x,
 *      lazy-loaded). Filename convention: assets/mockups/{slug}-{1,2,3}.avif
 *   3. Generalise the EXISTING .modal-overlay/.modal-card (booking modal) for
 *      the deck — do not fork a second modal system, do not break booking.
 *   4. Desktop only. Touch / <=960px falls back to the existing .port-page-grid.
 *      Same deck opens from both surfaces (deck is decoupled from arrangement).
 *
 * Palette (match site exactly, monochrome red only):
 *   --ink #0c0c0b · --red #861211 · --red-bright #b91c1a · red-light #e0514f
 *   --off #f9f8f6 · --muted #6b6b67 · --faint #9c9c97
 * Fonts: 'DM Serif Display' (titles), 'DM Sans' (body), 'JetBrains Mono' (labels)
 * Easing: cubic-bezier(.22,.61,.36,1)
 * ========================================================================== */

(function () {
  'use strict';

  /* --- prefers-reduced-motion: if set, we render a static frame, no loop --- */
  const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------ DATA
   * In production, source this from the same place the grid cards come from
   * (e.g. a shared JS array or data attributes) so the constellation and the
   * grid fallback never drift. cat MUST be one of the four canonical slugs.
   */
  const TYPES = {
    software: { label: 'Software & Cloud', glyphs: ' .·:-=+*#', hue: [205, 45, 34] },
    ai:       { label: 'AI & Automation',  glyphs: ' .,:;!=≡#', hue: [215, 60, 42] },
    systems:  { label: 'Web3 & Systems',   glyphs: ' .·°*+×#',  hue: [175, 32, 30] },
    refactor: { label: 'Refactor & Grow',  glyphs: ' ·~–=≈→#',  hue: [150, 28, 30] },
  };
  /* Canonical wedge order (matches index.html Capabilities + portfolio filters) */
  const ORDER = ['software', 'ai', 'systems', 'refactor'];

  /* FULL CATALOGUE decision: these categories ALWAYS get a wedge, even with
   * zero projects, because they are advertised services. Refactor & Grow lives
   * here so the portfolio mirrors the capabilities taxonomy. */
  const ALWAYS_SHOW_TYPES = ['software', 'ai', 'systems', 'refactor'];

  /* slug helper for asset filenames, e.g. "EV Charging Manager" -> "ev-charging-manager" */
  const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const projects = [
    { num: '01', cat: 'software', tag: 'Web Platform',        title: 'DevProfile Analyzer',   desc: 'GitHub portfolio intelligence — contribution patterns, language breakdowns, side-by-side profile comparisons.', stack: ['React', 'Vite', 'Tailwind', 'GitHub API'] },
    { num: '04', cat: 'software', tag: 'Studio Web',          title: 'NexioSol Studio Site',  desc: 'Dark editorial studio presence with a live ASCII render hero and a database-wired lead funnel.',            stack: ['HTML', 'Vercel', 'MongoDB'] },
    { num: '02', cat: 'ai',       tag: 'AI Desktop Agent',    title: 'Tabby',                 desc: 'Offline-first desktop assistant pairing Whisper transcription, intent classification and gesture control.',     stack: ['Python', 'Whisper', 'Vision'] },
    { num: '05', cat: 'ai',       tag: 'Data Platform',       title: 'Project Five',          desc: 'Placeholder slot — your fifth AI project drops in here with three mockups and a one-line framing.',          stack: ['TBD', 'TBD'] },
    { num: '03', cat: 'systems',  tag: 'Systems Engineering', title: 'EV Charging Manager',   desc: 'Station management with a high-performance C++17 backend and a reactive real-time load dashboard.',           stack: ['C++17', 'React', 'REST'] },
    { num: '06', cat: 'systems',  tag: 'Systems',             title: 'Project Six',           desc: 'Placeholder slot — your sixth systems project drops in here with three mockups and a one-line framing.',     stack: ['TBD', 'TBD'] },
    { num: '07', cat: 'refactor', tag: 'Modernization',       title: 'Legacy Rebuild',        desc: 'A refactor / scale engagement — modernising an existing system and growing it under real load.',             stack: ['TBD'] },
  ];

  /* ---------------------------------------------------------------- GEOMETRY */
  const W = 680, H = 510;          // SVG/canvas coordinate space (1:1 with css px at full width)
  const CX = W / 2, CY = H / 2 + 16;
  const R = Math.min(W, H) * 0.33; // base node orbit radius

  /* Count-driven wedge layout. Each *shown* category gets an equal angular
   * sector; projects fan across their sector. Categories with no projects are
   * still shown (full catalogue) so an empty wedge appears as an invitation,
   * not a gap. Works for 3..10 projects without changes. */
  function layout() {
    const counts = {};
    ORDER.forEach((t) => (counts[t] = projects.filter((p) => p.cat === t).length));
    const used = ORDER.filter((t) => counts[t] > 0 || ALWAYS_SHOW_TYPES.includes(t));

    const n = used.length;
    const gap = 0.18;                  // fraction of each sector left empty as a gutter
    const sectorSpan = (Math.PI * 2) / n;

    const placed = [];
    const sectorMeta = [];
    used.forEach((type, si) => {
      const inType = projects.filter((p) => p.cat === type);
      const start = -Math.PI / 2 + si * sectorSpan + (gap / 2) * sectorSpan;
      const end   = -Math.PI / 2 + (si + 1) * sectorSpan - (gap / 2) * sectorSpan;
      const mid   = (start + end) / 2;
      sectorMeta.push({ type, start, end, mid, count: inType.length });

      inType.forEach((p, k) => {
        const f = inType.length === 1 ? 0.5 : k / (inType.length - 1);
        const ang = start + f * (end - start);
        // alternate radius so multi-node sectors read organic, not clock-evenly spaced
        const rr = inType.length > 1 ? R * (k % 2 === 0 ? 1 : 0.82) : R * 0.92;
        placed.push({ ...p, ang, x: CX + Math.cos(ang) * rr, y: CY + Math.sin(ang) * rr });
      });
    });
    return { nodes: placed, sectors: sectorMeta };
  }
  const { nodes, sectors } = layout();

  const NS = 'http://www.w3.org/2000/svg';
  let activeFilter = 'all';
  let hovered = -1;

  /* ------------------------------------------------------------- SVG: WEDGES */
  const sectorsG = document.getElementById('sectors');
  sectors.forEach((s) => {
    const r0 = 44, r1 = R * 1.18;     // inner/outer radius of the wedge band
    const ax0 = CX + Math.cos(s.start) * r0, ay0 = CY + Math.sin(s.start) * r0;
    const ax1 = CX + Math.cos(s.start) * r1, ay1 = CY + Math.sin(s.start) * r1;
    const bx0 = CX + Math.cos(s.end) * r0,   by0 = CY + Math.sin(s.end) * r0;
    const bx1 = CX + Math.cos(s.end) * r1,   by1 = CY + Math.sin(s.end) * r1;
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

    /* sector label, just past the rim, centred on the sector mid-angle */
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

  /* ----------------------------------------------------- SVG: ORBIT GUIDES */
  const orbitsG = document.getElementById('orbits');
  [0.82, 1].forEach((f) => {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', CX); c.setAttribute('cy', CY); c.setAttribute('r', R * f);
    c.setAttribute('fill', 'none');
    c.setAttribute('stroke', 'rgba(255,255,255,0.05)');
    c.setAttribute('stroke-width', '1');
    c.setAttribute('stroke-dasharray', '2 6');
    orbitsG.appendChild(c);
  });

  /* ----------------------------------------------------------- SVG: CORE */
  const coreG = document.createElementNS(NS, 'g');
  coreG.setAttribute('transform', `translate(${CX},${CY})`);
  coreG.innerHTML =
    '<circle r="34" fill="rgba(134,18,17,0.12)" stroke="rgba(224,81,79,0.5)" stroke-width="1"></circle>' +
    '<circle r="22" fill="#0c0c0b" stroke="#861211" stroke-width="1.2"></circle>' +
    '<text y="-1" text-anchor="middle" font-family="\'DM Serif Display\',serif" font-size="15" fill="#fff">N<tspan fill="#e0514f">S</tspan></text>' +
    '<text y="12" text-anchor="middle" font-family="\'JetBrains Mono\',monospace" font-size="6.5" fill="rgba(255,255,255,0.4)" letter-spacing="1">CORE</text>';
  document.getElementById('nodes').appendChild(coreG);

  /* ---------------------------------------------------------- SVG: NODES
   * NOTE for integration: render each node as a real, focusable control
   * (role="button" or an actual <button> in a foreignObject, tabindex=0,
   * aria-label = title + service). Wire keydown Enter/Space -> openDeck.
   */
  const nodesG = document.getElementById('nodes');
  nodes.forEach((n, i) => {
    const g = document.createElementNS(NS, 'g');
    g.style.cursor = 'pointer';
    g.dataset.type = n.cat;
    g.classList.add('nodeG');
    g.setAttribute('role', 'button');
    g.setAttribute('tabindex', '0');
    g.setAttribute('aria-label', `${n.title} — ${TYPES[n.cat].label}. Open project deck.`);

    const above = n.y < CY;
    const ly1 = above ? n.y - 26 : n.y + 30;  // title above node if node sits high, else below
    const ly2 = above ? n.y - 12 : n.y + 44;

    g.innerHTML =
      `<circle cx="${n.x}" cy="${n.y}" r="15" fill="#0c0c0b" stroke="#e0514f" stroke-width="1.1" class="ring"></circle>` +
      `<circle cx="${n.x}" cy="${n.y}" r="4" fill="#e0514f" class="dot"></circle>` +
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
    g.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDeck(i); }
    });
    nodesG.appendChild(g);
  });

  /* ------------------------------------------------------------ FILTER BAR
   * In production, reuse the existing .filter-bar / .filter-btn markup + styles
   * from portfolio.html instead of building buttons here. Keep the same
   * data-filter slugs. setFilter() is the behaviour to port.
   */
  const fb = document.getElementById('filterBar');
  const filters = [{ k: 'all', label: 'All work' }, ...ORDER.map((t) => ({ k: t, label: TYPES[t].label }))];
  filters.forEach((f) => {
    const b = document.createElement('button');
    b.textContent = f.label;
    b.dataset.k = f.k;
    b.style.cssText =
      "font-family:'JetBrains Mono',monospace;font-size:11px;padding:7px 13px;border-radius:100px;cursor:pointer;" +
      `border:1px solid ${f.k === 'all' ? '#861211' : 'rgba(255,255,255,0.18)'};` +
      `background:${f.k === 'all' ? '#861211' : 'transparent'};` +
      `color:${f.k === 'all' ? '#fff' : 'rgba(255,255,255,0.6)'};` +
      'transition:all .25s cubic-bezier(.22,.61,.36,1);';
    b.onclick = () => setFilter(f.k);
    fb.appendChild(b);
  });

  function setFilter(k) {
    activeFilter = k;
    [...fb.children].forEach((b) => {
      const on = b.dataset.k === k;
      b.style.background = on ? '#861211' : 'transparent';
      b.style.color = on ? '#fff' : 'rgba(255,255,255,0.6)';
      b.style.borderColor = on ? '#861211' : 'rgba(255,255,255,0.18)';
    });
    document.querySelectorAll('.nodeG').forEach((g) => {
      const show = k === 'all' || g.dataset.type === k;
      g.style.transition = 'opacity .4s cubic-bezier(.22,.61,.36,1)';
      g.style.opacity = show ? '1' : '0.1';
      g.style.pointerEvents = show ? 'auto' : 'none';
    });
    document.querySelectorAll('.wedge').forEach((w) => {
      const on = k === 'all' || w.dataset.type === k;
      w.setAttribute('fill', on ? (k === 'all' ? 'rgba(134,18,17,0.04)' : 'rgba(134,18,17,0.10)') : 'rgba(134,18,17,0.01)');
      w.setAttribute('stroke', on ? 'rgba(224,81,79,0.18)' : 'rgba(224,81,79,0.04)');
    });
    document.querySelectorAll('.sectorLabel').forEach((l) => {
      const on = k === 'all' || l.dataset.type === k;
      l.setAttribute('fill', on ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.18)');
    });
  }

  /* ------------------------------------------------- CANVAS: ASCII BRANCHES
   * Same idea as the hero torus in main.js: paint glyphs onto a 2D canvas each
   * frame. One quadratic-bezier branch per node (core -> node), sampled into
   * `steps` glyphs. Density (and thus glyph weight) is higher near the core and
   * thins toward the node. A per-node time offset gives a gentle living bend.
   * Glyph SET and base hue come from the node's service => secondary type cue.
   */
  const canvas = document.getElementById('asciiBranches');
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    const r = canvas.getBoundingClientRect();
    canvas.width = r.width * dpr;
    canvas.height = r.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    canvas._w = r.width;
    canvas._h = r.height;
  }

  let t = 0;
  function frame() {
    const w = canvas._w, h = canvas._h, sx = w / W, sy = h / H;
    ctx.clearRect(0, 0, w, h);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    nodes.forEach((n, i) => {
      const dimByFilter = !(activeFilter === 'all' || n.cat === activeFilter);
      const active = (hovered === -1 || hovered === i) && !dimByFilter;
      const G = TYPES[n.cat].glyphs, hue = TYPES[n.cat].hue;

      const steps = 23;
      const mx = (CX + n.x) / 2, my = (CY + n.y) / 2;
      const dx = n.x - CX, dy = n.y - CY;
      const px = -dy, py = dx, plen = Math.hypot(px, py) || 1;
      const bend = 15 * Math.sin(t * 0.5 + i);          // perpendicular bow, animated
      const cxp = mx + (px / plen) * bend, cyp = my + (py / plen) * bend;

      for (let s = 1; s < steps; s++) {
        const u = s / steps;
        // quadratic bezier core -> control -> node
        const bx = (1 - u) * (1 - u) * CX + 2 * (1 - u) * u * cxp + u * u * n.x;
        const by = (1 - u) * (1 - u) * CY + 2 * (1 - u) * u * cyp + u * u * n.y;

        const dens = (1 - u) * 0.8 + 0.2;               // 1 near core -> ~0.2 near node
        const shimmer = (Math.sin(t * 2 + s * 0.7 + i * 1.3) + 1) / 2;
        let gi = Math.floor((dens * 0.7 + shimmer * 0.4) * (G.length - 1));
        gi = Math.max(0, Math.min(G.length - 1, gi));

        const baseA = dimByFilter ? 0.05 : (active ? 0.82 : 0.15);
        const alpha = baseA * (0.4 + dens * 0.6);
        const size = (active ? 10 : 8.5) * (0.7 + dens * 0.5);
        ctx.font = size + 'px "JetBrains Mono", monospace';

        const r = Math.floor(hue[0] + dens * 55);
        const gg = Math.floor(hue[1] + shimmer * 25);
        const bb = hue[2];
        ctx.fillStyle = `rgba(${r},${gg},${bb},${alpha})`;
        ctx.fillText(G[gi], bx * sx, by * sy);
      }
    });

    t += 0.016;
    if (!REDUCE) requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener('resize', resize);
  frame(); // REDUCE => paints exactly one static frame and stops

  /* ------------------------------------------------------------------ DECK
   * PROTOTYPE deck. In production:
   *   - Reuse the existing .modal-overlay/.modal-card from styles.css.
   *   - Replace mockSVG() with real <img srcset> (AVIF/WebP, 1x/2x), lazy per
   *     project. Filename convention: assets/mockups/{slug}-{1,2,3}.{avif,webp,jpg}
   *   - Trap focus inside the open deck; restore focus to the triggering node
   *     on close; Esc closes (wired below).
   *   - Expose openDeck() so the GRID FALLBACK can call the same deck.
   */
  const mockColors = [['#1a1a18', '#e0514f'], ['#0c0c0b', '#b91c1a'], ['#222220', '#861211']];
  function mockSVG(i, label) {
    const [bg, ac] = mockColors[i % 3];
    return (
      `<svg viewBox="0 0 400 300" width="100%" height="100%" style="display:block;">` +
      `<rect width="400" height="300" fill="${bg}"/>` +
      `<rect x="0" y="0" width="400" height="34" fill="rgba(255,255,255,0.04)"/>` +
      `<circle cx="18" cy="17" r="4" fill="${ac}"/><circle cx="32" cy="17" r="4" fill="rgba(255,255,255,0.2)"/><circle cx="46" cy="17" r="4" fill="rgba(255,255,255,0.2)"/>` +
      `<rect x="28" y="64" width="150" height="14" rx="3" fill="rgba(255,255,255,0.16)"/>` +
      `<rect x="28" y="88" width="240" height="9" rx="3" fill="rgba(255,255,255,0.08)"/>` +
      `<rect x="28" y="104" width="200" height="9" rx="3" fill="rgba(255,255,255,0.08)"/>` +
      `<rect x="28" y="140" width="104" height="64" rx="6" fill="${ac}" opacity="0.85"/>` +
      `<rect x="148" y="140" width="104" height="64" rx="6" fill="rgba(255,255,255,0.06)"/>` +
      `<rect x="268" y="140" width="104" height="64" rx="6" fill="rgba(255,255,255,0.06)"/>` +
      `<rect x="28" y="224" width="344" height="48" rx="6" fill="rgba(255,255,255,0.04)"/>` +
      `<text x="200" y="290" text-anchor="middle" font-family="'JetBrains Mono',monospace" font-size="10" fill="rgba(255,255,255,0.3)">${label} — mockup ${i + 1} / 3 · placeholder</text>` +
      `</svg>`
    );
  }

  let curProj = 0, curSlide = 0;
  const overlay = document.getElementById('deckOverlay');

  function renderDeck() {
    const p = nodes[curProj];
    const tlabel = TYPES[p.cat].label;
    overlay.innerHTML =
      `<div class="deck-faux-viewport" style="min-height:560px;background:rgba(8,8,7,0.7);backdrop-filter:blur(7px);display:flex;align-items:center;justify-content:center;padding:24px;font-family:'DM Sans',sans-serif;">` +
        `<div style="background:#f9f8f6;border-radius:20px;max-width:680px;width:100%;overflow:hidden;position:relative;border:1px solid rgba(0,0,0,0.08);">` +
          `<button id="deckClose" aria-label="Close" style="position:absolute;top:16px;right:16px;z-index:5;width:34px;height:34px;border-radius:50%;border:1px solid rgba(0,0,0,0.08);background:#fff;cursor:pointer;color:#6b6b67;display:flex;align-items:center;justify-content:center;font-size:17px;">✕</button>` +
          `<div style="position:relative;background:#0c0c0b;aspect-ratio:4/3;max-height:340px;">` +
            `<div id="slideStage" style="width:100%;height:100%;"></div>` +
            `<button id="prevB" aria-label="Previous mockup" style="position:absolute;left:14px;top:50%;transform:translateY(-50%);width:38px;height:38px;border-radius:50%;border:none;background:rgba(255,255,255,0.1);backdrop-filter:blur(8px);color:#fff;cursor:pointer;font-size:16px;">‹</button>` +
            `<button id="nextB" aria-label="Next mockup" style="position:absolute;right:14px;top:50%;transform:translateY(-50%);width:38px;height:38px;border-radius:50%;border:none;background:rgba(255,255,255,0.1);backdrop-filter:blur(8px);color:#fff;cursor:pointer;font-size:16px;">›</button>` +
            `<div id="dots" style="position:absolute;bottom:14px;left:50%;transform:translateX(-50%);display:flex;gap:7px;"></div>` +
          `</div>` +
          `<div style="padding:30px 36px 34px;">` +
            `<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">` +
              `<span style="font-family:'JetBrains Mono',monospace;font-size:12px;color:#861211;">${p.num}</span>` +
              `<span style="font-family:'JetBrains Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:#861211;background:#fdf2f2;border:1px solid rgba(134,18,17,0.2);border-radius:100px;padding:3px 10px;">${tlabel}</span>` +
              `<span style="font-family:'JetBrains Mono',monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#6b6b67;">${p.tag}</span>` +
            `</div>` +
            `<h3 style="font-family:'DM Serif Display',serif;font-weight:400;font-size:30px;letter-spacing:-.6px;margin:12px 0 12px;color:#111110;">${p.title}</h3>` +
            `<p style="color:#6b6b67;font-size:15px;font-weight:300;line-height:1.6;max-width:520px;">${p.desc}</p>` +
            `<div style="margin-top:20px;display:flex;flex-wrap:wrap;gap:7px;">` +
              p.stack.map((s) => `<span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#111110;background:#fff;border:1px solid rgba(0,0,0,0.14);border-radius:100px;padding:4px 11px;">${s}</span>`).join('') +
            `</div>` +
          `</div>` +
        `</div>` +
      `</div>`;
    overlay.style.display = 'block';
    document.getElementById('deckClose').onclick = closeDeck;
    document.getElementById('prevB').onclick = () => go(-1);
    document.getElementById('nextB').onclick = () => go(1);
    renderSlide();
  }

  function renderSlide() {
    const p = nodes[curProj];
    // PROD: swap mockSVG(...) for <img loading="lazy" srcset="assets/mockups/{slug}-{n}.avif ..."/>
    document.getElementById('slideStage').innerHTML = mockSVG(curSlide, p.title);
    const dots = document.getElementById('dots');
    dots.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const d = document.createElement('span');
      d.style.cssText =
        `width:${i === curSlide ? '22px' : '7px'};height:7px;border-radius:100px;` +
        `background:${i === curSlide ? '#b91c1a' : 'rgba(255,255,255,0.35)'};` +
        'transition:all .3s cubic-bezier(.22,.61,.36,1);cursor:pointer;';
      d.onclick = () => { curSlide = i; renderSlide(); };
      dots.appendChild(d);
    }
  }

  function go(dir) { curSlide = (curSlide + dir + 3) % 3; renderSlide(); }
  function openDeck(i) { curProj = i; curSlide = 0; renderDeck(); }
  function closeDeck() { overlay.style.display = 'none'; overlay.innerHTML = ''; }

  /* keyboard: arrows change slide, Esc closes (only while deck is open) */
  document.addEventListener('keydown', (e) => {
    if (overlay.style.display !== 'block') return;
    if (e.key === 'Escape') closeDeck();
    else if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'ArrowRight') go(1);
  });

  /* Expose so the grid fallback can open the same deck (decoupled presentation) */
  window.NexioDeck = { open: openDeck, close: closeDeck };
})();

/* ============================================================================
 * HTML SCAFFOLD this script expects (adapt into the portfolio section):
 *
 * <section class="constellation-section" style="background:#0c0c0b;">
 *   <div id="filterBar"></div>            (or reuse existing .filter-bar)
 *   <div id="mapWrap" style="position:relative;width:100%;height:510px;">
 *     <canvas id="asciiBranches" style="position:absolute;inset:0;width:100%;height:100%;z-index:1;"></canvas>
 *     <div id="coreGlow" style="position:absolute;width:360px;height:360px;border-radius:50%;
 *          background:rgba(134,18,17,0.2);filter:blur(105px);pointer-events:none;
 *          left:50%;top:50%;transform:translate(-50%,-50%);z-index:0;"></div>
 *     <svg id="overSvg" viewBox="0 0 680 510" width="100%" height="510"
 *          style="position:absolute;inset:0;z-index:2;">
 *       <g id="sectors"></g><g id="orbits"></g><g id="nodes"></g>
 *     </svg>
 *   </div>
 * </section>
 * <div id="deckOverlay" style="display:none;"></div>
 *
 * ----------------------------------------------------------------------------
 * INTEGRATION NOTES (priority order):
 * 1. DESKTOP ONLY. Gate init behind matchMedia('(min-width: 961px)') AND a
 *    no-touch check. <=960px or touch: hide #mapWrap, show existing
 *    .port-page-grid, and have grid cards call window.NexioDeck.open(index).
 * 2. SINGLE SOURCE OF DATA. Drive both the grid cards and `projects` here from
 *    one array so they never diverge. cat must be a canonical slug.
 * 3. DECK = EXISTING MODAL. Generalise .modal-overlay/.modal-card (booking)
 *    rather than forking. Keep booking working.
 * 4. REAL MOCKUPS. Replace mockSVG with <img srcset> AVIF/WebP 1x/2x, lazy,
 *    filename assets/mockups/{slug}-{1,2,3}.{avif,webp,jpg}. Generate on-brand
 *    dark placeholder files now (a build script is fine) so it works end-to-end.
 * 5. FOCUS MGMT. Trap focus in open deck; return focus to the node on close.
 * 6. FULL CATALOGUE. Refactor & Grow always shows (ALWAYS_SHOW_TYPES) even at
 *    0 projects — matches the index.html Capabilities taxonomy.
 * ========================================================================== */
