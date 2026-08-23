import { redirect } from 'next/navigation';

import ClientShell from '@/components/client/ClientShell';
import { createClient } from '@/lib/supabase/server';

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'client') redirect('/login');

  return (
    <ClientShell fullName={profile.full_name ?? 'TaniAfrika Client'} email={user.email ?? ''}>
      {children}
    </ClientShell>
  );
}
