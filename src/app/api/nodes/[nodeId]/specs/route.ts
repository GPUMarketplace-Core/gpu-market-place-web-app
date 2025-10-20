import { NextRequest, NextResponse } from 'next/server';
import { connectToMongoDB } from '@/lib/db/mongodb';

// Create or update node specs
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  try {
    const { nodeId } = await params;
    const body = await request.json();
    const { gpus, cpu, memory_gb, storage } = body;

    // Validation
    if (!gpus || !Array.isArray(gpus) || gpus.length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: gpus (must be non-empty array)' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToMongoDB();
    const nodeSpecsCollection = db.collection('node_specs');

    // Check if specs already exist
    const existingSpec = await nodeSpecsCollection.findOne({ node_id: nodeId });

    if (existingSpec) {
      return NextResponse.json(
        { error: 'Node specs already exist. Use PATCH to update.' },
        { status: 409 }
      );
    }

    // Create new node specs
    const nodeSpec = {
      node_id: nodeId,
      gpus: gpus,
      cpu: cpu || null,
      memory_gb: memory_gb || 0,
      storage: storage || [],
      updated_at: new Date(),
    };

    const result = await nodeSpecsCollection.insertOne(nodeSpec);

    return NextResponse.json(
      {
        success: true,
        message: 'Node specs created successfully',
        node_specs: {
          _id: result.insertedId,
          ...nodeSpec,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create node specs error:', error);
    return NextResponse.json(
      { error: 'Failed to create node specs', details: error.message },
      { status: 500 }
    );
  }
}

// Get node specs
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  try {
    const { nodeId } = await params;

    // Connect to MongoDB
    const { db } = await connectToMongoDB();
    const nodeSpecsCollection = db.collection('node_specs');

    const nodeSpec = await nodeSpecsCollection.findOne({ node_id: nodeId });

    if (!nodeSpec) {
      return NextResponse.json(
        { error: 'Node specs not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      node_specs: nodeSpec,
    });
  } catch (error: any) {
    console.error('Get node specs error:', error);
    return NextResponse.json(
      { error: 'Failed to get node specs', details: error.message },
      { status: 500 }
    );
  }
}
