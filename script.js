// Theme toggle (initial theme is set inline in <head> before paint)
const toggle = document.getElementById('theme-toggle');
toggle.addEventListener('click', () => {
  const root = document.documentElement;
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});
 
// Scroll-reveal
const revealObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.12 }
);
 
document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));
 
// Active nav-link highlighting
const navLinks = document.querySelectorAll('.nav-links a');
const sections = [...navLinks]
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);
 
const activeObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        navLinks.forEach((link) =>
          link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`)
        );
      }
    }
  },
  { rootMargin: '-40% 0px -55% 0px' }
);
 
sections.forEach((section) => activeObserver.observe(section));
 
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 
// Mobile menu
const burger = document.getElementById('nav-burger');
const navLinksEl = document.querySelector('.nav-links');
 
burger.addEventListener('click', (e) => {
  e.stopPropagation();
  const open = navLinksEl.classList.toggle('open');
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});
 
const closeMenu = () => {
  navLinksEl.classList.remove('open');
  burger.setAttribute('aria-expanded', 'false');
  burger.setAttribute('aria-label', 'Open menu');
};
 
navLinksEl.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') closeMenu();
});
 
document.addEventListener('click', (e) => {
  if (navLinksEl.classList.contains('open') && !e.target.closest('.nav')) closeMenu();
});
 
// Hero typewriter
const typewriterEl = document.getElementById('typewriter');
const ROLES = [
  'Software Developer',
  'Machine Learning Engineer',
  'Data & BI Analyst',
  'UI/UX Designer',
];
 
if (!reducedMotion) {
  let roleIndex = 0;
  let charIndex = ROLES[0].length;
  let deleting = true;
 
  const tick = () => {
    if (deleting) {
      charIndex--;
      if (charIndex === 0) {
        deleting = false;
        roleIndex = (roleIndex + 1) % ROLES.length;
      }
    } else {
      charIndex++;
    }
    typewriterEl.textContent = ROLES[roleIndex].slice(0, charIndex) || ' ';
    const doneTyping = !deleting && charIndex === ROLES[roleIndex].length;
    if (doneTyping) deleting = true;
    setTimeout(tick, doneTyping ? 1800 : deleting ? 45 : 85);
  };
  setTimeout(tick, 2200); // let the hero reveal finish first
}
 
// Scroll progress + back-to-top
const progressBar = document.getElementById('scroll-progress');
const backToTop = document.getElementById('back-to-top');
 
window.addEventListener('scroll', () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.width = max > 0 ? `${(window.scrollY / max) * 100}%` : '0';
  backToTop.hidden = window.scrollY < 600;
}, { passive: true });
 
backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
});
 
// Animated stat counters
const statsObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    statsObserver.unobserve(entry.target);
    const el = entry.target;
    const target = Number(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    if (reducedMotion) {
      el.textContent = target + suffix;
      continue;
    }
    const duration = 1200;
    const start = performance.now();
    const count = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased) + (t === 1 ? suffix : '');
      if (t < 1) requestAnimationFrame(count);
    };
    requestAnimationFrame(count);
  }
}, { threshold: 0.6 });
 
document.querySelectorAll('.stat-num').forEach((el) => statsObserver.observe(el));