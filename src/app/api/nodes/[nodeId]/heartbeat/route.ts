import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/utils';
import { NodeModel } from '@/lib/models/Node';
// import { cacheProviderData, type CachedProviderData } from '@/lib/db/redis';
import { connectToMongoDB } from '@/lib/db/mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  try {
    // Verify authentication
    const auth = await authenticateRequest(request);
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

    // Parse request body (optional status update)
    const body = await request.json().catch(() => ({}));
    const { status, metrics } = body;
    
    console.log(`[DEBUG] Received Heartbeat from ${nodeId}:`, JSON.stringify(body, null, 2));

    // Check if node exists
    const existingNode = await NodeModel.getById(nodeId);
    let updatedNode;

    if (!existingNode) {
        // Node doesn't exist - create it
        console.log(`[Auto-Registration] Creating new node ${nodeId} for user ${user.id}`);
        updatedNode = await NodeModel.createWithId(nodeId, user.id);
    } else {
        // Node exists - verify ownership
        if (existingNode.owner_user_id !== user.id) {
            return NextResponse.json(
                { error: 'Node exists but you do not own it' },
                { status: 403 }
            );

        }

        // Validate status if provided
        if (status && !['online', 'offline', 'draining'].includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status. Must be one of: online, offline, draining' },
                { status: 400 }
            );
        }

        // Update heartbeat in database
        const heartbeatUpdate: any = {
            status: status || 'online',
        };
        
        const extraFields: any = {};
        if (metrics && metrics.os) {
            extraFields.os = metrics.os.name;
            extraFields.name = metrics.os.hostname; // Use hostname as node name
        }

        updatedNode = await NodeModel.updateHeartbeat(nodeId, heartbeatUpdate, extraFields);
    }

    if (!updatedNode) {
      return NextResponse.json(
        { error: 'Failed to update or create node' },
        { status: 500 }
      );
    }

    // Save metrics to MongoDB
    if (metrics) {
        try {
            const { db } = await connectToMongoDB();
            const nodeSpecsCollection = db.collection('node_specs');
            
            // Structure data for MongoDB
            const updateData: any = {
                node_id: nodeId,
                updated_at: new Date(),
            };

            if (metrics.cpu) updateData.cpu = metrics.cpu;
            if (metrics.memory) updateData.memory_gb = Math.round(metrics.memory.total_bytes / (1024 * 1024 * 1024));
            if (metrics.os) {
                updateData.os = metrics.os.name; // Save OS name (e.g., Windows 11)
                updateData.os_details = metrics.os; // Save full details
            }
            
            if (metrics.gpus && Array.isArray(metrics.gpus)) {
                updateData.gpus = metrics.gpus.map((gpu: any, index: number) => {
                    let price = 0;
                    // Find rate for this GPU index
                    if (metrics.gpu_rates && Array.isArray(metrics.gpu_rates)) {
                        const rate = metrics.gpu_rates.find((r: any) => r.gpu_index === index);
                        if (rate) {
                            price = rate.hourly_price_cents;
                        }
                    }

                    return {
                        vendor: "NVIDIA", // TODO: Get vendor from agent
                        model: gpu.name,
                        vram_gb: Math.round(gpu.vram_total_bytes / (1024 * 1024 * 1024)),
                        count: 1, 
                        hourly_price_cents: price
                    };
                });
            }
            
            // Upsert specs
            await nodeSpecsCollection.updateOne(
                { node_id: nodeId },
                { $set: updateData },
                { upsert: true }
            );
        } catch (error) {
            console.warn('Failed to save metrics to MongoDB:', error);
        }
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

    /*
    // Cache provider data in Redis
    const cacheData: CachedProviderData = {
      nodeId: updatedNode.id,
      providerId: updatedNode.owner_user_id,
      gpuSpecs: gpuSpecs,
      lastSeen: updatedNode.last_heartbeat_at?.toISOString() || new Date().toISOString(),
      status: updatedNode.status,
    };

    try {
      await cacheProviderData(nodeId, cacheData);
    } catch (error) {
      console.warn('Failed to cache provider data in Redis:', error);
      // Continue even if caching fails
    }
    */

    return NextResponse.json(
      {
        success: true,
        message: 'Heartbeat received successfully',
        node: {
          id: updatedNode.id,
          status: updatedNode.status,
          last_heartbeat_at: updatedNode.last_heartbeat_at,
        },
        cached: false,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('POST /nodes/[nodeId]/heartbeat error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: 'Failed to process heartbeat', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
      },
      { status: 500 }
    );
  }
}
