import dotenv from 'dotenv';
import path from 'path';
import os from 'os';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/talentflow_ai',
  jwt: {
    secret: process.env.JWT_SECRET || 'talentflow_dev_secret_key_2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  redis: {
    url: process.env.REDIS_URL || '',
    isConfigured: Boolean(process.env.REDIS_URL),
  },
  storage: {
    tempDir: process.env.VERCEL
      ? path.join(os.tmpdir(), 'talentflow_temp')
      : path.resolve(process.cwd(), process.env.TEMP_UPLOAD_DIR || './uploads/temp'),
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '15', 10),
  },
};
