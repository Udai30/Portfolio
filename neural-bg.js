// ============================================================
// Neural network constellation + floating ML symbols
// Subtle AI/ML-themed background drawn on a single 2D canvas.
// Colors follow the site theme (--accent-1 / --accent-2).
// ============================================================
 
(function () {
  const canvas = document.getElementById('neural-bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
 
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const LINK_DIST = 150;
  const LINK_DIST2 = LINK_DIST * LINK_DIST;
  const MOUSE_DIST = 180;
  const MOUSE_DIST2 = MOUSE_DIST * MOUSE_DIST;
  const CAPTURE_DIST = 16; // a node this close to the pointer has "arrived"
 
  // ---------- Theme ----------
  function cssColor(name) {
    const hex = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const n = parseInt(hex.slice(1), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
 
  let accent1, accent2, light;
  function refreshTheme() {
    accent1 = cssColor('--accent-1');
    accent2 = cssColor('--accent-2');
    light = document.documentElement.getAttribute('data-theme') === 'light';
  }
  refreshTheme();
  new MutationObserver(() => { refreshTheme(); if (REDUCED) drawFrame(0); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
 
  const rgba = (c, a) => `rgba(${c.r},${c.g},${c.b},${a})`;
  // Per-node color: mix accent-1 → accent-2
  const mixColor = (m) => ({
    r: Math.round(accent1.r + (accent2.r - accent1.r) * m),
    g: Math.round(accent1.g + (accent2.g - accent1.g) * m),
    b: Math.round(accent1.b + (accent2.b - accent1.b) * m),
  });
 
  // ---------- Nodes ----------
  let nodes = [];
  let W = 0, H = 0, DPR = 1;
 
  function buildNodes() {
    const count = Math.min(80, Math.max(30, Math.round((W * H) / 22000)));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      bx: 0, // burst velocity (set when the pointer pulse fires)
      by: 0,
      r: 1.2 + Math.random() * 1.6,
      mix: Math.random(),
    }));
    chains = [];
    flashes = [];
  }
 
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    // documentElement.clientWidth/Height = viewport excluding scrollbars,
    // matching the fixed inset:0 canvas and pointer clientX/Y coordinates.
    // (Not canvas.getBoundingClientRect(): if the stylesheet hasn't applied
    // yet, that reports the canvas default 300x150 and everything clusters
    // in the top-left corner.)
    const newW = document.documentElement.clientWidth;
    const newH = document.documentElement.clientHeight;
    // Mobile URL bars fire resize on every scroll — only rebuild the
    // constellation on a real layout change, not a tiny height shift.
    const rebuild = nodes.length === 0 || Math.abs(newW - W) > 60 || Math.abs(newH - H) > 160;
    W = newW;
    H = newH;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (rebuild) {
      buildNodes();
      spawnSymbols();
    }
    if (REDUCED) drawFrame(0);
  }
 
  // ---------- Floating ML symbols ----------
  const GLYPHS = ['Σ', '∇', 'θ', 'η', 'ŷ', 'σ(z)', '∂L/∂w', 'f(x)', 'argmax', 'λ'];
  let symbols = [];
 
  function spawnSymbols() {
    symbols = GLYPHS.map((text) => newSymbol(text, true));
  }
 
  function newSymbol(text, anywhere) {
    return {
      text,
      x: Math.random() * W,
      y: anywhere ? Math.random() * H : H + 30,
      speed: 0.08 + Math.random() * 0.12,
      sway: Math.random() * Math.PI * 2,
      size: 13 + Math.random() * 9,
      mix: Math.random(),
      life: 0, // fades in, holds, fades out over its travel
    };
  }
 
  // ---------- Mouse ----------
  let mouse = null;
  let mousePulseCooldown = 0;
  // Map the pointer into canvas drawing space via the canvas's actual
  // on-screen rect — immune to scrollbars, zoom, display scaling, or the
  // canvas not sitting exactly at the viewport origin.
  window.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    mouse = {
      x: (e.clientX - rect.left) * (W / rect.width),
      y: (e.clientY - rect.top) * (H / rect.height),
    };
  }, { passive: true });
  window.addEventListener('pointerleave', () => { mouse = null; });
  // On touch screens the last tap would act as a permanent phantom cursor
  const clearTouch = (e) => { if (e.pointerType !== 'mouse') mouse = null; };
  window.addEventListener('pointerup', clearTouch);
  window.addEventListener('pointercancel', clearTouch);
 
  // ---------- Pass-network chains (football-style passing sequences) ----------
  let chains = [];
  let flashes = [];
  let nextPulseAt = 0;
 
  function nearbyNode(from, exclude) {
    const candidates = [];
    for (const n of nodes) {
      if (n === from || n === exclude) continue;
      const d = Math.hypot(n.x - from.x, n.y - from.y);
      if (d > 20 && d < LINK_DIST) candidates.push(n);
    }
    return candidates.length ? candidates[(Math.random() * candidates.length) | 0] : null;
  }
 
  function firePassChain(now) {
    const start = nodes[(Math.random() * nodes.length) | 0];
    const path = [start];
    const hops = 3 + ((Math.random() * 4) | 0); // 3–6 receivers
    for (let i = 0; i < hops; i++) {
      const next = nearbyNode(path[path.length - 1], path[path.length - 2]);
      if (!next) break;
      path.push(next);
    }
    if (path.length > 1) {
      chains.push({ nodes: path, seg: 0, t: 0, speed: 0.012 + Math.random() * 0.008 });
    }
    nextPulseAt = now + 2500 + Math.random() * 2000;
  }
 
  // ---------- Drawing ----------
  function drawFrame(dt) {
    ctx.clearRect(0, 0, W, H);
    const alphaScale = light ? 0.6 : 1;
 
    // Links
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 >= LINK_DIST2) continue;
        const alpha = (1 - Math.sqrt(d2) / LINK_DIST) * 0.16 * alphaScale;
        ctx.strokeStyle = rgba(mixColor((a.mix + b.mix) / 2), alpha);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
 
      // Link to mouse (attraction physics lives in step())
      if (mouse) {
        const dx = a.x - mouse.x, dy = a.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < MOUSE_DIST2) {
          ctx.strokeStyle = rgba(mixColor(a.mix), (1 - Math.sqrt(d2) / MOUSE_DIST) * 0.2 * alphaScale);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    }
 
    // Nodes
    for (const n of nodes) {
      const c = mixColor(n.mix);
      ctx.fillStyle = rgba(c, 0.55 * alphaScale);
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
      // soft halo
      ctx.fillStyle = rgba(c, 0.08 * alphaScale);
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r * 3, 0, Math.PI * 2);
      ctx.fill();
    }
 
    // Pass chains: brighter "pass lane" on the active segment + traveling ball
    for (const c of chains) {
      const a = c.nodes[c.seg];
      const b = c.nodes[c.seg + 1];
      ctx.strokeStyle = rgba(mixColor(a.mix), 0.3 * alphaScale);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
 
      const x = a.x + (b.x - a.x) * c.t;
      const y = a.y + (b.y - a.y) * c.t;
      ctx.fillStyle = rgba(mixColor(a.mix), 0.75 * alphaScale);
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
 
    // Reception / goal flashes (expanding fading rings)
    for (const f of flashes) {
      ctx.strokeStyle = rgba(mixColor(f.mix), f.alpha * alphaScale);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(f.node.x, f.node.y, f.r, 0, Math.PI * 2);
      ctx.stroke();
      if (f.goal) {
        ctx.beginPath();
        ctx.arc(f.node.x, f.node.y, f.r * 0.6, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
 
    // Floating ML symbols
    ctx.textAlign = 'center';
    for (const s of symbols) {
      // fade in over first ~2s of life, fade out as it nears the top
      const fade = Math.min(1, s.life / 120, Math.max(0, s.y / 80));
      const alpha = (light ? 0.10 : 0.13) * fade;
      ctx.font = `500 ${s.size}px "Space Grotesk", "Inter", sans-serif`;
      ctx.fillStyle = rgba(mixColor(s.mix), alpha);
      ctx.fillText(s.text, s.x + Math.sin(s.sway) * 14, s.y);
    }
  }
 
  // ---------- Animation ----------
  let last = performance.now();
 
  function step(now) {
    requestAnimationFrame(step);
    if (document.hidden) { last = now; return; }
    const dt = Math.min(now - last, 40);
    last = now;
 
    // Move nodes (wrap at edges); burst velocity decays back to drift
    for (const n of nodes) {
      n.x += (n.vx + n.bx) * dt * 0.06;
      n.y += (n.vy + n.by) * dt * 0.06;
      if (n.bx || n.by) {
        n.bx *= 0.94;
        n.by *= 0.94;
        if (Math.abs(n.bx) < 0.05 && Math.abs(n.by) < 0.05) { n.bx = 0; n.by = 0; }
      }
      if (n.x < -10) n.x = W + 10; else if (n.x > W + 10) n.x = -10;
      if (n.y < -10) n.y = H + 10; else if (n.y > H + 10) n.y = -10;
    }
 
    // Mouse attraction → capture → pulse out
    mousePulseCooldown -= dt;
    if (mouse && mousePulseCooldown <= 0) {
      let linked = 0;
      let arrived = 0;
      for (const n of nodes) {
        const dx = mouse.x - n.x, dy = mouse.y - n.y;
        const d2 = dx * dx + dy * dy;
        if (d2 >= MOUSE_DIST2) continue;
        linked++;
        if (d2 < CAPTURE_DIST * CAPTURE_DIST) {
          arrived++;
          // hold captured nodes at the pointer so drift can't pull them back out
          n.x += dx * 0.01 * dt;
          n.y += dy * 0.01 * dt;
        } else {
          // smooth ease toward the pointer — kept very gentle
          n.x += dx * 0.0003 * dt;
          n.y += dy * 0.0003 * dt;
        }
      }
      // Burst once a small cluster has gathered (or all linked nodes, if fewer —
      // requiring every node in the 180px radius never fires: new nodes keep
      // drifting into range before the close ones arrive)
      if (linked > 0 && arrived >= Math.min(linked, 4)) {
        for (const n of nodes) {
          const dx = n.x - mouse.x, dy = n.y - mouse.y;
          if (dx * dx + dy * dy >= MOUSE_DIST2) continue;
          const ang = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.6;
          const sp = 2 + Math.random() * 1.5;
          n.bx = Math.cos(ang) * sp;
          n.by = Math.sin(ang) * sp;
        }
        flashes.push({
          node: { x: mouse.x, y: mouse.y }, // frozen at the pulse point
          mix: Math.random(),
          r: 4,
          alpha: 0.8,
          grow: 2.2,
          goal: true,
        });
        mousePulseCooldown = 900;
      }
    }
 
    // Move symbols
    for (let i = 0; i < symbols.length; i++) {
      const s = symbols[i];
      s.y -= s.speed * dt * 0.06;
      s.sway += 0.0006 * dt;
      s.life += dt * 0.06;
      if (s.y < -40) symbols[i] = newSymbol(s.text, false);
    }
 
    // Pass chains
    if (now > nextPulseAt) firePassChain(now);
    chains = chains.filter((c) => {
      c.t += c.speed * dt * 0.06;
      while (c.t >= 1) {
        c.t -= 1;
        c.seg++;
        const done = c.seg >= c.nodes.length - 1;
        const receiver = c.nodes[Math.min(c.seg, c.nodes.length - 1)];
        const goal = done && Math.random() < 0.3;
        flashes.push({
          node: receiver,
          mix: receiver.mix,
          r: 2,
          alpha: goal ? 0.7 : 0.45,
          grow: goal ? 1.6 : 1.1,
          goal,
        });
        if (done) return false;
      }
      return true;
    });
 
    // Flashes expand and fade out
    flashes = flashes.filter((f) => {
      f.r += f.grow * dt * 0.06;
      f.alpha -= 0.012 * dt * 0.06;
      return f.alpha > 0;
    });
 
    drawFrame(dt);
  }
 
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('load', resize);
 
  if (REDUCED) {
    drawFrame(0); // single static constellation, no animation
  } else {
    requestAnimationFrame(step);
  }
})();