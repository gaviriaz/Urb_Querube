// Configuración dinámica del backend para local y producción (Cloudflare Pages + Render)
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Si es local, usamos rutas relativas para apoyarnos en el proxy de Vite.
// Si es producción, apuntamos a la URL del backend remoto (configurable por variable de entorno o fallback a Render).
export const BACKEND_URL = isLocal
  ? ''
  : (import.meta.env.VITE_BACKEND_URL || 'https://urb-querube-backend.onrender.com');

export const API_BASE_URL = isLocal ? '/api' : `${BACKEND_URL}/api`;

export const WS_BASE_URL = (() => {
  if (isLocal) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws`;
  }
  // En producción, convertimos la URL de Render (https) a WebSocket (wss)
  const wsProtocol = BACKEND_URL.startsWith('https') ? 'wss:' : 'ws:';
  const cleanHost = BACKEND_URL.replace(/^(https?:\/\/)/, '');
  return `${wsProtocol}//${cleanHost}/ws`;
})();
