import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/lib/models/User';
import { verifyOAuthToken } from '@/lib/auth/oauth';

/**
 * POST /api/signup - Create a new user account
 *
 * This endpoint is used for user registration. For login, use GET /api/me.
 *
 * Authentication Flow:
 * 1. Signup: POST /api/signup (creates new user with OAuth token)
 * 2. Login: GET /api/me (validates OAuth token and returns user data)
 * 3. Validation: GET /api/auth/validate (checks if token is valid)
 *
 * Session Management:
 * - OAuth tokens are stored in localStorage on the client
 * - Tokens persist across browser sessions
 * - No server-side session storage (stateless authentication)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, display_name, company_name, provider, oauth_token } = body;

    // Validation
    if (!role || !provider || !oauth_token) {
      return NextResponse.json(
        { error: 'Missing required fields: role, provider, oauth_token' },
        { status: 400 }
      );
    }

    if (role !== 'consumer' && role !== 'provider') {
      return NextResponse.json(
        { error: 'Role must be either "consumer" or "provider"' },
        { status: 400 }
      );
    }

    if (provider !== 'google' && provider !== 'github') {
      return NextResponse.json(
        { error: 'Provider must be either "google" or "github"' },
        { status: 400 }
      );
    }

    // Verify OAuth token with provider
    const oauthUser = await verifyOAuthToken(oauth_token, provider);
    if (!oauthUser) {
      return NextResponse.json(
        { error: 'Invalid OAuth token or token verification failed' },
        { status: 401 }
      );
    }

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(oauthUser.email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create user in database
    const user = await UserModel.create({
      email: oauthUser.email,
      role,
      display_name: display_name || oauthUser.name,
      company_name: role === 'provider' ? company_name : undefined,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'User created successfully. Use the same OAuth token for /me endpoint.',
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          display_name: user.display_name,
          created_at: user.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create user', details: error.message },
      { status: 500 }
    );
  }
}
