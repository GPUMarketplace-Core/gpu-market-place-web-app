import { NextRequest, NextResponse } from 'next/server';
import { verifyGoogleToken, verifyGitHubToken } from '@/lib/auth/oauth';
import { UserModel } from '@/lib/models/User';
import pool from '@/lib/db/postgres';
import { connectToMongoDB } from '@/lib/db/mongodb';

async function getUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing or invalid Authorization header. Expected: Bearer <oauth_token>' };
  }
  const token = authHeader.substring(7);
  
  // Try Google first, then GitHub
  let info = await verifyGoogleToken(token);
  if (!info) {
    const githubInfo = await verifyGitHubToken(token);
    if (githubInfo) {
      info = {
        email: githubInfo.email,
        name: githubInfo.name,
        picture: githubInfo.avatar_url,
        sub: githubInfo.id.toString(),
      };
    }
  }
  
  if (!info?.email) return { error: 'Invalid or expired OAuth token' };
  const user = await UserModel.findByEmail(info.email);
  if (!user) return { error: 'User not found. Please signup first.' };
  return { user };
}

/**
 * GET /api/providers/me/nodes - Get nodes owned by the current provider
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getUser(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    
    const { user } = auth;
    if (user.role !== 'provider') {
      return NextResponse.json({ error: 'Only providers can view their nodes' }, { status: 403 });
    }

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