import pool from '../db/postgres';

export interface User {
  id: string;
  email: string;
  role: 'consumer' | 'provider' | 'admin';
  display_name?: string;
  created_at: Date;
}

export interface CreateUserInput {
  email: string;
  role: 'consumer' | 'provider';
  display_name?: string;
  company_name?: string;
}

export class UserModel {
  static async create(input: CreateUserInput) {
    const { email, role, display_name, company_name } = input;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create user
      const userResult = await client.query(
        `INSERT INTO users (email, role, display_name)
         VALUES ($1, $2, $3)
         RETURNING id, email, role, display_name, created_at`,
        [email, role, display_name]
      );

      const user = userResult.rows[0];

      // Create role-specific record
      if (role === 'provider') {
        await client.query(
          `INSERT INTO providers (user_id, company_name) VALUES ($1, $2)`,
          [user.id, company_name || null]
        );
      } else if (role === 'consumer') {
        await client.query(
          `INSERT INTO consumers (user_id) VALUES ($1)`,
          [user.id]
        );
      }

      await client.query('COMMIT');
      return user;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async findByEmail(email: string) {
    const result = await pool.query(
      `SELECT id, email, role, display_name, created_at FROM users WHERE email = $1`,
      [email]
    );
    return result.rows[0] || null;
  }

  static async findById(id: string) {
    const result = await pool.query(
      `SELECT id, email, role, display_name, created_at FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }
}
