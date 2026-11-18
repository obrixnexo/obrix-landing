/** Formatos para mostrar datos de la API. */
export const money = n => 'S/ ' + Number(n ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const qty = n => Number(n ?? 0).toLocaleString('es-PE', { maximumFractionDigits: 2 });

/** Escapa texto antes de insertarlo como HTML. */
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const UNIT_WORDS = { UND: ['und', 'und'], PAR: ['par', 'pares'], PQT: ['paquete', 'paquetes'], CAJA: ['caja', 'cajas'], ROLLO: ['rollo', 'rollos'], BOLSA: ['bolsa', 'bolsas'], BALDE: ['balde', 'baldes'], GALON: ['galón', 'galones'], KG: ['kg', 'kg'], M: ['m', 'm'], M2: ['m²', 'm²'], M3: ['m³', 'm³'], MILLAR: ['millar', 'millares'], PLANCHA: ['plancha', 'planchas'], VARILLA: ['varilla', 'varillas'] };
/** "30 rollos", "1 rollo", "120 m²". */
export const unitQty = (n, code) => {
  const u = UNIT_WORDS[code];
  const word = u ? u[Number(n) === 1 ? 0 : 1] : String(code || '').toLowerCase();
  return `${qty(n)} ${word}`;
};
