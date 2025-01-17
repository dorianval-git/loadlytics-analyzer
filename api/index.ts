import { analyzeStore } from './metrics.service';
import type { IncomingMessage, ServerResponse } from 'http';

const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://loadlytics-analyzer.vercel.app';

module.exports = async (req, res) => {
  // Log the incoming request
  console.log('[API] Received request:', {
    method: req.method,
    url: req.url,
    origin: req.headers.origin,
  });

  // Enable CORS with specific origin
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Add request timeout
  const timeout = setTimeout(() => {
    console.error('[API] Request timeout');
    res.status(504).json({ 
      error: 'Gateway Timeout',
      message: 'The request took too long to process'
    });
  }, 50000); // 50 second timeout

  try {
    // Validate request
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    if (!req.body?.url) {
      throw new Error('URL is required');
    }

    // Validate URL format
    const { url } = req.body;
    try {
      new URL(url);
    } catch {
      throw new Error('Invalid URL format');
    }

    // Process request
    const metrics = await analyzeStore(url);
    clearTimeout(timeout);
    
    if (!metrics) {
      throw new Error('Analysis returned no data');
    }

    res.status(200).json(metrics);
  } catch (error: any) {
    clearTimeout(timeout);
    console.error('[API] Error:', error);
    
    const statusCode = error.message.includes('timeout') ? 504 
      : error.message.includes('not allowed') ? 405
      : error.message.includes('required') || error.message.includes('Invalid URL') ? 400
      : 500;

    res.status(statusCode).json({ 
      error: 'Analysis failed',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}; 