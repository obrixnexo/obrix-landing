/**
 * Cliente mínimo de la API pública de Obrix Nexo.
 * La API gratuita (Render) se duerme tras 15 min sin uso y tarda ~1–2 min en despertar,
 * por eso cada llamada tiene un tiempo máximo y las landings nunca dependen de ella para mostrarse.
 */
const { apiBase } = window.OBRIX_LANDING;

export class ApiError extends Error {
  constructor(status, data) {
    const fields = data?.fields ? Object.values(data.fields) : [];
    super(fields[0] || data?.detail || (status === 0
      ? 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.'
      : 'Algo salió mal. Inténtalo de nuevo en un momento.'));
    this.status = status;
    this.code = data?.code;
    this.fields = data?.fields || {};
  }
}

async function request(path, { method = 'GET', body, timeoutMs = 20000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(apiBase + path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });
    const text = res.status === 204 ? '' : await res.text();
    let data = null;
    if (text) { try { data = JSON.parse(text); } catch { data = null; } }
    if (!res.ok) throw new ApiError(res.status, data);
    return data;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(0, null); // sin conexión, CORS o tiempo agotado
  } finally {
    clearTimeout(timer);
  }
}

export const getJson = (path, opts) => request(path, opts);
export const postJson = (path, body, opts) => request(path, { ...opts, method: 'POST', body });

/** Dirección completa de un recurso de la API (por ejemplo, la foto de un saldo). */
export const apiUrl = path => (path?.startsWith('http') ? path : apiBase + path);
