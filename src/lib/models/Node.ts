import pool from '../db/postgres';

export interface Node {
  id: string;
  owner_user_id: string;
  name?: string | null;
  os?: string | null;
  client_version?: string | null;
  public_ip?: string | null;
  region?: string | null;
  status: 'online' | 'offline' | 'draining';
  last_heartbeat_at?: Date | null;
  created_at: Date;
}

export interface UpdateHeartbeatInput {
  status?: 'online' | 'offline' | 'draining';
}

export class NodeModel {
  // Get a single node by ID
  static async getById(nodeId: string): Promise<Node | null> {
    const result = await pool.query(
      `SELECT * FROM nodes WHERE id = $1`,
      [nodeId]
    );
    return result.rows[0] || null;
  }

  // Get all nodes for a specific provider
  static async getByOwnerId(ownerId: string): Promise<Node[]> {
    const result = await pool.query(
      `SELECT * FROM nodes WHERE owner_user_id = $1 ORDER BY created_at DESC`,
      [ownerId]
    );
    return result.rows;
  }

  // Update heartbeat timestamp and optionally status
  static async updateHeartbeat(
    nodeId: string,
    input: UpdateHeartbeatInput = {},
    extra?: { os?: string; name?: string } // Optional extra fields
  ): Promise<Node | null> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Build dynamic update query
      const updates: string[] = ['last_heartbeat_at = NOW()'];
      const values: any[] = [];
      let paramIndex = 1;

      if (input.status) {
        updates.push(`status = $${paramIndex++}`);
        values.push(input.status);
      }
      
      if (extra?.os) {
        updates.push(`os = $${paramIndex++}`);
        values.push(extra.os);
      }
      
      if (extra?.name) {
        updates.push(`name = $${paramIndex++}`);
        values.push(extra.name);
      }

      // Add nodeId as the last parameter
      values.push(nodeId);

      const query = `
        UPDATE nodes
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await client.query(query, values);
      await client.query('COMMIT');

      return result.rows[0] || null;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  // Get all online nodes
  static async getOnlineNodes(): Promise<Node[]> {
    const result = await pool.query(
      `SELECT * FROM nodes WHERE status = 'online' ORDER BY last_heartbeat_at DESC`
    );
    return result.rows;
  }

  // Get online nodes by region
  static async getOnlineNodesByRegion(region: string): Promise<Node[]> {
    const result = await pool.query(
      `SELECT * FROM nodes WHERE status = 'online' AND region = $1 ORDER BY last_heartbeat_at DESC`,
      [region]
    );
    return result.rows;
  }

  // Mark nodes as offline if they haven't sent a heartbeat in the specified seconds
  static async markStaleNodesOffline(staleSeconds: number = 300): Promise<number> {
    const result = await pool.query(
      `UPDATE nodes
       SET status = 'offline'
       WHERE status != 'offline'
       AND (
         last_heartbeat_at IS NULL
         OR last_heartbeat_at < NOW() - INTERVAL '${staleSeconds} seconds'
       )
       RETURNING id`,
    );

    return result.rowCount || 0;
  }

  // Get all nodes with their owner information
  static async getNodesWithOwners(): Promise<any[]> {
    const result = await pool.query(
      `SELECT
         n.*,
         u.email as owner_email,
         u.display_name as owner_display_name,
         p.company_name as owner_company_name
       FROM nodes n
       JOIN users u ON n.owner_user_id = u.id
       LEFT JOIN providers p ON p.user_id = u.id
       ORDER BY n.last_heartbeat_at DESC NULLS LAST`
    );
    return result.rows;
  }

  // Check if node belongs to a specific user
  static async isNodeOwnedBy(nodeId: string, userId: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT 1 FROM nodes WHERE id = $1 AND owner_user_id = $2`,
      [nodeId, userId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Create a new node with a specific ID (auto-registration)
  static async createWithId(nodeId: string, userId: string, name?: string): Promise<Node> {
    const result = await pool.query(
      `INSERT INTO nodes (id, owner_user_id, name, status, last_heartbeat_at)
       VALUES ($1, $2, $3, 'online', NOW())
       RETURNING *`,
      [nodeId, userId, name || `Node ${nodeId.substring(0, 8)}`]
    );
    return result.rows[0];
  }

  // Get node count by status for a provider
  static async getStatusCountsByOwnerId(ownerId: string): Promise<{ [key: string]: number }> {
    const result = await pool.query(
      `SELECT status, COUNT(*) as count
       FROM nodes
       WHERE owner_user_id = $1
       GROUP BY status`,
      [ownerId]
    );

    const counts: { [key: string]: number } = {
      online: 0,
      offline: 0,
      draining: 0,
    };

    result.rows.forEach((row) => {
      counts[row.status] = parseInt(row.count, 10);
    });

    return counts;
  }
}
