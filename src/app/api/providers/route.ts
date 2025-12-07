import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db/postgres';
import { connectToMongoDB } from '@/lib/db/mongodb';
import { NodeModel } from '@/lib/models/Node';

// GET /api/providers - List all online providers
export async function GET(request: NextRequest) {
  try {
    // Lazy Cron: Mark stale nodes offline before fetching
    // This ensures consumers always see current node status without external cron
    await NodeModel.markStaleNodesOffline(15); // 15 seconds timeout

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'online', 'offline', or null (all)
    const region = searchParams.get('region');

    // Build dynamic query
    let whereConditions = ['n.status IS NOT NULL'];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (status && ['online', 'offline', 'draining'].includes(status)) {
      whereConditions.push(`n.status = $${paramIndex++}`);
      queryParams.push(status);
    }

    if (region) {
      whereConditions.push(`n.region = $${paramIndex++}`);
      queryParams.push(region);
    }

    const whereClause = whereConditions.join(' AND ');

    // Query to get all providers with their online nodes
    const query = `
      SELECT
        p.user_id as provider_id,
        u.email as provider_email,
        u.display_name as provider_display_name,
        p.company_name,
        p.rating_avg,
        p.rating_count,
        p.status as provider_status,
        json_agg(
          json_build_object(
            'node_id', n.id,
            'name', n.name,
            'region', n.region,
            'status', n.status,
            'last_heartbeat_at', n.last_heartbeat_at,
            'os', n.os,
            'public_ip', n.public_ip
          ) ORDER BY n.last_heartbeat_at DESC NULLS LAST
        ) FILTER (WHERE n.id IS NOT NULL) as nodes
      FROM providers p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN nodes n ON n.owner_user_id = p.user_id
      WHERE ${whereClause}
      GROUP BY p.user_id, u.email, u.display_name, p.company_name, p.rating_avg, p.rating_count, p.status
      HAVING COUNT(n.id) FILTER (WHERE n.status = 'online') > 0 OR $${paramIndex} = 'offline' OR $${paramIndex} IS NULL
      ORDER BY p.rating_avg DESC, p.rating_count DESC
    `;

    // Push status only once - it's referenced twice in the SQL but it's the same parameter
    queryParams.push(status);

    const result = await pool.query(query, queryParams);

    // Fetch node specs from MongoDB for each node
    const { db } = await connectToMongoDB();
    const nodeSpecsCollection = db.collection('node_specs');

    const providers = await Promise.all(
      result.rows.map(async (row) => {
        // Fetch specs for all nodes
        const nodesWithSpecs = await Promise.all(
          (row.nodes || []).map(async (node: any) => {
            try {
              const specs = await nodeSpecsCollection.findOne({ node_id: node.node_id });
              return {
                ...node,
                specs: specs
                  ? {
                      gpus: specs.gpus,
                      cpu: specs.cpu,
                      memory_gb: specs.memory_gb,
                      storage: specs.storage,
                    }
                  : null,
              };
            } catch (error) {
              console.error(`Failed to fetch specs for node ${node.node_id}:`, error);
              return {
                ...node,
                specs: null,
              };
            }
          })
        );

        return {
          provider_id: row.provider_id,
          provider_email: row.provider_email,
          provider_display_name: row.provider_display_name,
          company_name: row.company_name,
          rating: {
            average: parseFloat(row.rating_avg) || 0,
            count: row.rating_count || 0,
          },
          provider_status: row.provider_status,
          online_nodes_count: nodesWithSpecs.filter((n: any) => n.status === 'online').length,
          total_nodes_count: nodesWithSpecs.length,
          nodes: nodesWithSpecs,
        };
      })
    );

    return NextResponse.json({
      success: true,
      count: providers.length,
      filters: {
        status: status || 'all',
        region: region || 'all',
      },
      providers,
    });
  } catch (error: any) {
    console.error('GET /api/providers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers', details: error.message },
      { status: 500 }
    );
  }
}
