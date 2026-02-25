import pg from 'pg';

const isRemote = !process.env.DATABASE_URL?.includes('localhost');

const getClientConfig = () => ({
  connectionString: process.env.DATABASE_URL,
  ssl: isRemote ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 15000,
});

// Wrapper that mimics pool.query() but uses a fresh Client per call.
// This is the reliable pattern for PgBouncer transaction mode on serverless.
const pool = {
  async query(text: string | pg.QueryConfig, values?: any[]) {
    const client = new pg.Client(getClientConfig());
    try {
      await client.connect();
      const result = typeof text === 'string'
        ? await client.query(text, values)
        : await client.query(text);
      return result;
    } finally {
      await client.end().catch(() => {});
    }
  },

  async connect() {
    const client = new pg.Client(getClientConfig());
    await client.connect();
    const release = () => client.end().catch(() => {});
    return Object.assign(client, { release });
  },
};

export default pool;
