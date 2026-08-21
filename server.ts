import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { app, ensureDataSeeded } from './server/app.js';

dotenv.config();

const PORT = 3000;

async function startServer() {
  // Ensure database initialization
  await ensureDataSeeded();

  // ---------------- Vite Middleware (Local Development & Container Production) ----------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SPA fallback only for non-API routes
    app.get('*', (req: Request, res: Response) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Endpoint not found', path: req.path });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SSL Billing GST App running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

