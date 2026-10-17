/* ── Calm page-wide ASCII backdrop (index.html) ─────────────────────────────
   One fixed, viewport-sized canvas sits behind the whole page instead of an
   absolutely-positioned one inside the hero. Cuts compared to the hero knot
   in main.js:
   - ~1/3 the points (96×10 instead of 128×16)
   - no per-frame sort: points are bucketed by depth, and each bucket is
   drawn with one fillStyle, far to near
   - 24fps cap, dpr 1, ~4× slower rotation, no floating particles
   - the knot stays anchored on the right and only rotates; nothing tracks
     scroll, so it doesn't wander as sections pass over it
   ────────────────────────────────────────────────────────────────────── */
(function () {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CHARS = ' .:-=+*#%@';
  const LEVELS = CHARS.length;
  const FRAME_MS = 1000 / 24;

  let w = 0, h = 0, frame = null, last = 0, time = 0;

  // Boot-up intro: the knot starts almost black, flickers on, a cyan scan band
  // sweeps down it and it overshoots into a red neon glow before settling to
  // its normal look. boot runs 0 -> 1 over INTRO_MS; skipped for reduced motion.
  const INTRO_MS = 7000, INTRO_DELAY = 350;
  const LOOP_MS = 15000;   // pause between the end of one boot-up and the start of the next
  let introStart = 0, introDelay = INTRO_DELAY, doneAt = 0, boot = reduce ? 1 : 0;

  function resize() {
    w = innerWidth; h = innerHeight;
    canvas.width = w; canvas.height = h;   // dpr 1: soft glyphs are fine for a backdrop
    if (reduce) draw();
  }

  // torus knot (p=2, q=3), lighter mesh
  const pts = [];
  const SEG = 96, TUBE = 10, P = 2, Q = 3, tubeR = 0.4;
  for (let i = 0; i < SEG; i++) for (let j = 0; j < TUBE; j++) {
    const u = (i / SEG) * Math.PI * 2, v = (j / TUBE) * Math.PI * 2;
    const r = 2 + Math.cos(Q * u);
    const x = r * Math.cos(P * u), y = r * Math.sin(P * u), z = -Math.sin(Q * u);
    pts.push(
      x + tubeR * Math.cos(P * u) * Math.cos(v),
      y + tubeR * Math.sin(P * u) * Math.cos(v),
      z + tubeR * Math.sin(v)
    );
  }
  const N = pts.length / 3;
  const px = new Float32Array(N), py = new Float32Array(N), lvl = new Uint8Array(N);

  // one colour per depth level, built once
  const STYLES = [];
  for (let k = 0; k < LEVELS; k++) {
    const nz = k / (LEVELS - 1);
    STYLES.push(`rgba(${185 + nz * 70 | 0},${30 + nz * 40 | 0},${28 + nz * 34 | 0},${(0.32 + nz * 0.68).toFixed(3)})`);
  }

  function draw() {
    // fixed anchor on the right; only the rotation changes
    const compact = w < 760;
    // The knot reaches ~3.4 units from its centre, so these keep it to about
    // the full viewport height and ~40% of the width, narrower than tall, with
    // its right edge pinned near the viewport edge (i.e. in the page margin).
    const scale = h * (compact ? 0.14 : 0.17);
    const scaleX = Math.min(scale * 0.8, w * (compact ? 0.125 : 0.075));
    const cx = w - 3.4 * scaleX - w * 0.03;
    const cy = h * 0.5;

    const ax = time * 0.3, ay = time * 0.5, az = time * 0.2;
    const c1 = Math.cos(ax), s1 = Math.sin(ax), c2 = Math.cos(ay), s2 = Math.sin(ay), c3 = Math.cos(az), s3 = Math.sin(az);
    for (let i = 0, k = 0; i < N; i++, k += 3) {
      let x = pts[k], y = pts[k + 1], z = pts[k + 2];
      let t = y * c1 - z * s1; z = y * s1 + z * c1; y = t;
      t = x * c2 + z * s2; z = -x * s2 + z * c2; x = t;
      const rx = x * c3 - y * s3, ry = x * s3 + y * c3;
      const f = 5 / (5 + z);
      px[i] = cx + rx * scaleX * f;
      py[i] = cy + ry * scale * f;
      const nz = (z + 3) / 6;
      lvl[i] = Math.max(0, Math.min(LEVELS - 1, nz * (LEVELS - 1) | 0));
    }

    ctx.clearRect(0, 0, w, h);
    const booting = boot < 1;
    let alpha = 1, glow = 0;
    if (booting) {
      const e = 1 - Math.pow(1 - boot, 3);
      const flick = boot < 0.6 ? 0.55 + 0.45 * Math.abs(Math.sin(boot * 95) * Math.sin(boot * 37 + 1)) : 1;
      alpha = (0.05 + 0.95 * e) * flick;
      glow = 16 * Math.sin(Math.PI * boot);
    }
    const cs = Math.max(11, scale * 0.13);
    ctx.font = cs + 'px "JetBrains Mono", monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (booting) { ctx.globalAlpha = alpha; ctx.shadowColor = 'rgba(255,50,60,0.9)'; ctx.shadowBlur = glow; }
    for (let L = 1; L < LEVELS; L++) {          // level 0 is a space: skip it
      ctx.fillStyle = STYLES[L];
      const ch = CHARS[L];
      for (let i = 0; i < N; i++) if (lvl[i] === L) ctx.fillText(ch, px[i], py[i]);
    }
    if (booting) {
      // cyan scan band travelling top -> bottom across the knot
      const sy = h * (-0.1 + 1.2 * Math.min(1, boot / 0.75)), bh = h * 0.07;
      if (boot < 0.8) {
        ctx.globalAlpha = 1; ctx.shadowColor = 'rgba(80,255,240,0.95)'; ctx.shadowBlur = 14;
        ctx.fillStyle = 'rgb(120,255,242)';
        for (let i = 0; i < N; i++) {
          if (lvl[i] > 2 && Math.abs(py[i] - sy) < bh) ctx.fillText(CHARS[lvl[i]], px[i], py[i]);
        }
      }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    }

  }

  function loop(now) {
    frame = requestAnimationFrame(loop);
    if (now - last < FRAME_MS) return;
    // advance by real elapsed time so a slow frame doesn't slow the motion
    if (boot < 1) {
      if (!introStart) introStart = now;
      boot = Math.max(0, Math.min(1, (now - introStart - introDelay) / INTRO_MS));
      if (boot >= 1) doneAt = now;
    } else if (!reduce && now - doneAt > LOOP_MS) {
      boot = 0; introStart = now; introDelay = 0;   // replay the flicker-on
    }
    const dt = last ? Math.min(now - last, 100) : FRAME_MS;
    last = now;
    time += dt * 0.00012;
    draw();
  }
  function start() { if (!frame && !reduce) { last = 0; frame = requestAnimationFrame(loop); } }
  function stop() { cancelAnimationFrame(frame); frame = null; }

  addEventListener('resize', resize);
  resize();
  if (reduce) { draw(); return; }
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  start();
})();

/* ── Cycling hero word: CSS fade instead of per-letter blur tweening ── */
(function () {
  const el = document.getElementById('cycleWordCalm');
  if (!el) return;
  const words = ['scale', 'sell', 'deliver', 'grow'];
  let wi = 0;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  setInterval(() => {
    el.classList.add('is-out');
    setTimeout(() => {
      wi = (wi + 1) % words.length;
      el.textContent = words[wi];
      el.classList.remove('is-out');
    }, 280);
  }, 2600);
})();
