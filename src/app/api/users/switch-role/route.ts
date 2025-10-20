import { NextRequest, NextResponse } from 'next/server';
import { verifyGoogleToken, verifyGitHubToken } from '@/lib/auth/oauth';
import { UserModel } from '@/lib/models/User';
import { ProviderModel } from '@/lib/models/Provider';
import { ConsumerModel } from '@/lib/models/Consumer';
import pool from '@/lib/db/postgres';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header. Expected: Bearer <oauth_token>' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify OAuth token (try Google first, then GitHub)
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

    // Get current user from database
    const user = await UserModel.findByEmail(userInfo.email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please signup first.' },
        { status: 404 }
      );
    }

    // Parse request body for optional data
    const body = await request.json().catch(() => ({}));
    const { company_name } = body;

    // Determine the new role (switch between consumer and provider)
    const currentRole = user.role;
    let newRole: 'consumer' | 'provider';

    if (currentRole === 'consumer') {
      newRole = 'provider';
    } else if (currentRole === 'provider') {
      newRole = 'consumer';
    } else {
      // Admin users cannot switch roles
      return NextResponse.json(
        { error: 'Admin users cannot switch roles' },
        { status: 403 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if record exists in the new role's table and create if needed
      if (newRole === 'provider') {
        const providerExists = await ProviderModel.getByUserId(user.id);
        if (!providerExists) {
          await ProviderModel.create(user.id, company_name);
        }
      } else if (newRole === 'consumer') {
        const consumerExists = await ConsumerModel.getByUserId(user.id);
        if (!consumerExists) {
          await ConsumerModel.create(user.id);
        }
      }

      // Update user role in users table
      await client.query(
        `UPDATE users SET role = $1 WHERE id = $2`,
        [newRole, user.id]
      );

      await client.query('COMMIT');

      // Fetch and return the appropriate profile
      let profile;
      if (newRole === 'provider') {
        profile = await ProviderModel.getByUserId(user.id);
      } else {
        profile = await ConsumerModel.getByUserId(user.id);
      }

      return NextResponse.json({
        success: true,
        message: `Successfully switched role from ${currentRole} to ${newRole}`,
        previous_role: currentRole,
        current_role: newRole,
        profile,
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Role switch error:', error);
    return NextResponse.json(
      { error: 'Failed to switch role', details: error.message },
      { status: 500 }
    );
  }
}
