/*
 * Configuración de las landings (se carga antes que el resto).
 * - En tu laptop: API en IntelliJ (8080) y la plataforma con http-server (5500).
 * - Publicadas: la API en Render y la plataforma en Netlify.
 * Cuando pasen a los dominios propios, cambia solo NUBE (sin "/" al final en apiBase).
 */
(function () {
  const NUBE = {
    apiBase: 'https://obrix-api.onrender.com',
    appUrl: 'https://obrix-nexo-demo.netlify.app/'
  };
  const LOCAL = {
    apiBase: 'http://localhost:8080',
    appUrl: 'http://localhost:5500/'
  };
  const local = ['localhost', '127.0.0.1'].includes(location.hostname);
  window.OBRIX_LANDING = Object.freeze(local ? LOCAL : NUBE);
  // Indica a los estilos que hay JavaScript (activa animaciones de entrada sin parpadeo).
  document.documentElement.classList.add('js');
})();
