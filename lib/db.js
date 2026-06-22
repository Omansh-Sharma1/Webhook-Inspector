import { MongoClient } from 'mongodb';

// Vercel serverless functions can be re-invoked on a "warm" container.
// Caching the client on the global object avoids exhausting MongoDB's
// connection limit by opening a new connection on every single request.
let cached = global._mongoClient;

export async function getDb() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set. Add it in your Vercel project settings or .env file.');
  }

  if (!cached) {
    cached = new MongoClient(process.env.MONGODB_URI, {
      maxPoolSize: 10
    });
    global._mongoClient = cached;
  }

  if (!cached.topology || !cached.topology.isConnected()) {
    await cached.connect();
  }

  return cached.db(process.env.MONGODB_DB || 'webhook_inspector');
}

// Inspectors expire after this many hours — keeps the free-tier DB small
// and means recruiters poking around an old demo link see it expire cleanly.
export const INSPECTOR_TTL_HOURS = 48;
