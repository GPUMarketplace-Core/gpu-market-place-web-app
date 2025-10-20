import { NextRequest, NextResponse } from 'next/server';
import { connectToMongoDB } from '@/lib/db/mongodb';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  try {
    const { nodeId } = await params;
    const body = await request.json();
    const { gpuIndex, hourly_price_cents } = body;

    // Validation
    if (hourly_price_cents === undefined || hourly_price_cents === null) {
      return NextResponse.json(
        { error: 'Missing required field: hourly_price_cents' },
        { status: 400 }
      );
    }

    if (typeof hourly_price_cents !== 'number' || hourly_price_cents < 0) {
      return NextResponse.json(
        { error: 'hourly_price_cents must be a positive number' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToMongoDB();
    const nodeSpecsCollection = db.collection('node_specs');

    // If gpuIndex is provided, update specific GPU in array
    if (gpuIndex !== undefined && gpuIndex !== null) {
      if (typeof gpuIndex !== 'number' || gpuIndex < 0) {
        return NextResponse.json(
          { error: 'gpuIndex must be a non-negative number' },
          { status: 400 }
        );
      }

      // Update specific GPU's price
      const result = await nodeSpecsCollection.updateOne(
        { node_id: nodeId },
        {
          $set: {
            [`gpus.${gpuIndex}.hourly_price_cents`]: hourly_price_cents,
            updated_at: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { error: 'Node specs not found' },
          { status: 404 }
        );
      }

      // Get updated document
      const updatedSpec = await nodeSpecsCollection.findOne({ node_id: nodeId });

      return NextResponse.json({
        success: true,
        message: `Updated GPU at index ${gpuIndex}`,
        node_specs: updatedSpec,
      });
    } else {
      // Update all GPUs to same price
      const result = await nodeSpecsCollection.updateOne(
        { node_id: nodeId },
        {
          $set: {
            'gpus.$[].hourly_price_cents': hourly_price_cents,
            updated_at: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { error: 'Node specs not found' },
          { status: 404 }
        );
      }

      // Get updated document
      const updatedSpec = await nodeSpecsCollection.findOne({ node_id: nodeId });

      return NextResponse.json({
        success: true,
        message: 'Updated all GPUs pricing',
        node_specs: updatedSpec,
      });
    }
  } catch (error: any) {
    console.error('Update pricing error:', error);
    return NextResponse.json(
      { error: 'Failed to update pricing', details: error.message },
      { status: 500 }
    );
  }
}
