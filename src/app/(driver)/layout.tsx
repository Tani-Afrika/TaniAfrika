import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DriverShell from '@/components/driver/DriverShell';

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, avatar_url, approval_status')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'driver') redirect('/login');

  if (profile.approval_status !== 'approved') {
    return (
      <main className="grid min-h-screen place-items-center bg-[#fffaf6] px-4">
        <section className="w-full max-w-lg rounded-3xl border border-orange-100 bg-white p-7 text-center shadow-xl shadow-orange-100/50 sm:p-8">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-orange-50 text-2xl">⏳</span>
          <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-600">Driver verification</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-slate-950">Your account is under review</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">TaniAfrika is reviewing your driver and vehicle details. You will gain access to delivery opportunities immediately after approval.</p>
        </section>
      </main>
    );
  }

  return (
    <DriverShell profile={{ fullName: profile.full_name ?? 'Driver', email: user.email ?? '', avatarUrl: profile.avatar_url }}>
      {children}
    </DriverShell>
  );
}