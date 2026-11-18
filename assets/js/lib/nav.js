/** Menú móvil accesible: botón con aria-expanded y cierre con Escape o al elegir un enlace. */
export function initNav() {
  const nav = document.querySelector('[data-nav]');
  const toggle = nav?.querySelector('[data-nav-toggle]');
  if (!nav || !toggle) return;
  const set = open => {
    nav.dataset.open = String(open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.sr-only').textContent = open ? 'Cerrar menú' : 'Abrir menú';
  };
  toggle.addEventListener('click', () => set(nav.dataset.open !== 'true'));
  nav.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.dataset.open === 'true') { set(false); toggle.focus(); } });
}

/** Enlaces hacia la plataforma: data-app="#/saldos" → https://…/#/saldos */
export function wireAppLinks(root = document) {
  const { appUrl } = window.OBRIX_LANDING;
  root.querySelectorAll('[data-app]').forEach(a => { a.href = appUrl + a.dataset.app; });
}

/** Año actual en el pie. */
export function setYear() {
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
}

/** La barra flotante gana sombra al bajar (indica que el contenido pasa por debajo). */
export function initNavShadow() {
  const nav = document.querySelector('[data-nav]');
  if (!nav) return;
  const on = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', on, { passive: true });
  on();
}
