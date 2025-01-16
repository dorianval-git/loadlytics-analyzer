const isDev = process.env.NODE_ENV === 'development';

export const API_BASE_URL = isDev 
  ? '/api'  // This will be proxied to http://localhost:3001
  : 'http://localhost:3001'; 