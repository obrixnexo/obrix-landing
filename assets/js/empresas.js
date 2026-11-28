/**
 * Landing de constructoras.
 * - Kardex del hero que se completa paso a paso.
 * - Proceso en pestañas, calculadora "¿Cuánto podrías recuperar?", filtro de controles y áreas.
 * - Formulario "Agendar demo": valida con las mismas reglas que la API (POST /api/public/leads)
 *   y la solicitud llega al panel de Obrix, sección "Solicitudes".
 */
import { getJson, postJson, ApiError } from './lib/api.js';
import { isValidRuc, isValidMobile, isValidEmail } from './lib/validate.js';
import { initNav, initNavShadow, wireAppLinks, setYear } from './lib/nav.js';
import { initReveal, initTabs, countUp, reducedMotion } from './lib/ui.js';
import { money } from './lib/format.js';

const MESSAGES = {
  companyName: 'Escribe el nombre de la constructora.',
  contactName: 'Escribe tu nombre.',
  email: 'Escribe un correo válido, por ejemplo nombre@constructora.pe.',
  ruc: 'RUC no válido: revisa los 11 dígitos (el último es un dígito verificador).',
  phone: 'Celular no válido: son 9 dígitos y empieza con 9.',
  activeProjects: 'Escribe un número entre 0 y 999.',
  acceptsPrivacyPolicy: 'Para contactarte necesitamos que aceptes la política de privacidad.'
};

function readForm(form) {
  const v = name => form.elements[name].value.trim();
  return {
    companyName: v('companyName'),
    ruc: v('ruc') || null,
    contactName: v('contactName'),
    contactRole: v('contactRole') || null,
    email: v('email'),
    phone: v('phone') || null,
    activeProjects: v('activeProjects') === '' ? null : Number(v('activeProjects')),
    acceptsPrivacyPolicy: form.elements.acceptsPrivacyPolicy.checked
  };
}

function validate(data) {
  const errors = {};
  if (!data.companyName) errors.companyName = MESSAGES.companyName;
  if (!data.contactName) errors.contactName = MESSAGES.contactName;
  if (!isValidEmail(data.email)) errors.email = MESSAGES.email;
  if (data.ruc && !isValidRuc(data.ruc)) errors.ruc = MESSAGES.ruc;
  if (data.phone && !isValidMobile(data.phone)) errors.phone = MESSAGES.phone;
  if (data.activeProjects !== null && !(Number.isInteger(data.activeProjects) && data.activeProjects >= 0 && data.activeProjects <= 999)) {
    errors.activeProjects = MESSAGES.activeProjects;
  }
  if (!data.acceptsPrivacyPolicy) errors.acceptsPrivacyPolicy = MESSAGES.acceptsPrivacyPolicy;
  return errors;
}

function showErrors(form, errors) {
  for (const el of form.elements) {
    if (!el.name) continue;
    const box = form.querySelector(`#${el.name}-error`);
    const msg = errors[el.name] || '';
    if (box) box.textContent = msg;
    if (msg) { el.setAttribute('aria-invalid', 'true'); el.setAttribute('aria-describedby', `${el.name}-error`); }
    else { el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); }
  }
  const first = Object.keys(errors)[0];
  if (first) form.elements[first]?.focus();
}

function setStatus(form, text, kind = '') {
  const status = form.querySelector('[data-status]');
  status.textContent = text;
  status.dataset.kind = kind;
}

function showDone(form, data) {
  form.innerHTML = `<div class="demo__done" tabindex="-1">
    <span class="icon-box"><svg class="i" aria-hidden="true"><use href="/assets/img/icons.svg#check-circle"/></svg></span>
    <h3>Solicitud recibida</h3>
    <p>Gracias, <span data-name></span>. Te escribiremos a <b data-email></b> en 1 día hábil para coordinar la demo para <span data-company></span>.</p>
  </div>`;
  // textContent: lo que escribió la persona nunca se interpreta como HTML
  form.querySelector('[data-name]').textContent = data.contactName.split(/\s+/)[0];
  form.querySelector('[data-email]').textContent = data.email;
  form.querySelector('[data-company]').textContent = data.companyName.replace(/\.+$/, '');   // "S.A.C." + punto final = "S.A.C.."
  form.querySelector('.demo__done').focus();
}

function initLeadForm() {
  const form = document.querySelector('[data-lead-form]');
  if (!form) return;
  const button = form.querySelector('[data-submit]');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const data = readForm(form);
    const errors = validate(data);
    showErrors(form, errors);
    if (Object.keys(errors).length) { setStatus(form, 'Revisa los campos marcados.', 'error'); return; }

    button.disabled = true;
    button.textContent = 'Enviando…';
    setStatus(form, '');
    const slow = setTimeout(() => setStatus(form, 'Esto puede tardar hasta un minuto la primera vez. No cierres la página.'), 5000);
    try {
      await postJson('/api/public/leads', data, { timeoutMs: 120000 });
      showDone(form, data);
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length) showErrors(form, err.fields);
      setStatus(form, err.message, 'error');
      button.disabled = false;
      button.textContent = 'Agendar demo';
    } finally {
      clearTimeout(slow);
    }
  });
}

/* ---------- kardex del hero: las filas se completan una tras otra ---------- */
function initKardex() {
  const box = document.querySelector('[data-kardex]');
  if (!box || reducedMotion()) return;
  const rows = [...box.querySelectorAll('.kardex__rows li')];
  const amount = box.querySelector('[data-kardex-amount]');
  const replay = box.querySelector('[data-kardex-replay]');
  const total = 4850;
  let timers = [];

  function play() {
    timers.forEach(clearTimeout); timers = [];
    box.classList.add('is-anim');
    rows.forEach(r => r.classList.remove('is-done', 'is-now'));
    replay.hidden = true;
    amount.textContent = money(0);
    rows.forEach((row, i) => {
      timers.push(setTimeout(() => {
        rows.forEach(r => r.classList.remove('is-now'));
        row.classList.add('is-done', 'is-now');
        if (i === rows.length - 1) {
          countUp(amount, total, money, 1100);
          timers.push(setTimeout(() => { row.classList.remove('is-now'); replay.hidden = false; }, 1300));
        }
      }, 500 + i * 650));
    });
  }
  replay.addEventListener('click', play);
  // empieza cuando el kardex se ve en pantalla
  new IntersectionObserver(([e], io) => { if (e.isIntersecting) { play(); io.disconnect(); } }, { threshold: .4 }).observe(box);
}

/* ---------- calculadora ---------- */
function initCalculator() {
  const form = document.querySelector('[data-calc]');
  if (!form) return;
  const value = form.querySelector('#calc-value');
  const rate = form.querySelector('#calc-rate');
  const soles = n => 'S/ ' + Math.round(n).toLocaleString('es-PE');
  const update = () => {
    const v = Number(value.value), r = Number(rate.value);
    form.querySelector('[data-calc-value]').textContent = soles(v);
    form.querySelector('[data-calc-rate]').textContent = `${r} %`;
    form.querySelector('[data-calc-total]').textContent = soles(v * r / 100);
    form.querySelector('[data-calc-bar]').style.width = `${r}%`;
    // texto que leen los lectores de pantalla en los deslizadores
    value.setAttribute('aria-valuetext', soles(v));
    rate.setAttribute('aria-valuetext', `${r} por ciento`);
  };
  form.addEventListener('input', update);
  form.addEventListener('submit', e => e.preventDefault());
  update();
}

/* ---------- filtro de controles (Todos / Disponibles / En desarrollo) ---------- */
function initFilter() {
  const group = document.querySelector('[data-filter]');
  const list = document.querySelector('[data-filter-list]');
  if (!group || !list) return;
  group.addEventListener('click', e => {
    const btn = e.target.closest('[data-filter-value]');
    if (!btn) return;
    const value = btn.dataset.filterValue;
    group.querySelectorAll('[data-filter-value]').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    list.querySelectorAll('[data-status]').forEach(card => {
      card.classList.toggle('is-hidden', value !== 'all' && card.dataset.status !== value);
    });
  });
}

/* Despierta la API en cuanto se abre la página, para que el formulario responda rápido. */
function wakeApi() { getJson('/api/public/settings', { timeoutMs: 120000 }).catch(() => {}); }

initNav();
initNavShadow();
wireAppLinks();
setYear();
initReveal();
initKardex();
document.querySelectorAll('[data-tabs]').forEach(initTabs);
initCalculator();
initFilter();
initLeadForm();
wakeApi();
