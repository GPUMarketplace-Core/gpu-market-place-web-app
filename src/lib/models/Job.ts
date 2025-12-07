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
      // Default to $2/hour (200 cents) if not set
      const hourlyPriceCents = nodeSpec.gpus[0].hourly_price_cents || 200;

      // Initially set order to $0 - will be calculated when job finishes
      const subtotalCents = 0;
      const feesCents = 0;

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
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

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
      await client.query(query, params);

      // If job succeeded, calculate and update order pricing
      if (status === 'succeeded') {
        await this.finalizeOrderPricing(jobId, client);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async complete(jobId: string, outputFilePath: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const now = new Date().toISOString();

      // Update job status
      await client.query(
        `UPDATE jobs
         SET status = 'succeeded',
             finished_at = $2,
             artifacts_ref = $3
         WHERE id = $1`,
        [jobId, now, outputFilePath]
      );

      // Calculate and update order pricing based on actual runtime
      await this.finalizeOrderPricing(jobId, client);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Calculate actual job cost and update order pricing
   */
  static async finalizeOrderPricing(jobId: string, client?: any): Promise<void> {
    const shouldRelease = !client;
    if (!client) {
      client = await pool.connect();
    }

    try {
      // Get job details
      const jobResult = await client.query(
        `SELECT node_id, order_id, started_at, finished_at FROM jobs WHERE id = $1`,
        [jobId]
      );

      if (jobResult.rows.length === 0) {
        throw new Error('Job not found');
      }

      const job = jobResult.rows[0];

      if (!job.started_at || !job.finished_at || !job.order_id) {
        throw new Error('Job missing required timing or order information');
      }

      // Calculate duration in hours
      const startTime = new Date(job.started_at).getTime();
      const endTime = new Date(job.finished_at).getTime();
      const durationMs = endTime - startTime;
      const durationHours = durationMs / (1000 * 60 * 60); // Convert to hours

      // Get node pricing from MongoDB
      const { db } = await connectToMongoDB();
      const nodeSpec = await db.collection('node_specs').findOne({ node_id: job.node_id });

      if (!nodeSpec || !nodeSpec.gpus || nodeSpec.gpus.length === 0) {
        throw new Error('Node pricing not found');
      }

      // Get hourly price from first GPU (default to $2/hour if not set)
      const hourlyPriceCents = nodeSpec.gpus[0].hourly_price_cents || 200;

      // Calculate actual cost based on runtime
      // Round up to nearest 0.01 hours (36 seconds) for billing
      const billableHours = Math.ceil(durationHours * 100) / 100;
      const subtotalCents = Math.round(hourlyPriceCents * billableHours);
      const feesCents = Math.floor(subtotalCents * 0.10); // 10% platform fee
      const totalCents = subtotalCents + feesCents;

      // Update order with actual pricing
      await client.query(
        `UPDATE orders
         SET subtotal_cents = $1,
             fees_cents = $2,
             total_cents = $3,
             updated_at = NOW()
         WHERE id = $4`,
        [subtotalCents, feesCents, totalCents, job.order_id]
      );

      console.log(`Job ${jobId} finalized: ${billableHours.toFixed(2)}h @ $${(hourlyPriceCents/100).toFixed(2)}/h = $${(totalCents/100).toFixed(2)}`);
    } finally {
      if (shouldRelease) {
        client.release();
      }
    }
  }
}
