import { NextRequest, NextResponse } from 'next/server';
import { connectToMongoDB } from '@/lib/db/mongodb';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  try {
    const { hourly_price_cents } = await request.json();
    const { nodeId } = await params;
    
    const { db } = await connectToMongoDB();
    const nodeSpecsCollection = db.collection('node_specs');

    const result = await nodeSpecsCollection.updateOne(
      {},
      { $set: { "gpus.0.hourly_price_cents": hourly_price_cents } }
    );

    return NextResponse.json({
      success: true,
      message: 'Hourly rate updated successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error: any) {
    console.error('Update pricing error:', error);
    return NextResponse.json(
      { error: 'Failed to update pricing', details: error.message },
      { status: 500 }
    );
  }
}