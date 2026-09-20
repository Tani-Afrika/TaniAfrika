import { ClientIcon, type ClientIconName } from '@/components/client/ClientIcons';
import LogoutButton from '@/components/LogoutButton';
import { createClient } from '@/lib/supabase/server';

import { getDevSession } from '@/lib/auth/dev-session';

export default async function ClientProfilePage() {
  const devSession = await getDevSession();
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const user = devSession ? { id: devSession.id, email: devSession.email } : authUser;
  if (!user) return null;
  const name = devSession?.full_name ?? 'TaniAfrika Client';
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((part: string) => part[0]).join('').toUpperCase();

  const rows: Array<{ icon: ClientIconName; title: string; text: string }> = [
    { icon: 'pin', title: 'Saved addresses', text: 'Manage frequent pickup and drop-off locations.' },
    { icon: 'card', title: 'Payment methods', text: 'Manage how you pay for completed deliveries.' },
    { icon: 'support', title: 'Help and support', text: 'Get assistance with your account or an order.' },
    { icon: 'settings', title: 'Preferences', text: 'Control notifications and account preferences.' },
  ];

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <div><p className="text-xs font-black uppercase tracking-[.18em] text-[#ef4d16]">Account centre</p><h1 className="mt-2 text-3xl font-black tracking-[-.035em] sm:text-4xl">Profile & settings</h1><p className="mt-2 text-sm text-[#6b7280]">Keep your personal and delivery information up to date.</p></div>
      <section className="overflow-hidden rounded-[28px] border border-[#ffe0d2] bg-white shadow-[0_16px_45px_rgba(255,90,31,.10)]"><div className="bg-gradient-to-r from-[#ff5a1f] to-[#ff8a4c] p-6 text-white sm:p-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-center"><div className="grid h-20 w-20 place-items-center rounded-[24px] bg-[#ff5a1f] text-2xl font-black shadow-xl">{initials}</div><div><h2 className="text-2xl font-black">{name}</h2><p className="mt-1 text-sm text-white/60">{user.email}</p></div></div></div><div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">{rows.map((row) => <button key={row.title} className="flex items-start gap-4 rounded-2xl border border-[#ffe3d6] bg-[#ffffff] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#ffc6aa] hover:shadow-lg"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#fff0e8] text-[#ef4d16]"><ClientIcon name={row.icon} className="h-5 w-5" /></span><span><span className="block text-sm font-black">{row.title}</span><span className="mt-1 block text-xs leading-5 text-[#6b7280]">{row.text}</span></span></button>)}</div></section>
      <section className="flex flex-col gap-4 rounded-[24px] border border-[#ffd2bf] bg-[#fff6f1] p-5 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-black">Sign out of your account</h3><p className="mt-1 text-sm text-[#6b7280]">You can safely sign in again at any time.</p></div><div className="[&_button]:rounded-xl [&_button]:bg-[#ef4d16] [&_button]:px-5 [&_button]:py-3 [&_button]:text-sm [&_button]:font-black [&_button]:text-white"><LogoutButton /></div></section>
    </div>
  );
}
