/**
 * Mismas reglas que la API (RucValidator y ValidationPatterns), para avisar antes de enviar.
 */

/** RUC de SUNAT: prefijo válido + dígito verificador. */
export function isValidRuc(value) {
  const r = (value || '').trim();
  if (!/^\d{11}$/.test(r) || !['10', '15', '16', '17', '20'].includes(r.slice(0, 2))) return false;
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = weights.reduce((acc, w, i) => acc + w * Number(r[i]), 0);
  const d = 11 - (sum % 11);
  return (d === 10 ? 0 : d === 11 ? 1 : d) === Number(r[10]);
}

/** Celular peruano: 9 dígitos que empiezan con 9; acepta +51 y espacios. */
export const isValidMobile = value => /^(\+?51)? *9( ?[0-9]){8}$/.test((value || '').trim());

export const isValidEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((value || '').trim());
