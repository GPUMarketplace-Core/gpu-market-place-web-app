export async function me(accessToken: string) {
  const res = await fetch('/api/me', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res;
}

export async function signup(accessToken: string, role: 'consumer' | 'provider', displayName?: string, companyName?: string) {
  const res = await fetch('/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, display_name: displayName, company_name: companyName, provider: 'google', oauth_token: accessToken }),
  });
  return res;
}


