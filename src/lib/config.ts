const VERCEL_URL = import.meta.env.VITE_VERCEL_URL || process.env.VERCEL_URL;
const API_URL = import.meta.env.VITE_API_URL;

export const API_BASE_URL = 
  API_URL ? API_URL :
  VERCEL_URL ? `https://${VERCEL_URL}/api` :
  '/api'; // Fallback for development

console.log('[Config] API Base URL:', API_BASE_URL);
console.log('[Config] Environment:', import.meta.env.DEV ? 'Development' : 'Production'); 