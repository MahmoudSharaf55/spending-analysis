import { Request, Response, NextFunction } from 'express';

/**
 * Global HTTP Request Logging Middleware
 * Logs method, URL, status code, response time, and client IP (with proxy support).
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const { method, originalUrl } = req;
  const clientIp =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    req.ip ||
    'unknown';

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const timestamp = new Date().toISOString();

    // Clean terminal formatting
    const statusIndicator = statusCode >= 500 ? '🔴' : statusCode >= 400 ? '🟡' : '🟢';

    console.log(
      `[HTTP] ${timestamp} ${statusIndicator} ${method} ${originalUrl} | Status: ${statusCode} | Duration: ${duration}ms | IP: ${clientIp}`
    );
  });

  next();
}
