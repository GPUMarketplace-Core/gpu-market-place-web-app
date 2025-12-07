import pool from '../db/postgres';
import { connectToMongoDB } from '../db/mongodb';

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
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Get node pricing from MongoDB
      const { db } = await connectToMongoDB();
      const nodeSpec = await db.collection('node_specs').findOne({ node_id: input.node_id });

      if (!nodeSpec || !nodeSpec.gpus || nodeSpec.gpus.length === 0) {
        throw new Error('Node pricing not found');
      }

      // Get hourly price from first GPU (assuming single GPU for now)
      const hourlyPriceCents = nodeSpec.gpus[0].hourly_price_cents || 0;

      // For MVP, we'll charge for 1 hour minimum
      const subtotalCents = hourlyPriceCents;
      const feesCents = Math.floor(subtotalCents * 0.10); // 10% platform fee

      // 2. Create order
      const orderResult = await client.query(
        `INSERT INTO orders (consumer_id, provider_id, status, currency, subtotal_cents, fees_cents)
         VALUES ($1, $2, 'pending', 'usd', $3, $4)
         RETURNING id`,
        [input.consumer_id, input.provider_id, subtotalCents, feesCents]
      );

      const orderId = orderResult.rows[0].id;

      // 3. Create job with order_id
      const jobResult = await client.query(
        `INSERT INTO jobs (consumer_id, provider_id, node_id, order_id, title, status, config_ref)
         VALUES ($1, $2, $3, $4, $5, 'queued', $6)
         RETURNING *`,
        [input.consumer_id, input.provider_id, input.node_id, orderId, input.title, input.input_file_path]
      );

      await client.query('COMMIT');
      return jobResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
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
