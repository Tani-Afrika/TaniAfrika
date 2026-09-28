'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DEV_ROLE_COOKIE, MOCK_USERS, type DevRole } from '@/lib/auth/dev-session';

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

  // The four Quick Demo people already exist in Auth and profiles.
  // Do not upsert approval here: that would mark Sam as pending in the
  // database and hide open orders from him.
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
