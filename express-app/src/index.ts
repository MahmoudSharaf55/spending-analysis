import { createApp } from './app.js';
import { config } from './config/index.js';

const app = createApp();
const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log(`[Backend Server] Server running on http://localhost:${PORT}`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('[Backend Server] SIGTERM received. Gracefully shutting down...');
  server.close(() => {
    console.log('[Backend Server] Process terminated.');
  });
});
