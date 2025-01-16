const isDev = import.meta.env.DEV;
const VERCEL_URL = import.meta.env.VITE_VERCEL_URL || process.env.VERCEL_URL;

export const API_BASE_URL = isDev 
  ? '/api'  // Development: proxied through Vite
  : VERCEL_URL 
    ? `https://${VERCEL_URL}/api` // Vercel deployment
    : window.location.origin + '/api'; // Fallback for other environments

console.log('[Config] API Base URL:', API_BASE_URL);
console.log('[Config] Environment:', isDev ? 'Development' : 'Production'); 