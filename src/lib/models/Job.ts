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
  config_ref?: string; // Storing input file path here for now
  artifacts_ref?: string; // Storing output file path here for now
  failure_reason?: string;
}

export interface CreateJobInput {
  consumer_id: string;
  provider_id: string;
  node_id: string;
  title: string;
  input_file_path: string;
}

export class JobModel {
  static async listByProvider(providerUserId: string, limit = 20, offset = 0): Promise<JobRow[]> {
    const result = await pool.query(
      `SELECT id, title, status, consumer_id, provider_id, node_id, order_id,
              submitted_at, started_at, finished_at, config_ref, artifacts_ref
         FROM jobs
        WHERE provider_id = $1
        ORDER BY submitted_at DESC
        LIMIT $2 OFFSET $3`,
      [providerUserId, limit, offset]
    );
    return result.rows;
  }

  static async listByConsumer(consumerUserId: string, limit = 20, offset = 0): Promise<JobRow[]> {
    const result = await pool.query(
      `SELECT id, title, status, consumer_id, provider_id, node_id, order_id,
              submitted_at, started_at, finished_at, config_ref, artifacts_ref, failure_reason
         FROM jobs
        WHERE consumer_id = $1
        ORDER BY submitted_at DESC
        LIMIT $2 OFFSET $3`,
      [consumerUserId, limit, offset]
    );
    return result.rows;
  }

  static async create(input: CreateJobInput): Promise<JobRow> {
    const result = await pool.query(
      `INSERT INTO jobs (consumer_id, provider_id, node_id, title, status, config_ref)
       VALUES ($1, $2, $3, $4, 'queued', $5)
       RETURNING *`,
      [input.consumer_id, input.provider_id, input.node_id, input.title, input.input_file_path]
    );
    return result.rows[0];
  }

  static async getById(jobId: string): Promise<JobRow | null> {
    const result = await pool.query(
      `SELECT * FROM jobs WHERE id = $1`,
      [jobId]
    );
    return result.rows[0] || null;
  }

  static async updateStatus(jobId: string, status: string, failureReason?: string): Promise<void> {
    const now = new Date().toISOString();
    let query = `UPDATE jobs SET status = $2`;
    const params: any[] = [jobId, status];
    let paramIdx = 3;

    if (status === 'running') {
      query += `, started_at = $${paramIdx++}`;
      params.push(now);
    } else if (['succeeded', 'failed', 'canceled'].includes(status)) {
      query += `, finished_at = $${paramIdx++}`;
      params.push(now);
    }

    if (failureReason) {
      query += `, failure_reason = $${paramIdx++}`;
      params.push(failureReason);
    }

    query += ` WHERE id = $1`;
    await pool.query(query, params);
  }

  static async complete(jobId: string, outputFilePath: string): Promise<void> {
    const now = new Date().toISOString();
    await pool.query(
      `UPDATE jobs 
       SET status = 'succeeded', 
           finished_at = $2, 
           artifacts_ref = $3 
       WHERE id = $1`,
      [jobId, now, outputFilePath]
    );
  }
}
