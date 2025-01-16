import { analyzeStore } from './metrics.service';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Export the handler function
module.exports = async (req: VercelRequest, res: VercelResponse) => {
  // Log the incoming request
  console.log('[API] Received request:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
  });

  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    console.log('[API] Handling OPTIONS request');
    res.status(200).end();
    return;
  }

  // Ensure request method is POST
  if (req.method !== 'POST') {
    console.log('[API] Invalid method:', req.method);
    res.status(405).json({ 
      error: 'Method not allowed', 
      message: 'Only POST requests are allowed',
      allowedMethods: ['POST'] 
    });
    return;
  }

  try {
    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      console.log('[API] Invalid request body:', req.body);
      res.status(400).json({ error: 'Invalid request body' });
      return;
    }

    const { url } = req.body;
    console.log('[API] Received URL:', url);
    
    if (!url) {
      console.log('[API] Missing URL in request');
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    try {
      new URL(url);
    } catch (error) {
      console.log('[API] Invalid URL format:', error);
      res.status(400).json({ error: 'Invalid URL format' });
      return;
    }

    console.log('[API] Starting analysis for:', url);
    const metrics = await analyzeStore(url);
    
    if (!metrics) {
      console.log('[API] No metrics returned from analysis');
      throw new Error('Analysis returned no data');
    }
    
    console.log('[API] Analysis complete');
    res.status(200).json(metrics);
  } catch (error: any) {
    console.error('[API] Analysis failed:', error);
    res.status(500).json({ 
      error: 'Failed to analyze site',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}; 