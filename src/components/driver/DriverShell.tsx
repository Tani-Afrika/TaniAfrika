'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import LogoutButton from '@/components/LogoutButton';
import {
  BellIcon,
  GavelIcon,
  HomeIcon,
  MenuIcon,
  MessageIcon,
  SearchIcon,
  TruckIcon,
  UserIcon,
  WalletIcon,
  XIcon,
} from './DriverIcons';

const NAV_ITEMS = [
  { href: '/driver', label: 'Overview', icon: HomeIcon },
  { href: '/driver/orders', label: 'Find deliveries', icon: SearchIcon },
  { href: '/driver/bids', label: 'My bids', icon: GavelIcon },
  { href: '/driver/active', label: 'Active delivery', icon: TruckIcon },
  { href: '/driver/earnings', label: 'Earnings', icon: WalletIcon },
  { href: '/driver/messages', label: 'Messages', icon: MessageIcon },
  { href: '/driver/profile', label: 'Account & Vehicle', icon: UserIcon },
] as const;

type DriverShellProps = {
  children: React.ReactNode;
  profile: {
    fullName: string;
    email: string;
    avatarUrl: string | null;
  };
};

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'DR'
  );
}

export default function DriverShell({ children, profile }: DriverShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/driver') return pathname === '/driver';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-slate-100 px-5 py-6">
        <Link href="/driver" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#1F5F3F] text-xl font-black text-white shadow-md">
            T
          </span>
          <span>
            <span className="block font-display text-xl font-bold tracking-tight text-slate-950">
              Tani<span className="text-[#1F5F3F]">Afrika</span>
            </span>
            <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7A9080]">
              Driver Workspace
            </span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex min-h-12 items-center gap-3 rounded-2xl px-4 text-sm font-semibold transition ${
                active
                  ? 'bg-[#1F5F3F]/10 text-[#1F5F3F] font-bold'
                  : 'text-slate-700 hover:bg-[#1F5F3F]/5 hover:text-[#1F5F3F]'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <Link href="/driver/profile" className="flex items-center gap-3 border-b border-slate-100 px-4 py-4 hover:bg-slate-50 transition">
            <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-[#1F5F3F]/10 font-bold text-[#1F5F3F]">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                initials(profile.fullName)
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slate-950">{profile.fullName}</span>
              <span className="block truncate text-xs text-slate-500">{profile.email}</span>
            </span>
          </Link>
          <div className="px-4 py-2 [&_button]:w-full [&_button]:justify-start [&_button]:border-0 [&_button]:bg-transparent [&_button]:px-0 [&_button]:py-2 [&_button]:text-sm [&_button]:font-medium [&_button]:text-slate-700 [&_button]:shadow-none hover:[&_button]:text-[#1F5F3F]">
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  );

  const bottomTabs = [
    { href: '/driver', label: 'Home', icon: HomeIcon },
    { href: '/driver/orders', label: 'Loads', icon: SearchIcon },
    { href: '/driver/active', label: 'Active', icon: TruckIcon },
    { href: '/driver/bids', label: 'Bids', icon: GavelIcon },
    { href: '/driver/profile', label: 'Account', icon: UserIcon },
  ];

  return (
    <div className="min-h-screen bg-[#FFF8F4] text-slate-950 pb-mobile-nav lg:pb-0">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[286px] border-r border-slate-200/80 bg-white lg:block">
        {sidebar}
      </aside>

      {/* Mobile Drawer (Accessible from avatar/menu) */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-xs animate-[fadeIn_150ms_ease-out]"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />
          <aside className="relative h-full w-[82%] max-w-[300px] border-r border-slate-200 bg-white shadow-2xl animate-[slideIn_200ms_ease-out]">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3.5 top-4 z-10 grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600"
              aria-label="Close menu"
            >
              <XIcon className="h-4 w-4" />
            </button>
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-[286px]">
        {/* Compact Mobile Top App Bar (React Native Header Feel) */}
        <header className="sticky top-0 z-20 flex h-13 items-center justify-between border-b border-slate-200/80 bg-white/95 px-3.5 backdrop-blur-md sm:h-15 sm:px-6">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-slate-50/80 text-slate-700 lg:hidden"
              aria-label="Open menu"
            >
              <MenuIcon className="h-4.5 w-4.5" />
            </button>

            <Link href="/driver" className="flex items-center gap-1.5">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#1F5F3F] text-xs font-bold text-white shadow-xs">
                T
              </span>
              <span className="font-display text-sm font-bold tracking-tight text-slate-950 sm:text-base">
                Tani<span className="text-[#1F5F3F]">Afrika</span>
              </span>
            </Link>

            <span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/driver/orders"
              className="hidden h-9 items-center gap-1.5 rounded-lg bg-[#1F5F3F] px-3 text-xs font-semibold text-white shadow-xs transition hover:bg-[#184c32] sm:inline-flex"
            >
              <SearchIcon className="h-3.5 w-3.5" /> Find Loads
            </Link>

            <button
              className="relative grid h-8.5 w-8.5 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-2xs"
              aria-label="Notifications"
            >
              <BellIcon className="h-4 w-4" />
              <span className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-[#D4A244] ring-1.5 ring-white" />
            </button>

            <Link
              href="/driver/profile"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-1 transition hover:border-[#1F5F3F]/30"
              aria-label="Go to driver profile"
            >
              <span className="grid h-6.5 w-6.5 shrink-0 place-items-center overflow-hidden rounded-md bg-[#1F5F3F]/10 text-[11px] font-bold text-[#1F5F3F]">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials(profile.fullName)
                )}
              </span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="px-3 py-4 sm:px-6 sm:py-6 xl:px-8">{children}</main>
      </div>

      {/* React Native-Style Persistent Bottom Tab Bar (Mobile Only) */}
      <nav
        aria-label="Mobile navigation"
        className="fixed bottom-0 inset-x-0 z-40 flex h-14 items-center justify-around border-t border-slate-200/90 bg-white/95 px-1 backdrop-blur-md safe-bottom shadow-[0_-2px_10px_rgba(0,0,0,0.04)] lg:hidden"
      >
        {bottomTabs.map((tab) => {
          const active = isActive(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`native-press flex flex-1 flex-col items-center justify-center py-1 transition-colors ${
                active ? 'text-[#1F5F3F]' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div
                className={`flex h-7 w-11 items-center justify-center rounded-full transition-all ${
                  active ? 'bg-[#1F5F3F]/12 text-[#1F5F3F]' : 'text-slate-500'
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
              </div>
              <span
                className={`mt-0.5 text-[10px] tracking-tight ${
                  active ? 'font-bold text-[#1F5F3F]' : 'font-medium text-slate-500'
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
