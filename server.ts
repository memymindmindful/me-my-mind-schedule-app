import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { initDatabase } from './server/db';
import { eventsRouter } from './server/routes/events';
import { adminRouter } from './server/routes/admin';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize SQLite database
  await initDatabase();

  // Middleware setup
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Static uploads directory (cache for 1 day)
  const uploadsDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || './public/uploads');
  app.use('/uploads', express.static(uploadsDir, {
    maxAge: '1d',
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }));

  // Request logger
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });

  // Health check API
  app.get('/api/health', (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.json({
      status: 'ok',
      service: 'Me.My.Mind Schedule API',
      timestamp: new Date().toISOString()
    });
  });

  // Mount API Routers FIRST
  app.use('/api', eventsRouter);
  app.use('/api', adminRouter);

  // Global Error Handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[API Error]:', err);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Internal Server Error',
      code: err.code || 'SERVER_ERROR'
    });
  });

  // Vite development middleware vs Static Production bundle
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');

    // 1. Serve hashed asset files (JS/CSS in /assets with Vite hash in filename) - cache aggressively for 1 year
    app.use('/assets', express.static(path.join(distPath, 'assets'), {
      maxAge: '1y',
      immutable: true,
      setHeaders: (res) => {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }));

    // 2. Serve other root-level static files (favicon, manifest, robots, etc.) with 1 hour cache
    app.use(express.static(distPath, {
      index: false, // Don't serve index.html via express.static to avoid caching it
      maxAge: '1h',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    }));

    // 3. Serve index.html for SPA routes - NEVER cache (crucial for mobile/LINE browsers to get new build hashes)
    app.get('*', (req: Request, res: Response, next: NextFunction) => {
      // Skip API routes that fell through
      if (req.path.startsWith('/api/')) {
        return next();
      }

      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌿 Me.My.Mind Mindfulness Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal Server Boot Error:', err);
  process.exit(1);
});
