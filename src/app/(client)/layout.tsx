import { redirect } from 'next/navigation';

import ClientShell from '@/components/client/ClientShell';
import { createClient } from '@/lib/supabase/server';
import { getDevSession } from '@/lib/auth/dev-session';

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const devSession = await getDevSession();
  let clientProfile: { fullName: string; email: string } = {
    fullName: 'Alice Client',
    email: 'client@taniafrika.local',
  };

  if (devSession) {
    if (devSession.role !== 'client') redirect('/login');
    clientProfile = {
      fullName: devSession.full_name,
      email: devSession.email,
    };
  } else {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'client') redirect('/login');

    clientProfile = {
      fullName: profile?.full_name ?? 'TaniAfrika Client',
      email: user.email ?? '',
    };
  }

  return (
    <ClientShell fullName={clientProfile.fullName} email={clientProfile.email}>
      {children}
    </ClientShell>
  );
}
