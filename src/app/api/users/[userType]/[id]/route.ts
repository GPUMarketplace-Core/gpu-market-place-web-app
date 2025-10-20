import { NextRequest, NextResponse } from 'next/server';
import { verifyGoogleToken, verifyGitHubToken } from '@/lib/auth/oauth';
import { UserModel } from '@/lib/models/User';
import { ProviderModel } from '@/lib/models/Provider';
import { ConsumerModel } from '@/lib/models/Consumer';

export async function GET(
  request: NextRequest,
  { params }: { params: { userType: string; id: string } }
) {
  try {
    const { userType, id } = params;

    // Validate userType
    if (userType !== 'consumer' && userType !== 'provider') {
      return NextResponse.json(
        { error: 'Invalid userType. Must be "consumer" or "provider"' },
        { status: 400 }
      );
    }

    // Extract and verify OAuth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header. Expected: Bearer <oauth_token>' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify token (try Google first, then GitHub)
    let userInfo = await verifyGoogleToken(token);
    if (!userInfo) {
      const githubInfo = await verifyGitHubToken(token);
      if (githubInfo) {
        userInfo = {
          email: githubInfo.email,
          name: githubInfo.name,
          picture: githubInfo.avatar_url,
          sub: githubInfo.id.toString(),
        };
      }
    }

    if (!userInfo) {
      return NextResponse.json(
        { error: 'Invalid or expired OAuth token' },
        { status: 401 }
      );
    }

    // Verify requesting user exists
    const requestingUser = await UserModel.findByEmail(userInfo.email);
    if (!requestingUser) {
      return NextResponse.json(
        { error: 'User not found. Please signup first.' },
        { status: 404 }
      );
    }

    // Fetch the requested user's basic info
    const targetUser = await UserModel.findById(id);
    if (!targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      );
    }

    // Fetch the appropriate profile based on userType
    let profile;
    if (userType === 'provider') {
      profile = await ProviderModel.getByUserId(id);
      if (!profile) {
        return NextResponse.json(
          { error: 'Provider profile not found for this user' },
          { status: 404 }
        );
      }
    } else {
      profile = await ConsumerModel.getByUserId(id);
      if (!profile) {
        return NextResponse.json(
          { error: 'Consumer profile not found for this user' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      user_type: userType,
      profile,
    });
  } catch (error: any) {
    console.error('Get user profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile', details: error.message },
      { status: 500 }
    );
  }
}
