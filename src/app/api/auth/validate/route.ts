import { NextRequest, NextResponse } from 'next/server';
import { verifyGoogleToken, verifyGitHubToken } from '@/lib/auth/oauth';
import { UserModel } from '@/lib/models/User';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Missing or invalid Authorization header. Expected: Bearer <oauth_token>'
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Try to verify with Google first
    let userInfo = await verifyGoogleToken(token);
    let provider = 'google';

    // If Google fails, try GitHub
    if (!userInfo) {
      const githubInfo = await verifyGitHubToken(token);
      if (githubInfo) {
        userInfo = {
          email: githubInfo.email,
          name: githubInfo.name,
          picture: githubInfo.avatar_url,
          sub: githubInfo.id.toString(),
        };
        provider = 'github';
      }
    }

    // If both failed, token is invalid
    if (!userInfo) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Invalid or expired OAuth token'
        },
        { status: 401 }
      );
    }

    // Check if user exists in database
    const user = await UserModel.findByEmail(userInfo.email);
    if (!user) {
      return NextResponse.json(
        {
          valid: false,
          error: 'User not found in database. Please signup first.',
          oauth_valid: true,
          email: userInfo.email
        },
        { status: 404 }
      );
    }

    // Token is valid and user exists
    return NextResponse.json({
      valid: true,
      provider,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        display_name: user.display_name,
      },
    });
  } catch (error: any) {
    console.error('Token validation error:', error);
    return NextResponse.json(
      {
        valid: false,
        error: 'Failed to validate token',
        details: error.message
      },
      { status: 500 }
    );
  }
}
