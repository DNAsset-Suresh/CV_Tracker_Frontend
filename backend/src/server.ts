import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { config } from './config/index.js';
import { connectDB, maskMongoCredentials } from './config/db.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';

const app = express();

// Security and CORS middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

if (config.env !== 'test') {
  app.use(morgan('dev'));
}

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

app.use('/api', apiLimiter);

// Root greeting & status (available even if DB is connecting)
app.get('/', (_req, res) => {
  res.json({
    application: 'TalentFlow AI',
    status: 'Running',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    version: '1.0.0',
    documentation: '/docs',
    apiBase: '/api',
  });
});

// Database Readiness Gate - Awaits connectDB() BEFORE mounting login and protected API routes
app.use('/api', async (_req, res, next) => {
  try {
    const conn = await connectDB();
    if (!conn || mongoose.connection.readyState !== 1) {
      logger.error('[Database Error] Service Unavailable: MongoDB connection is not active.');
      res.status(503).json({
        success: false,
        message: 'Database service is temporarily unavailable. Please verify MongoDB Atlas connection and IP whitelist.',
      });
      return;
    }
    next();
  } catch (error: any) {
    const safeError = maskMongoCredentials(error?.message || String(error));
    logger.error(`[Database Error] Connection exception: ${safeError}`);
    res.status(503).json({
      success: false,
      message: 'Database connection failed. Please ensure MongoDB Atlas credentials and IP access are valid.',
    });
  }
});

// Mount protected API and Auth routes
app.use('/api', apiRoutes);

// Centralized Error Handler
app.use(errorHandler);

// Database Connection & Server Startup for standalone execution
const startServer = async () => {
  try {
    await connectDB();
  } catch (err: any) {
    const safeMsg = maskMongoCredentials(err?.message || String(err));
    logger.error(`[Database Startup Error] ${safeMsg}`);
  }

  app.listen(config.port, () => {
    logger.info(`=======================================================`);
    logger.info(`  TalentFlow AI Recruitment Engine is LIVE!            `);
    logger.info(`  Port: ${config.port}                                 `);
    logger.info(`  Environment: ${config.env}                           `);
    logger.info(`  Extraction Engine: Rule-Based (pdf-parse / Mammoth / Tesseract OCR) `);
    logger.info(`  Storage Policy: Ephemeral Ingestion (No Persistent File Storage) `);
    logger.info(`=======================================================`);
  });
};

// Standalone execution check (not in Vercel serverless environment)
if (!process.env.VERCEL) {
  startServer();
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('[Process] SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

export default app;
export { app };
