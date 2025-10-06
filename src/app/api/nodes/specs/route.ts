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
