import { MongoClient, Db } from 'mongodb';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToMongoDB() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = await MongoClient.connect(process.env.MONGODB_URI!);
  const db = client.db();

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}
