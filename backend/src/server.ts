import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import { connectDB } from './config/db.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { setSocketIOInstance } from './services/notification/notificationService.js';
import apiRoutes from './routes/index.js';

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

setSocketIOInstance(io);

// Socket.IO event handlers
io.on('connection', (socket) => {
  logger.info(`[Socket.IO] Client connected: ${socket.id}`);

  socket.on('join_user', (userId: string) => {
    if (userId) {
      socket.join(userId);
      logger.debug(`[Socket.IO] Socket ${socket.id} joined user room: ${userId}`);
    }
  });

  socket.on('join_role', (role: string) => {
    if (role) {
      socket.join(role);
      logger.debug(`[Socket.IO] Socket ${socket.id} joined role room: ${role}`);
    }
  });

  socket.on('disconnect', () => {
    logger.info(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Middleware
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
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

app.use('/api', apiLimiter);

// API Routes
app.use('/api', apiRoutes);

// Root greeting
app.get('/', (_req, res) => {
  res.json({
    application: 'TalentFlow AI',
    status: 'Running',
    version: '1.0.0',
    documentation: '/docs',
    apiBase: '/api',
  });
});

// Centralized Error Handler
app.use(errorHandler);

// Database Connection & Server Startup
const startServer = async () => {
  await connectDB();

  server.listen(config.port, () => {
    logger.info(`=======================================================`);
    logger.info(`  TalentFlow AI Recruitment Engine is LIVE!            `);
    logger.info(`  Port: ${config.port}                                 `);
    logger.info(`  Environment: ${config.env}                           `);
    logger.info(`  Extraction Engine: Rule-Based (pdf-parse / Mammoth / Tesseract OCR) `);
    logger.info(`  Storage Policy: Ephemeral Ingestion (No Persistent File Storage) `);
    logger.info(`=======================================================`);
  });
};

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('[Process] SIGINT received. Shutting down gracefully...');
  server.close(() => {
    logger.info('[Process] HTTP server closed.');
    process.exit(0);
  });
});

export { app, server, io };

