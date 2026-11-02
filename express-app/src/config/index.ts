import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  openRouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    model: process.env.OPENROUTER_MODEL,
    baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
  },
  upload: {
    maxFileSize: 25 * 1024 * 1024, // 25 MB
    allowedExtensions: ['.pdf', '.csv']
  }
};
