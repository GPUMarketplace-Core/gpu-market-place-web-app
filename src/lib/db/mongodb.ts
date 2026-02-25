import { MongoClient, Db } from 'mongodb';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToMongoDB() {
  if (cachedClient && cachedDb) {
    // Verify the cached connection is still alive
    try {
      await cachedClient.db().command({ ping: 1 });
      return { client: cachedClient, db: cachedDb };
    } catch {
      // Connection is stale, reset and reconnect
      cachedClient = null;
      cachedDb = null;
    }
  }

  const client = await MongoClient.connect(process.env.MONGODB_URI!, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 30000,
  });
  const db = client.db();

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}
