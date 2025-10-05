import pool from '../db/postgres';

export interface JobRow {
  id: string;
  title: string;
  status: 'queued' | 'scheduled' | 'running' | 'succeeded' | 'failed' | 'canceled';
  consumer_id: string;
  provider_id: string | null;
  node_id: string | null;
  order_id: string | null;
  submitted_at: string;
  started_at: string | null;
  finished_at: string | null;
}

export class JobModel {
  static async listByProvider(providerUserId: string, limit = 20, offset = 0): Promise<JobRow[]> {
    const result = await pool.query(
      `SELECT id, title, status, consumer_id, provider_id, node_id, order_id,
              submitted_at, started_at, finished_at
         FROM jobs
        WHERE provider_id = $1
        ORDER BY submitted_at DESC
        LIMIT $2 OFFSET $3`,
      [providerUserId, limit, offset]
    );
    return result.rows;
  }
}


