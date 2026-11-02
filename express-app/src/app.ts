import express, { Application } from 'express';
import cors from 'cors';
import analyzerRouter from './routes/analyzer.routes.js';
import { errorHandler } from './middleware/errorHandler.middleware.js';

export function createApp(): Application {
  const app = express();

  // Enable CORS for frontend clients
  app.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  );

  // Body parsing middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use('/api', analyzerRouter);

  // Root endpoint info
  app.get('/', (_req, res) => {
    res.json({
      name: 'Bank Statement Analyzer POC API',
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
