import { NextRequest, NextResponse } from 'next/server';
import { verifyGoogleToken } from '@/lib/auth/oauth';
import { UserModel } from '@/lib/models/User';
import { ProviderModel } from '@/lib/models/Provider';

async function getUserFromAuthHeader(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing or invalid Authorization header. Expected: Bearer <oauth_token>' };
  }

  const token = authHeader.substring(7);
  const userInfo = await verifyGoogleToken(token);
  if (!userInfo?.email) return { error: 'Invalid or expired OAuth token' };

  const user = await UserModel.findByEmail(userInfo.email);
  if (!user) return { error: 'User not found. Please signup first.' };
  return { user };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getUserFromAuthHeader(request);
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: 401 });
    const { user } = auth;
    if (user.role !== 'provider') {
      return NextResponse.json({ error: 'Only providers have a provider profile' }, { status: 403 });
    }
    const provider = await ProviderModel.getByUserId(user.id);
    if (!provider) return NextResponse.json({ error: 'Provider profile not found' }, { status: 404 });
    return NextResponse.json({ success: true, provider });
  } catch (error: any) {
    console.error('GET /providers/me error:', error);
    return NextResponse.json({ error: 'Failed to fetch provider profile', details: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getUserFromAuthHeader(request);
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: 401 });
    const { user } = auth;
    if (user.role !== 'provider') {
      return NextResponse.json({ error: 'Only providers can update provider profile' }, { status: 403 });
    }
    const body = await request.json();
    const { display_name, company_name, payout_account_id } = body;
    const updated = await ProviderModel.updateByUserId(user.id, {
      display_name,
      company_name,
      payout_account_id,
    });
    return NextResponse.json({ success: true, provider: updated });
  } catch (error: any) {
    console.error('PUT /providers/me error:', error);
    return NextResponse.json({ error: 'Failed to update provider profile', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return PUT(request);
}


