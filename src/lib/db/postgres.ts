import { Pool, Client } from 'pg';

const isRemote = !process.env.DATABASE_URL?.includes('localhost');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isRemote ? { rejectUnauthorized: false } : false,
  max: 1,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 15000,
});

// Test connection on first import (logs to Vercel)
if (isRemote) {
  const testClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  testClient.connect()
    .then(() => {
      console.log('DB connected successfully');
      testClient.end();
    })
    .catch((err) => {
      console.error('DB connection test failed:', err.message);
    });
}

export default pool;
