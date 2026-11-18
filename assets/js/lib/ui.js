/**
 * Componentes interactivos comunes de las landings (sin librerías).
 * Todos son accesibles con teclado y respetan "reducir movimiento" del sistema.
 */
export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Muestra con una transición suave los bloques marcados con .reveal al entrar en pantalla. */
export function initReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || reducedMotion()) { items.forEach(el => el.classList.add('is-in')); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -10% 0px' });
  items.forEach(el => io.observe(el));
}

/**
 * Pestañas accesibles (patrón WAI-ARIA).
 * Marcado: [data-tabs] con botones [role=tab][aria-controls] y paneles [role=tabpanel].
 * Opcional: data-autoplay="6000" avanza solo hasta que la persona interactúa.
 */
export function initTabs(root) {
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  if (!tabs.length) return null;
  let current = Math.max(0, tabs.findIndex(t => t.getAttribute('aria-selected') === 'true'));
  let timer = null;
  const delay = Number(root.dataset.autoplay || 0);

  function select(i, { focus = false, user = false } = {}) {
    current = (i + tabs.length) % tabs.length;
    tabs.forEach((t, k) => {
      const on = k === current;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls'));
      if (panel) panel.hidden = !on;
    });
    if (focus) tabs[current].focus();
    if (user) stop();
    root.dispatchEvent(new CustomEvent('tabchange', { detail: { index: current } }));
    if (timer) restartProgress();
  }

  function restartProgress() {
    root.style.setProperty('--autoplay', `${delay}ms`);
    root.classList.remove('is-playing');
    void root.offsetWidth; // reinicia la animación de la barra de progreso
    root.classList.add('is-playing');
  }
  function start() {
    if (!delay || reducedMotion() || timer) return;
    timer = setInterval(() => select(current + 1), delay);
    restartProgress();
  }
  function stop() { clearInterval(timer); timer = null; root.classList.remove('is-playing'); }

  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i, { user: true }));
    t.addEventListener('keydown', e => {
      const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      if (e.key in keys) { e.preventDefault(); select(current + keys[e.key], { focus: true, user: true }); }
      if (e.key === 'Home') { e.preventDefault(); select(0, { focus: true, user: true }); }
      if (e.key === 'End') { e.preventDefault(); select(tabs.length - 1, { focus: true, user: true }); }
    });
  });

  // El autoplay solo corre mientras el bloque está a la vista.
  if (delay && 'IntersectionObserver' in window) {
    let touched = false;
    root.addEventListener('pointerdown', () => { touched = true; stop(); }, { once: true });
    new IntersectionObserver(([e]) => { if (e.isIntersecting && !touched) start(); else stop(); }, { threshold: .35 }).observe(root);
  }
  select(current);
  return { select, stop };
}

/** Cuenta animada hasta un número (por ejemplo, saldos disponibles o soles recuperados). */
export function countUp(el, to, format = n => String(Math.round(n)), ms = 900) {
  if (reducedMotion()) { el.textContent = format(to); return; }
  const from = 0, t0 = performance.now();
  const step = now => {
    const p = Math.min(1, (now - t0) / ms);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = format(from + (to - from) * eased);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** Carrusel horizontal con botones anterior/siguiente (el desplazamiento táctil funciona solo). */
export function initCarousel(root) {
  const track = root.querySelector('[data-track]');
  const prev = root.querySelector('[data-prev]');
  const next = root.querySelector('[data-next]');
  if (!track) return;
  const page = () => Math.max(track.clientWidth * 0.85, 240);
  const update = () => {
    if (prev) prev.disabled = track.scrollLeft <= 4;
    if (next) next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
  };
  prev?.addEventListener('click', () => track.scrollBy({ left: -page(), behavior: reducedMotion() ? 'auto' : 'smooth' }));
  next?.addEventListener('click', () => track.scrollBy({ left: page(), behavior: reducedMotion() ? 'auto' : 'smooth' }));
  track.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
  return { update };
}
