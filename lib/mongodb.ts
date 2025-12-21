/**
 * MongoDB Connection Utility
 * Manages MongoDB connection using Mongoose with connection pooling
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || '';

// Don't throw error in development - allow app to run without MongoDB
if (!MONGODB_URI) {
  console.warn('[MongoDB] WARNING: MONGODB_URI or DATABASE_URL not defined. MongoDB features will be disabled.');
}

type MongooseConnection = typeof mongoose;

interface MongooseCache {
  conn: MongooseConnection | null;
  promise: Promise<MongooseConnection> | null;
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB(): Promise<MongooseConnection | null> {
  // If no MongoDB URI, skip connection
  if (!MONGODB_URI) {
    console.warn('[MongoDB] Skipping connection - no MONGODB_URI defined');
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        console.log('[MongoDB] Connected successfully');
        return mongooseInstance;
      })
      .catch((error) => {
        console.error('[MongoDB] Connection failed:', error.message);
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
