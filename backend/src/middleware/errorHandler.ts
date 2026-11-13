import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error(err.message, { stack: err.stack });

  // Handle Multer errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        message: `File exceeds maximum allowed size of ${config.storage.maxFileSizeMb}MB.`,
      });
      return;
    }
    res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
    });
    return;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val: any) => val.message);
    res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: messages,
    });
    return;
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    res.status(409).json({
      success: false,
      message: `Duplicate entry: A record with that ${field} already exists.`,
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(config.env === 'development' && { stack: err.stack }),
  });
};

