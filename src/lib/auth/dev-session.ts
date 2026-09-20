import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

export type DevRole = 'admin' | 'approved_driver' | 'pending_driver';

export const DEV_ROLE_COOKIE = 'taniafrika_dev_role';

export interface DevSessionUser {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'driver';
  approval_status: 'approved' | 'pending';
  redirectUrl: string;
  label: string;
}

export const MOCK_USERS: Record<DevRole, DevSessionUser> = {
  admin: {
    id: 'a0000000-0000-0000-0000-000000000001',
    email: 'admin@taniafrika.local',
    full_name: 'Wilfred Admin',
    role: 'admin',
    approval_status: 'approved',
    redirectUrl: '/',
    label: 'Admin',
  },
  approved_driver: {
    id: 'd0000000-0000-0000-0000-000000000001',
    email: 'driver@taniafrika.local',
    full_name: 'John Driver (Approved)',
    role: 'driver',
    approval_status: 'approved',
    redirectUrl: '/driver',
    label: 'Driver (Approved)',
  },
  pending_driver: {
    id: 'd0000000-0000-0000-0000-000000000002',
    email: 'pending.driver@taniafrika.local',
    full_name: 'Sam Driver (Pending)',
    role: 'driver',
    approval_status: 'pending',
    redirectUrl: '/driver/profile',
    label: 'Driver (Pending)',
  },
};

/**
 * Server-side helper to read dev session from cookies.
 */
export async function getDevSession(): Promise<DevSessionUser | null> {
  try {
    const cookieStore = await cookies();
    const roleKey = cookieStore.get(DEV_ROLE_COOKIE)?.value as DevRole | undefined;
    if (roleKey && MOCK_USERS[roleKey]) {
      return MOCK_USERS[roleKey];
    }
  } catch {
    // cookies() might be inaccessible in some contexts
  }
  return null;
}

/**
 * Middleware helper to read dev role from request cookies.
 */
export function getDevRoleFromRequest(request: NextRequest): DevRole | null {
  const roleKey = request.cookies.get(DEV_ROLE_COOKIE)?.value as DevRole | undefined;
  if (roleKey && MOCK_USERS[roleKey]) {
    return roleKey;
  }
  return null;
}
