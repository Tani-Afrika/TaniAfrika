import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DriverShell from '@/components/driver/DriverShell';
import { getDevSession } from '@/lib/auth/dev-session';

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const devSession = await getDevSession();
  let driverProfile = {
    fullName: 'John Driver',
    email: 'driver@taniafrika.local',
    avatarUrl: null as string | null | undefined,
  };

  if (devSession) {
    if (devSession.role !== 'driver') redirect('/login');
    driverProfile = {
      fullName: devSession.full_name,
      email: devSession.email,
      avatarUrl: null,
    };
  } else {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) redirect('/login');

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name, avatar_url, approval_status')
      .eq('id', authData.user.id)
      .single();

    if (profile?.role !== 'driver') redirect('/login');

    driverProfile = {
      fullName: profile?.full_name ?? 'Driver',
      email: authData.user?.email ?? '',
      avatarUrl: profile?.avatar_url,
    };
  }

  return (
    <DriverShell profile={driverProfile}>
      {children}
    </DriverShell>
  );
}