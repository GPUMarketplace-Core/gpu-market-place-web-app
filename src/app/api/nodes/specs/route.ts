import { NextRequest, NextResponse } from 'next/server';
import { connectToMongoDB } from '@/lib/db/mongodb';

// Get all node specs
export async function GET(request: NextRequest) {
  try {
    // Get query parameters for pagination and filtering
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Connect to MongoDB
    const { db } = await connectToMongoDB();
    const nodeSpecsCollection = db.collection('node_specs');

    // Fetch node specs with pagination
    const nodeSpecs = await nodeSpecsCollection
      .find({})
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count for pagination metadata
    const totalCount = await nodeSpecsCollection.countDocuments({});
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: nodeSpecs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error: any) {
    console.error('Get node specs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch node specs', details: error.message },
      { status: 500 }
    );
  }
}

// Add sample node spec data
export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToMongoDB();
    const nodeSpecsCollection = db.collection('node_specs');

    const sampleData = {
      node_id: "123e4567-e89b-12d3-a456-426614174000",
      gpus: [
        {
          vendor: "NVIDIA",
          model: "RTX 4090",
          vram_gb: 24,
          count: 1,
          hourly_price_cents: 250
        }
      ],
      cpu: {
        model: "Ryzen 9 7950X",
        cores: 16
      },
      memory_gb: 128,
      storage: [
        {
          type: "nvme",
          size_gb: 2000
        }
      ],
      updated_at: new Date()
    };

    const result = await nodeSpecsCollection.insertOne(sampleData);

    return NextResponse.json({
      success: true,
      message: 'Sample data inserted successfully',
      insertedId: result.insertedId
    });
  } catch (error: any) {
    console.error('Insert node spec error:', error);
    return NextResponse.json(
      { error: 'Failed to insert node spec', details: error.message },
      { status: 500 }
    );
  }
}

// Update hourly rate
export async function PUT(request: NextRequest) {
  try {
    const { hourly_price_cents } = await request.json();
    
    const { db } = await connectToMongoDB();
    const nodeSpecsCollection = db.collection('node_specs');

    // Try to update the first document found (since we only have one)
    const result = await nodeSpecsCollection.updateOne(
      {},
      { $set: { "gpus.0.hourly_price_cents": hourly_price_cents } }
    );

    console.log('Update result:', result);

    return NextResponse.json({
      success: true,
      message: 'Hourly rate updated successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error: any) {
    console.error('Update hourly rate error:', error);
    return NextResponse.json(
      { error: 'Failed to update hourly rate', details: error.message },
      { status: 500 }
    );
  }
}
