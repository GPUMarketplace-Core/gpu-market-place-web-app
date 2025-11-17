import { NextRequest, NextResponse } from 'next/server';
import { verifyGoogleToken } from '@/lib/auth/oauth';
import { UserModel } from '@/lib/models/User';
import { NodeModel } from '@/lib/models/Node';
import { cacheProviderData, type CachedProviderData } from '@/lib/db/redis';
import { connectToMongoDB } from '@/lib/db/mongodb';

async function getUserFromAuthHeader(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing or invalid Authorization header. Expected: Bearer <oauth_token>' };
  }

  const token = authHeader.substring(7);
  const userInfo = await verifyGoogleToken(token);
  if (!userInfo?.email) return { error: 'Invalid or expired OAuth token' };

  const user = await UserModel.findByEmail(userInfo.email);
  if (!user) return { error: 'User not found. Please signup first.' };
  return { user };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  try {
    // Verify authentication
    const auth = await getUserFromAuthHeader(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const { user } = auth;

    // Only providers can send heartbeats
    if (user.role !== 'provider') {
      return NextResponse.json(
        { error: 'Only providers can send heartbeats' },
        { status: 403 }
      );
    }

    const { nodeId } = await params;

    // Verify node ownership
    const isOwner = await NodeModel.isNodeOwnedBy(nodeId, user.id);
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Node not found or you do not own this node' },
        { status: 404 }
      );
    }

    // Parse request body (optional status update)
    const body = await request.json().catch(() => ({}));
    const { status, metrics } = body;

    // Validate status if provided
    if (status && !['online', 'offline', 'draining'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: online, offline, draining' },
        { status: 400 }
      );
    }

    // Update heartbeat in database
    const updatedNode = await NodeModel.updateHeartbeat(nodeId, {
      status: status || 'online', // Default to online if not specified
    });

    if (!updatedNode) {
      return NextResponse.json(
        { error: 'Failed to update node heartbeat' },
        { status: 500 }
      );
    }

    // Fetch GPU specs from MongoDB for caching
    let gpuSpecs = null;
    try {
      const { db } = await connectToMongoDB();
      const nodeSpecsCollection = db.collection('node_specs');
      const nodeSpec = await nodeSpecsCollection.findOne({ node_id: nodeId });
      if (nodeSpec) {
        gpuSpecs = {
          gpus: nodeSpec.gpus,
          cpu: nodeSpec.cpu,
          memory_gb: nodeSpec.memory_gb,
          storage: nodeSpec.storage,
        };
      }
    } catch (error) {
      console.warn('Failed to fetch GPU specs for caching:', error);
    }

    // Cache provider data in Redis
    const cacheData: CachedProviderData = {
      nodeId: updatedNode.id,
      providerId: updatedNode.owner_user_id,
      gpuSpecs: gpuSpecs,
      lastSeen: updatedNode.last_heartbeat_at?.toISOString() || new Date().toISOString(),
      status: updatedNode.status,
    };

    await cacheProviderData(nodeId, cacheData);

    return NextResponse.json(
      {
        success: true,
        message: 'Heartbeat received successfully',
        node: {
          id: updatedNode.id,
          status: updatedNode.status,
          last_heartbeat_at: updatedNode.last_heartbeat_at,
        },
        cached: true,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('POST /nodes/[nodeId]/heartbeat error:', error);
    return NextResponse.json(
      { error: 'Failed to process heartbeat', details: error.message },
      { status: 500 }
    );
  }
}
