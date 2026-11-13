import mongoose from 'mongoose';
import { config } from './index.js';

let cached = (global as any).mongoose;
if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export const connectDB = async (): Promise<typeof mongoose | null> => {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 8000,
      autoIndex: config.env !== 'production',
    }).then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
    console.log(`[Database] MongoDB Connected: ${cached.conn.connection.host}`);
    return cached.conn;
  } catch (error: any) {
    cached.promise = null;
    console.error(`[Database Error] MongoDB connection failure: ${error.message}`);
    console.warn(`[Database Warning] Running in offline-resilient mode. Check MONGODB_URI and IP whitelist.`);
    return null;
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[Database] MongoDB disconnected.');
});

mongoose.connection.on('reconnected', () => {
  console.log('[Database] MongoDB reconnected.');
});

