import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client for privileged server-only operations.
 *
 * SECURITY: This client bypasses Row Level Security entirely.
 * - Never import this file into a Client Component ('use client').
 * - Never expose SUPABASE_SERVICE_ROLE_KEY with a NEXT_PUBLIC_ prefix.
 * - Only call this from Server Actions / Route Handlers that have already
 *   verified the caller is an authenticated admin.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}