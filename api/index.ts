import { analyzeStore } from './metrics.service';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  console.log('[API] Received request:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body
  });

  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  console.log('[API] CORS headers set');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    console.log('[API] Handling OPTIONS request');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.log('[API] Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;
    console.log('[API] Received URL:', url);
    
    if (!url) {
      console.log('[API] Missing URL in request');
      return res.status(400).json({ error: 'URL is required' });
    }

    try {
      new URL(url);
    } catch (error) {
      console.log('[API] Invalid URL format:', error);
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    console.log('[API] Starting analysis for:', url);
    const metrics = await analyzeStore(url);
    
    if (!metrics) {
      console.log('[API] No metrics returned from analysis');
      throw new Error('Analysis returned no data');
    }
    
    console.log('[API] Analysis complete:', metrics);
    return res.status(200).json(metrics);
  } catch (error: any) {
    console.error('[API] Analysis failed:', error);
    return res.status(500).json({ 
      error: 'Failed to analyze site',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 