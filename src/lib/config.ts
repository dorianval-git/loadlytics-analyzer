const isDev = process.env.NODE_ENV === 'development';
const VERCEL_URL = process.env.VERCEL_URL;

export const API_BASE_URL = isDev 
  ? '/api'  // Development: proxied through Vite
  : VERCEL_URL 
    ? `https://${VERCEL_URL}/api` // Vercel deployment
    : '/api'; // Fallback 