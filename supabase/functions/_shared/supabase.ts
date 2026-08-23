import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.110.5';

import { requireEnv } from './http.ts';

function firstJsonKey(name: string): string | undefined {
  const raw = Deno.env.get(name);
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed.default ?? Object.values(parsed)[0];
  } catch {
    return undefined;
  }
}

function secretKey(): string {
  return Deno.env.get('SUPABASE_SECRET_KEY')
    ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    ?? firstJsonKey('SUPABASE_SECRET_KEYS')
    ?? requireEnv('SUPABASE_SERVICE_ROLE_KEY');
}

function publishableKey(): string {
  return Deno.env.get('SUPABASE_PUBLISHABLE_KEY')
    ?? Deno.env.get('SUPABASE_ANON_KEY')
    ?? firstJsonKey('SUPABASE_PUBLISHABLE_KEYS')
    ?? requireEnv('SUPABASE_ANON_KEY');
}

export function adminClient(): SupabaseClient {
  return createClient(requireEnv('SUPABASE_URL'), secretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function requestClient(request: Request): SupabaseClient {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) throw new Error('Authentication required.');

  return createClient(requireEnv('SUPABASE_URL'), publishableKey(), {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function authenticatedUser(request: Request) {
  const client = requestClient(request);
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new Error('Authentication required.');
  return { client, user };
}

