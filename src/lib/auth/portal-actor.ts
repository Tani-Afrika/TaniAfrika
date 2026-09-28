import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { MOCK_USERS, type DevSessionUser } from '@/lib/auth/constants';
import { getDevSession } from '@/lib/auth/dev-session';

const DEMO_USER_IDS = new Set(Object.values(MOCK_USERS).map((user) => user.id));

export type PortalActor = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string | null;
  devSession: DevSessionUser | null;
  usingDemo: boolean;
};

/**
 * Quick Demo roles share the four real Supabase accounts.
 * The service-role client is used only for those known ids, so one order
 * is visible to the client, the approved driver, and admin.
 * Email sign-in keeps using the caller's own session.
 */
export async function getPortalActor(): Promise<PortalActor> {
  const devSession = await getDevSession();
  if (
    devSession &&
    DEMO_USER_IDS.has(devSession.id) &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return {
      supabase: createAdminClient() as PortalActor['supabase'],
      userId: devSession.id,
      devSession,
      usingDemo: true,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    supabase,
    userId: user?.id ?? null,
    devSession: null,
    usingDemo: false,
  };
}
