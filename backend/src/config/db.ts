import mongoose from 'mongoose';
import { config } from './index.js';

export const connectDB = async (): Promise<typeof mongoose | null> => {
  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error: any) {
    console.error(`[Database Error] MongoDB connection failure: ${error.message}`);
    console.warn(`[Database Warning] Running in offline-resilient mode. Database operations will attempt to reconnect.`);
    return null;
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[Database] MongoDB disconnected.');
});

mongoose.connection.on('reconnected', () => {
  console.log('[Database] MongoDB reconnected.');
});

