import { NextRequest, NextResponse } from 'next/server';
import { verifyGoogleToken, verifyGitHubToken } from '@/lib/auth/oauth';
import { UserModel } from '@/lib/models/User';

/**
 * GET /api/me - Get current authenticated user (Login endpoint)
 *
 * This endpoint serves dual purposes:
 * 1. Login: Validates OAuth token and returns user data for existing users
 * 2. User Info: Returns current user's profile information
 *
 * For new users, use POST /api/signup instead.
 *
 * Session Persistence:
 * - Call this endpoint on app initialization to restore user session
 * - If token is valid and user exists, user is considered "logged in"
 * - If user doesn't exist (404), redirect to signup
 */
export async function GET(request: NextRequest) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header. Expected: Bearer <oauth_token>' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Try OAuth (Google/GitHub)
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
        { error: 'Invalid or expired OAuth token' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await UserModel.findByEmail(userInfo.email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please signup first.' },
        { status: 404 }
      );
    }

    // Return user info
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        display_name: user.display_name,
        created_at: user.created_at,
      },
      provider,
    });
  } catch (error: any) {
    console.error('Me route error:', error);
    return NextResponse.json(
      { error: 'Failed to get user info', details: error.message },
      { status: 500 }
    );
  }
}
