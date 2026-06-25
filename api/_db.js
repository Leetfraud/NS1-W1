// api/_db.js
// Shared MongoDB connection, cached across serverless invocations
// so we don't open a new connection on every request.
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'nexiosol';

if (!uri) {
  console.warn('MONGODB_URI is not set. Set it in your Vercel environment variables.');
}

// Reuse the client across hot lambda invocations.
let cached = global._mongo;
if (!cached) cached = global._mongo = { client: null, promise: null };

export async function getDb() {
  if (cached.client) return cached.client.db(dbName);
  if (!cached.promise) {
    cached.promise = new MongoClient(uri).connect().then((client) => {
      cached.client = client;
      return client;
    });
  }
  const client = await cached.promise;
  return client.db(dbName);
}
