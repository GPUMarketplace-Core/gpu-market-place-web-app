/**
 * Login / Get current user info
 * This endpoint validates the OAuth token and returns user data
 */
export async function me(accessToken: string) {
  const res = await fetch('/api/me', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res;
}

/**
 * Signup - Create a new user account
 */
export async function signup(accessToken: string, role: 'consumer' | 'provider', displayName?: string, companyName?: string) {
  const res = await fetch('/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, display_name: displayName, company_name: companyName, provider: 'google', oauth_token: accessToken }),
  });
  return res;
}

/**
 * Validate OAuth token
 * Quick validation without returning full user data
 */
export async function validateToken(accessToken: string) {
  const res = await fetch('/api/auth/validate', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res;
}

/**
 * Switch user role between consumer and provider
 * If switching to a role for the first time, the corresponding record will be created
 */
export async function switchRole(accessToken: string, companyName?: string) {
  const res = await fetch('/api/users/switch-role', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ company_name: companyName }),
  });
  return res;
}

/**
 * Fetch user profile by type and ID
 * @param userType - 'consumer' or 'provider'
 * @param userId - User ID
 * @param accessToken - OAuth access token
 */
export async function getUserProfile(accessToken: string, userType: 'consumer' | 'provider', userId: string) {
  const res = await fetch(`/api/users/${userType}/${userId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res;
}


