import axios from 'axios';

export interface GoogleTokenInfo {
  email: string;
  name: string;
  picture: string;
  sub: string; // Google user ID
}

export interface GitHubUser {
  email: string;
  name: string;
  avatar_url: string;
  id: number;
}

/**
 * Verify Google OAuth token and get user info
 */
export async function verifyGoogleToken(token: string): Promise<GoogleTokenInfo | null> {
  try {
    const { data } = await axios.get<GoogleTokenInfo>(
      `https://www.googleapis.com/oauth2/v3/userinfo`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return data;
  } catch (error) {
    console.error('Google token verification failed:', error);
    return null;
  }
}

/**
 * Verify GitHub OAuth token and get user info
 */
export async function verifyGitHubToken(token: string): Promise<GitHubUser | null> {
  try {
    // Get user info
    const userResponse = await axios.get<GitHubUser>('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Get primary email if not public
    if (!userResponse.data.email) {
      const emailResponse = await axios.get<Array<{ email: string; primary: boolean }>>('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const primaryEmail = emailResponse.data.find((e) => e.primary);
      if (primaryEmail) {
        userResponse.data.email = primaryEmail.email;
      }
    }

    return userResponse.data;
  } catch (error) {
    console.error('GitHub token verification failed:', error);
    return null;
  }
}

/**
 * Verify OAuth token from either Google or GitHub
 */
export async function verifyOAuthToken(
  token: string,
  provider: 'google' | 'github'
): Promise<{ email: string; name: string; provider: string } | null> {
  if (provider === 'google') {
    const info = await verifyGoogleToken(token);
    if (!info) return null;
    return {
      email: info.email,
      name: info.name,
      provider: 'google',
    };
  } else if (provider === 'github') {
    const info = await verifyGitHubToken(token);
    if (!info) return null;
    return {
      email: info.email,
      name: info.name,
      provider: 'github',
    };
  }
  return null;
}
