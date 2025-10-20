import pool from '../db/postgres';

export interface ConsumerProfile {
  user_id: string;
  email: string;
  role: 'consumer' | 'provider' | 'admin';
  display_name?: string;
  default_currency: string;
  created_at: Date;
}

export interface UpdateConsumerProfileInput {
  display_name?: string;
  default_currency?: string;
}

export class ConsumerModel {
  static async getByUserId(userId: string): Promise<ConsumerProfile | null> {
    const result = await pool.query(
      `SELECT
         u.id as user_id,
         u.email,
         u.role,
         u.display_name,
         c.default_currency,
         u.created_at
       FROM users u
       JOIN consumers c ON c.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  }

  static async updateByUserId(userId: string, updates: UpdateConsumerProfileInput): Promise<ConsumerProfile | null> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (typeof updates.display_name !== 'undefined') {
        await client.query(`UPDATE users SET display_name = $1 WHERE id = $2`, [updates.display_name, userId]);
      }

      if (typeof updates.default_currency !== 'undefined') {
        await client.query(`UPDATE consumers SET default_currency = $1 WHERE user_id = $2`, [updates.default_currency, userId]);
      }

      await client.query('COMMIT');
      return await ConsumerModel.getByUserId(userId);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  static async create(userId: string, defaultCurrency: string = 'USD'): Promise<void> {
    await pool.query(
      `INSERT INTO consumers (user_id, default_currency) VALUES ($1, $2)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId, defaultCurrency]
    );
  }
}
