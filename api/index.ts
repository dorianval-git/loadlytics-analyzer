import express from 'express';
import cors from 'cors';
import { analyzeStore } from './metrics.service';

// Create Express app
const app = express();

// Configure CORS for production and development
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://*.vercel.app', // Allow Vercel preview deployments
    process.env.NEXT_PUBLIC_FRONTEND_URL, // Your production frontend URL
  ].filter(Boolean),
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Body:`, req.body);
  next();
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Error] Global error handler:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    details: err.message
  });
});

// Main analyze endpoint
export default async function handler(req: express.Request, res: express.Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    console.log('[API] Starting analysis for:', url);
    const metrics = await analyzeStore(url);
    console.log('[API] Analysis complete:', metrics);
    res.json(metrics);
  } catch (error: any) {
    console.error('[API] Analysis failed:', error);
    res.status(500).json({ 
      error: 'Failed to analyze site',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);
}); 