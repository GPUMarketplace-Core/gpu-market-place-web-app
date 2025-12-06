import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/utils';
import pool from '@/lib/db/postgres';
import { connectToMongoDB } from '@/lib/db/mongodb';
import { NodeModel } from '@/lib/models/Node';

/**
 * GET /api/providers/me/nodes - Get nodes owned by the current provider
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    
    const { user } = auth;
    if (user.role !== 'provider') {
      return NextResponse.json({ error: 'Only providers can view their nodes' }, { status: 403 });
    }

    // Lazy Cron: Mark stale nodes offline before fetching
    // This ensures the dashboard always shows current status without external cron
    await NodeModel.markStaleNodesOffline(10); // 10 seconds timeout

    // Fetch nodes from PostgreSQL
    const result = await pool.query(
      `SELECT id, name, os, client_version, public_ip, region, status, 
              last_heartbeat_at, created_at
       FROM nodes 
       WHERE owner_user_id = $1 
       ORDER BY created_at DESC`,
      [user.id]
    );

    const nodes = result.rows;

    // For each node, try to fetch specs from MongoDB
    const { db } = await connectToMongoDB();
    const nodeSpecsCollection = db.collection('node_specs');

    const nodesWithSpecs = await Promise.all(
      nodes.map(async (node) => {
        try {
          // Use string node ID for MongoDB lookup (simpler approach)
          const specs = await nodeSpecsCollection.findOne({ node_id: node.id });
          
          return {
            ...node,
            specs: specs || null,
            gpu_count: specs?.gpus?.length || 0,
            has_pricing: specs?.gpus?.some((gpu: any) => gpu.hourly_price_cents > 0) || false
          };
        } catch (error) {
          console.error(`Error fetching specs for node ${node.id}:`, error);
          return {
            ...node,
            specs: null,
            gpu_count: 0,
            has_pricing: false
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      nodes: nodesWithSpecs,
      total_count: nodes.length
    });

  } catch (error: any) {
    console.error('GET /providers/me/nodes error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch nodes', details: error.message },
      { status: 500 }
    );
  }
}