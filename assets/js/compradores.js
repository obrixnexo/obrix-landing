/**
 * Landing de compradores.
 * - Vitrina del hero, contador "N saldos disponibles" y carrusel con saldos reales de la API.
 * - Si la API está dormida o no hay saldos, la vitrina muestra categorías (nunca queda vacía)
 *   y se sigue intentando en segundo plano; de paso despierta la API antes de entrar a la tienda.
 * - Guía "Cómo comprar" con pestañas que avanzan solas.
 */
import { getJson, apiUrl } from './lib/api.js';
import { money, esc, unitQty } from './lib/format.js';
import { initNav, initNavShadow, wireAppLinks, setYear } from './lib/nav.js';
import { initReveal, initTabs, initCarousel, countUp } from './lib/ui.js';

const { appUrl } = window.OBRIX_LANDING;
const LATEST = 10;
const ICONS = '/assets/img/icons.svg';
const icon = (id, cls = 'i') => `<svg class="${cls}" aria-hidden="true"><use href="${ICONS}#${id}"/></svg>`;

const CONDITION = { NUEVO_SELLADO: 'Nuevo, sellado', NUEVO_ABIERTO: 'Nuevo, caja abierta', NUEVO: 'Nuevo' };
const FALLBACK = [
  { id: 1, name: 'Sanitarios y grifería' },
  { id: 2, name: 'Instalaciones eléctricas' },
  { id: 5, name: 'Pisos y revestimientos' }
];

let carousel = null;

function listingCard(item, { eager = false } = {}) {
  const photo = item.photoUrl
    ? `<img src="${esc(apiUrl(item.photoUrl))}" alt="" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} width="400" height="300">`
    : icon(`cat-${item.categoryId || 15}`);
  const condition = CONDITION[item.condition];
  return `<a class="listing" href="${appUrl}#/saldo/${encodeURIComponent(item.publicCode)}" aria-label="${esc(item.title)}, ${money(item.unitPriceWithIgv)}">
    <div class="listing__photo${item.photoUrl ? '' : ' listing__photo--empty'}">${photo}${condition ? `<span class="listing__badge">${esc(condition)}</span>` : ''}</div>
    <div class="listing__body">
      <span class="listing__code code">${esc(item.publicCode)}</span>
      <span class="listing__title">${esc(item.title)}</span>
      <span class="listing__meta">${icon('pin')}${esc(unitQty(item.quantityAvailable, item.unitCode))} · ${esc(item.district)}</span>
      <div class="listing__foot">
        <span class="listing__price num">${money(item.unitPriceWithIgv)}<small>por ${esc((item.unitName || 'unidad').toLowerCase())}, con IGV</small></span>
        <span class="listing__go" aria-hidden="true">${icon('arrow')}</span>
      </div>
    </div>
  </a>`;
}

function categoryCard(cat) {
  return `<a class="listing listing--category" href="${appUrl}#/saldos?cat=${cat.id}">
    <div class="listing__photo">${icon(`cat-${cat.id}`)}</div>
    <div class="listing__body">
      <span class="listing__title">${esc(cat.name)}</span>
      <span class="listing__meta">Saldos de obras de Lima</span>
      <div class="listing__foot"><span class="listing__price" style="font-size:1rem">Ver saldos</span><span class="listing__go" aria-hidden="true">${icon('arrow')}</span></div>
    </div>
  </a>`;
}

function fillShowcase(cards) {
  const box = document.querySelector('[data-showcase]');
  const [main, a, b] = cards;
  box.querySelector('.showcase__main').outerHTML = `<div class="showcase__main">${main}</div>`;
  box.querySelector('.showcase__mini--a').outerHTML = a ? `<div class="showcase__mini showcase__mini--a">${a}</div>` : '';
  box.querySelector('.showcase__mini--b').outerHTML = b ? `<div class="showcase__mini showcase__mini--b">${b}</div>` : '';
}

function renderListings(page) {
  const items = page.items;
  const withPhoto = [...items.filter(i => i.photoUrl), ...items.filter(i => !i.photoUrl)];
  fillShowcase(withPhoto.slice(0, 3).map((i, k) => listingCard(i, { eager: k === 0 })));

  const total = page.totalItems ?? items.length;
  const text = document.querySelector('[data-live-text]');
  text.innerHTML = '<b class="num" data-count>0</b> saldos disponibles hoy en Lima';
  countUp(text.querySelector('[data-count]'), total);

  document.querySelector('[data-latest-list]').innerHTML = items.map(i => `<li>${listingCard(i)}</li>`).join('');
  document.querySelector('[data-latest]').hidden = false;
  carousel?.update();
}

function renderFallback() {
  fillShowcase(FALLBACK.map(categoryCard));
}

async function loadListings() {
  const path = `/api/public/listings?size=${LATEST}&sort=recent`;
  try {
    const page = await getJson(path, { timeoutMs: 12000 });
    if (page?.items?.length) renderListings(page); else renderFallback();
  } catch {
    renderFallback();
    try { // la API gratuita puede estar despertando
      const page = await getJson(path, { timeoutMs: 120000 });
      if (page?.items?.length) renderListings(page);
    } catch { /* se queda con las categorías */ }
  }
}

async function loadSettings() {
  try {
    const s = await getJson('/api/public/settings', { timeoutMs: 120000 });
    if (s?.minOrderAmount != null) document.querySelectorAll('[data-min-order]').forEach(el => { el.textContent = money(s.minOrderAmount); });
  } catch { /* se queda el valor del HTML */ }
}

function initSearch() {
  const form = document.querySelector('[data-search]');
  form?.addEventListener('submit', e => {
    e.preventDefault();
    const q = form.q.value.trim();
    location.href = `${appUrl}#/saldos${q ? `?q=${encodeURIComponent(q)}` : ''}`;
  });
}

initNav();
initNavShadow();
wireAppLinks();
setYear();
initSearch();
initReveal();
document.querySelectorAll('[data-tabs]').forEach(initTabs);
const carouselRoot = document.querySelector('[data-carousel]');
if (carouselRoot) carousel = initCarousel(carouselRoot);
loadListings();
loadSettings();
