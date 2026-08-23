import Link from 'next/link';

import NavLinks from '@/components/NavLinks';
import LogoutButton from '@/components/LogoutButton';
import MobileNav from '@/components/MobileNav';
import { createClient } from '@/lib/supabase/server';
import { getDashboardStats } from '@/lib/queries';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') redirect('/login');

  const { pendingDriverApprovals } = await getDashboardStats();
  const initial = (profile?.full_name ?? 'A').trim().charAt(0).toUpperCase();

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
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-maroon-500 to-maroon-700 text-white shadow-sm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 11l8-7 8 7M5 10v9a1 1 0 0 0 1 1h3v-6h6v6h3a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="min-w-0">
            <span className="block truncate font-display text-lg font-semibold leading-tight text-ink-900">
              TaniAfrika
            </span>
            <p className="text-xs text-ink-400">Admin Dashboard</p>
          </div>
        </div>

        <p className="mb-2 px-4 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
          Menu
        </p>
        <NavLinks />

        {pendingDriverApprovals > 0 && (
          <Link
            href="/drivers?status=pending"
            className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-maroon-100 bg-maroon-50 px-4 py-3 text-sm transition hover:border-maroon-200 hover:bg-maroon-100"
          >
            <span className="font-medium text-ink-700">Pending approvals</span>
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-maroon-600 px-1.5 text-xs font-semibold text-white">
              {pendingDriverApprovals}
            </span>
          </Link>
        )}

        {/* Spacer pushes footer down without leaving dead space above it */}
        <div className="flex-1" />

        <div className="flex items-center gap-3 border-t border-ink-200/60 pt-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-maroon-100 text-sm font-semibold text-maroon-600">
            {initial}
          </div>
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink-700">
            {profile?.full_name}
          </p>
        </div>
        <div className="mt-3">
          <LogoutButton />
        </div>
      </aside>

      {/* Main content — offset by the sidebar's width on desktop so it never sits underneath the fixed sidebar */}
      <main className="px-4 py-6 sm:px-6 md:ml-72 lg:px-10 lg:py-10">
        <div className="page-shell">{children}</div>
      </main>
    </div>
  );
}