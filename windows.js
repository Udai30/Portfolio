// ============================================================
// Window manager — draggable, resizable sandbox windows
// Project definitions live in projects.js (PROJECTS).
// ============================================================
 
(function () {
  const layer = document.getElementById('window-layer');
  const taskbar = document.getElementById('taskbar');
  const taskbarItems = document.getElementById('taskbar-items');
 
  const openWindows = new Map(); // id -> { el, taskBtn, minimized }
  let zCounter = 500;
  let cascade = 0;
 
  // ---------- Open / focus ----------
  document.querySelectorAll('[data-launch]').forEach((btn) => {
    btn.addEventListener('click', () => openProject(btn.dataset.launch));
  });
 
  function openProject(id) {
    const project = PROJECTS[id];
    if (!project) return;
 
    const existing = openWindows.get(id);
    if (existing) {
      restoreWindow(id);
      focusWindow(id);
      return;
    }
 
    const el = buildWindow(id, project);
    layer.appendChild(el);
    placeWindow(el, project);
 
    const taskBtn = buildTaskButton(id, project);
    taskbarItems.appendChild(taskBtn);
    taskbar.hidden = false;
 
    openWindows.set(id, { el, taskBtn, minimized: false });
    focusWindow(id);
  }
 
  function buildWindow(id, project) {
    const el = document.createElement('section');
    el.className = 'os-window';
    el.dataset.id = id;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', project.title);
 
    const titlebar = document.createElement('header');
    titlebar.className = 'os-titlebar';
    titlebar.innerHTML = `
      <span class="os-glyph" aria-hidden="true">${project.glyph}</span>
      <span class="os-title">${project.title}</span>
      <div class="os-controls">
        <button class="os-min" title="Minimize" aria-label="Minimize">—</button>
        <button class="os-max" title="Maximize" aria-label="Maximize">□</button>
        <button class="os-close" title="Close" aria-label="Close">✕</button>
      </div>`;
 
    const body = document.createElement('div');
    body.className = 'os-body';
 
    if (project.demo) {
      const iframe = document.createElement('iframe');
      iframe.src = project.demo;
      iframe.title = `${project.title} — sandboxed demo`;
      iframe.setAttribute(
        'sandbox',
        project.sandbox || 'allow-scripts allow-same-origin allow-forms allow-pointer-lock'
      );
      iframe.setAttribute('loading', 'lazy');
      iframe.setAttribute('referrerpolicy', 'no-referrer');
      body.appendChild(iframe);
    } else {
      body.innerHTML = `
        <div class="os-placeholder">
          <div class="ph-glyph" aria-hidden="true">${project.glyph}</div>
          <h4>${project.title}</h4>
          <p>${project.about}</p>
          <span class="ph-badge">Sandbox loading soon</span>
        </div>`;
    }
 
    const resize = document.createElement('div');
    resize.className = 'os-resize';
    resize.setAttribute('aria-hidden', 'true');
    body.appendChild(resize);
 
    el.append(titlebar, body);
 
    // Controls
    titlebar.querySelector('.os-close').addEventListener('click', () => closeWindow(id));
    titlebar.querySelector('.os-min').addEventListener('click', () => minimizeWindow(id));
    titlebar.querySelector('.os-max').addEventListener('click', () => toggleMaximize(id));
    titlebar.addEventListener('dblclick', (e) => {
      if (!e.target.closest('button')) toggleMaximize(id);
    });
 
    el.addEventListener('pointerdown', () => focusWindow(id));
 
    makeDraggable(el, titlebar);
    makeResizable(el, resize);
 
    return el;
  }
 
  function placeWindow(el, project) {
    const w = Math.min(project.width || 720, window.innerWidth - 32);
    const h = Math.min(project.height || 520, window.innerHeight - 96);
    el.style.width = w + 'px';
    el.style.height = h + 'px';
    const offset = (cascade++ % 5) * 32;
    el.style.left = Math.max(16, (window.innerWidth - w) / 2 + offset) + 'px';
    el.style.top = Math.max(16, (window.innerHeight - h) / 2.4 + offset) + 'px';
  }
 
  function buildTaskButton(id, project) {
    const btn = document.createElement('button');
    btn.innerHTML = `<span aria-hidden="true">${project.glyph}</span><span>${shortTitle(project.title)}</span>`;
    btn.addEventListener('click', () => {
      const win = openWindows.get(id);
      if (!win) return;
      if (win.minimized) {
        restoreWindow(id);
        focusWindow(id);
      } else if (win.el.classList.contains('focused')) {
        minimizeWindow(id);
      } else {
        focusWindow(id);
      }
    });
    return btn;
  }
 
  function shortTitle(title) {
    return title.length > 22 ? title.slice(0, 20).trimEnd() + '…' : title;
  }
 
  // ---------- Window state ----------
  function focusWindow(id) {
    for (const [otherId, win] of openWindows) {
      const isTarget = otherId === id;
      win.el.classList.toggle('focused', isTarget);
      win.taskBtn.classList.toggle('active', isTarget && !win.minimized);
    }
    const win = openWindows.get(id);
    if (win) win.el.style.zIndex = ++zCounter;
  }
 
  function closeWindow(id) {
    const win = openWindows.get(id);
    if (!win) return;
    win.el.remove();
    win.taskBtn.remove();
    openWindows.delete(id);
    if (openWindows.size === 0) taskbar.hidden = true;
  }
 
  function minimizeWindow(id) {
    const win = openWindows.get(id);
    if (!win) return;
    win.minimized = true;
    win.el.style.display = 'none';
    win.taskBtn.classList.add('minimized');
    win.taskBtn.classList.remove('active');
  }
 
  function restoreWindow(id) {
    const win = openWindows.get(id);
    if (!win) return;
    win.minimized = false;
    win.el.style.display = '';
    win.taskBtn.classList.remove('minimized');
  }
 
  function toggleMaximize(id) {
    const win = openWindows.get(id);
    if (!win) return;
    const el = win.el;
    if (el.classList.contains('maximized')) {
      el.classList.remove('maximized');
      const r = el._restoreRect;
      if (r) {
        el.style.left = r.left;
        el.style.top = r.top;
        el.style.width = r.width;
        el.style.height = r.height;
      }
    } else {
      el._restoreRect = {
        left: el.style.left,
        top: el.style.top,
        width: el.style.width,
        height: el.style.height,
      };
      el.classList.add('maximized');
    }
    focusWindow(id);
  }
 
  // ---------- Drag ----------
  function makeDraggable(el, handle) {
    handle.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button') || el.classList.contains('maximized')) return;
      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      const startLeft = el.offsetLeft;
      const startTop = el.offsetTop;
      el.classList.add('interacting');
      handle.setPointerCapture(e.pointerId);
 
      const onMove = (ev) => {
        const left = startLeft + (ev.clientX - startX);
        const top = startTop + (ev.clientY - startY);
        el.style.left = clamp(left, 8 - el.offsetWidth + 120, window.innerWidth - 120) + 'px';
        el.style.top = clamp(top, 8, window.innerHeight - 48) + 'px';
      };
      const onUp = () => {
        el.classList.remove('interacting');
        handle.removeEventListener('pointermove', onMove);
        handle.removeEventListener('pointerup', onUp);
        handle.removeEventListener('pointercancel', onUp);
      };
      handle.addEventListener('pointermove', onMove);
      handle.addEventListener('pointerup', onUp);
      handle.addEventListener('pointercancel', onUp);
    });
  }
 
  // ---------- Resize ----------
  function makeResizable(el, handle) {
    handle.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startY = e.clientY;
      const startW = el.offsetWidth;
      const startH = el.offsetHeight;
      el.classList.add('interacting');
      handle.setPointerCapture(e.pointerId);
 
      const onMove = (ev) => {
        el.style.width = Math.max(320, startW + (ev.clientX - startX)) + 'px';
        el.style.height = Math.max(240, startH + (ev.clientY - startY)) + 'px';
      };
      const onUp = () => {
        el.classList.remove('interacting');
        handle.removeEventListener('pointermove', onMove);
        handle.removeEventListener('pointerup', onUp);
        handle.removeEventListener('pointercancel', onUp);
      };
      handle.addEventListener('pointermove', onMove);
      handle.addEventListener('pointerup', onUp);
      handle.addEventListener('pointercancel', onUp);
    });
  }
 
  function clamp(v, min, max) {
    return Math.min(Math.max(v, min), max);
  }
 
  // Esc closes the focused window
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    for (const [id, win] of openWindows) {
      if (win.el.classList.contains('focused') && !win.minimized) {
        closeWindow(id);
        break;
      }
    }
  });
})();