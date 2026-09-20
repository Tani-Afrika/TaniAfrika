import { cookies } from 'next/headers';
import {
  DEV_ROLE_COOKIE,
  MOCK_USERS,
  type DevRole,
  type DevSessionUser,
} from './constants';

export * from './constants';

/**
 * Server-side helper to read dev session from cookies.
 * Only call from Server Components and Server Actions.
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
