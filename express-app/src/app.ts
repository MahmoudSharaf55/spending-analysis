import express, { Application } from 'express';
import cors from 'cors';
import analyzerRouter from './routes/analyzer.routes.js';
import { errorHandler } from './middleware/errorHandler.middleware.js';
import { requestLogger } from './middleware/requestLogger.middleware.js';

export function createApp(): Application {
  const app = express();

  // Trust reverse proxy (Nginx) headers for accurate client IP
  app.set('trust proxy', true);

  // Global HTTP Request Logger
  app.use(requestLogger);

  // Enable CORS for frontend clients
  app.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  );

  // Body parsing middlewares (25MB limit to allow statements with hundreds of transactions)
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // API Routes
  app.use('/api', analyzerRouter);

  // Root endpoint info
  app.get('/', (_req, res) => {
    res.json({
      name: 'BankIQ API',
      version: '1.0.0',
      status: 'active',
      endpoints: {
        analyze: 'POST /api/analyze',
        status: 'GET /api/status'
      }
    });
  });

  // Centralized error handling middleware
  app.use(errorHandler);

  return app;
}
