import { createApp } from './app.js';
import { config, loadedEnvPath } from './config/index.js';

const app = createApp();
const PORT = config.port;

function maskApiKey(key?: string): string {
  if (!key || key.trim() === '') {
    return 'NOT CONFIGURED (Local heuristic fallback active)';
  }
  const trimmed = key.trim();
  if (trimmed.length <= 10) return '*** (configured)';
  return `${trimmed.slice(0, 8)}...${trimmed.slice(-4)} (${trimmed.length} chars)`;
}

const server = app.listen(PORT, () => {
  const maxMb = Math.round(config.upload.maxFileSize / (1024 * 1024));

  console.log('\n======================================================');
  console.log('   🚀 BankIQ API Server Initialized');
  console.log('======================================================');
  console.log(`  • Status:             ONLINE`);
  console.log(`  • Port:               ${PORT}`);
  console.log(`  • Environment:        ${config.nodeEnv}`);
  console.log(`  • Loaded .env Path:   ${loadedEnvPath || 'NONE (using system environment)'}`);
  console.log(`  • OpenRouter API Key: ${maskApiKey(config.openRouter.apiKey)}`);
  console.log(`  • OpenRouter Model:   ${config.openRouter.model || '(auto/fallback)'}`);
  console.log(`  • OpenRouter BaseURL: ${config.openRouter.baseUrl}`);
  console.log(`  • Max Upload Size:    ${maxMb} MB`);
  console.log(`  • Allowed Formats:    ${config.upload.allowedExtensions.join(', ')}`);
  console.log(`  • Health Check URL:   http://localhost:${PORT}/api/status`);
  console.log('======================================================\n');
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('[Backend Server] SIGTERM received. Gracefully shutting down...');
  server.close(() => {
    console.log('[Backend Server] Process terminated.');
  });
});
