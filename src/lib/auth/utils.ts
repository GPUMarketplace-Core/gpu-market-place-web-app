import { NextRequest } from 'next/server';
import { verifyGoogleToken, verifyGitHubToken } from '@/lib/auth/oauth';
import { UserModel, User } from '@/lib/models/User';

export type AuthResult = { user: User } | { error: string };

export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing or invalid Authorization header. Expected: Bearer <token>' };
  }

  const token = authHeader.substring(7);

  // Try OAuth (Google/GitHub)
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

  if (!userInfo?.email) {
    return { error: 'Invalid or expired token' };
  }

  const user = await UserModel.findByEmail(userInfo.email);
  if (!user) {
    return { error: 'User not found. Please signup first.' };
  }

  return { user };
}

