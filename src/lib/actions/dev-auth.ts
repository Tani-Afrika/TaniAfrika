'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DEV_ROLE_COOKIE, MOCK_USERS, type DevRole } from '@/lib/auth/dev-session';
import { createAdminClient } from '@/lib/supabase/admin';

export async function loginAsDevUser(roleKey: DevRole): Promise<{
  success: boolean;
  error?: string;
  redirect?: string;
}> {
  const user = MOCK_USERS[roleKey];
  if (!user) {
    return { success: false, error: `Unknown dev role: ${roleKey}` };
  }

  // Set dev role session cookie
  const cookieStore = await cookies();
  cookieStore.set(DEV_ROLE_COOKIE, roleKey, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: 'lax',
    httpOnly: false,
  });

  // If service role key is available, ensure profile exists in database for relational queries
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const adminClient = createAdminClient();
      await adminClient.from('profiles').upsert(
        {
          id: user.id,
          role: user.role,
          full_name: user.full_name,
          approval_status: user.approval_status,
          account_status: 'active',
          is_active: true,
        },
        { onConflict: 'id' }
      );

      if (user.role === 'driver') {
        await adminClient.from('driver_profiles').upsert(
          {
            user_id: user.id,
            approval_status: user.approval_status,
            verification_status: user.approval_status === 'approved' ? 'verified' : 'pending',
          },
          { onConflict: 'user_id' }
        );
      }
    } catch {
      // Graceful fallback
    }
  }

  return { success: true, redirect: user.redirectUrl };
}

export async function loginAsDevUserFormAction(formData: FormData) {
  const role = formData.get('role') as DevRole;
  const result = await loginAsDevUser(role);
  if (result.success && result.redirect) {
    redirect(result.redirect);
  }
}

export async function logoutDevUser(): Promise<{ success: boolean; redirect: string }> {
  const cookieStore = await cookies();
  cookieStore.delete(DEV_ROLE_COOKIE);
  return { success: true, redirect: '/login' };
}
