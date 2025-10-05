import pool from '../db/postgres';

export interface ProviderProfile {
  user_id: string;
  email: string;
  role: 'consumer' | 'provider' | 'admin';
  display_name?: string;
  status: 'active' | 'suspended';
  rating_avg: string; // pg NUMERIC as string
  rating_count: number;
  payout_account_id?: string | null;
  company_name?: string | null;
  created_at: Date;
}

export interface UpdateProviderProfileInput {
  display_name?: string;
  company_name?: string | null;
  payout_account_id?: string | null;
}

export class ProviderModel {
  static async getByUserId(userId: string): Promise<ProviderProfile | null> {
    const result = await pool.query(
      `SELECT 
         u.id as user_id,
         u.email,
         u.role,
         u.display_name,
         p.status,
         p.rating_avg,
         p.rating_count,
         p.payout_account_id,
         p.company_name,
         u.created_at
       FROM users u
       JOIN providers p ON p.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  }

  static async updateByUserId(userId: string, updates: UpdateProviderProfileInput): Promise<ProviderProfile | null> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (typeof updates.display_name !== 'undefined') {
        await client.query(`UPDATE users SET display_name = $1 WHERE id = $2`, [updates.display_name, userId]);
      }

      const providerFields: string[] = [];
      const providerValues: any[] = [];
      let idx = 1;

      if (Object.prototype.hasOwnProperty.call(updates, 'company_name')) {
        providerFields.push(`company_name = $${idx++}`);
        providerValues.push(updates.company_name ?? null);
      }
      if (Object.prototype.hasOwnProperty.call(updates, 'payout_account_id')) {
        providerFields.push(`payout_account_id = $${idx++}`);
        providerValues.push(updates.payout_account_id ?? null);
      }

      if (providerFields.length > 0) {
        providerValues.push(userId);
        await client.query(`UPDATE providers SET ${providerFields.join(', ')} WHERE user_id = $${idx}` , providerValues);
      }

      await client.query('COMMIT');
      return await ProviderModel.getByUserId(userId);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}


