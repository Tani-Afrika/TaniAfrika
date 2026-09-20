import Link from 'next/link';
import { redirect } from 'next/navigation';

import NavLinks from '@/components/NavLinks';
import LogoutButton from '@/components/LogoutButton';
import MobileNav from '@/components/MobileNav';
import { createClient } from '@/lib/supabase/server';
import { getDashboardStats } from '@/lib/queries';
import { getDevSession } from '@/lib/auth/dev-session';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const devSession = await getDevSession();
  let user: { id: string; email?: string } | null = null;
  let profile: { full_name?: string | null; role?: string } | null = null;

  if (devSession) {
    if (devSession.role !== 'admin') redirect('/login');
    user = { id: devSession.id, email: devSession.email };
    profile = { full_name: devSession.full_name, role: devSession.role };
  } else {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) redirect('/login');
    user = authData.user;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single();

    if (profileData?.role !== 'admin') redirect('/login');
    profile = profileData;
  }

  const { pendingDriverApprovals } = await getDashboardStats();
  const initial = (profile?.full_name ?? user?.email ?? 'A').trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      {/* Mobile top bar + drawer */}
      <MobileNav />

      {/* Desktop sidebar — fixed to the viewport, does not scroll with content */}
      <aside
        className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-72 md:flex-col md:overflow-y-auto md:bg-white md:p-6"
        style={{ boxShadow: 'var(--shadow-sidebar)' }}
      >
        <div className="mb-8 flex items-center gap-3 px-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1F5F3F] text-white shadow-sm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 11l8-7 8 7M5 10v9a1 1 0 0 0 1 1h3v-6h6v6h3a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="min-w-0">
            <span className="block truncate font-display text-lg font-semibold leading-tight text-ink-900">
              Tani<span className="text-[#1F5F3F]">Afrika</span>
            </span>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7A9080]">Admin Operations</p>
          </div>
        </div>

        <p className="mb-2 px-4 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
          Menu
        </p>
        <NavLinks />

        {pendingDriverApprovals > 0 && (
          <Link
            href="/drivers?status=pending"
            className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm transition hover:border-amber-300 hover:bg-amber-100/70"
          >
            <span className="font-semibold text-amber-950">Pending approvals</span>
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-600 px-1.5 text-xs font-bold text-white">
              {pendingDriverApprovals}
            </span>
          </Link>
        )}

        {/* Spacer pushes footer down without leaving dead space above it */}
        <div className="flex-1" />

        <div className="flex items-center gap-3 border-t border-ink-200/60 pt-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1F5F3F]/10 text-sm font-semibold text-[#1F5F3F]">
            {initial}
          </div>
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink-700">
            {profile?.full_name ?? user?.email ?? 'Preview Admin'}
          </p>
        </div>
        {user && (
          <div className="mt-3">
            <LogoutButton />
          </div>
        )}
      </aside>

      {/* Main content — offset by the sidebar's width on desktop, with safe mobile bottom spacing */}
      <main className="px-3.5 py-4 pb-mobile-nav sm:px-6 md:ml-72 md:pb-8 lg:px-10 lg:py-8">
        <div className="page-shell">{children}</div>
      </main>
    </div>
  );
}