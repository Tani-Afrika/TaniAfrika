'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import LogoutButton from '@/components/LogoutButton';
import {
  BellIcon,
  BoxIcon,
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
  { href: '/driver/profile', label: 'Account', icon: UserIcon },
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
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'DR';
}

export default function DriverShell({ children, profile }: DriverShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/driver') return pathname === '/driver';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-[#fffdfb]">
      <div className="border-b border-orange-100 px-5 py-6">
        <Link href="/driver" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 text-xl font-black text-white shadow-lg shadow-orange-200/70">T</span>
          <span>
            <span className="block font-display text-xl font-bold tracking-tight text-slate-950">Tani<span className="text-orange-600">Afrika</span></span>
            <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Driver portal</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-5">
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
                  ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-100'
                  : 'text-slate-700 hover:bg-orange-50/70 hover:text-orange-600'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4">
        <div className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm">
          <Link href="/driver/profile" className="flex items-center gap-3 border-b border-orange-100 px-4 py-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-orange-50 font-bold text-orange-600">
              {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" /> : initials(profile.fullName)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slate-950">{profile.fullName}</span>
              <span className="block truncate text-xs text-slate-500">{profile.email}</span>
            </span>
          </Link>
          <div className="px-4 py-3 [&_button]:w-full [&_button]:justify-start [&_button]:border-0 [&_button]:bg-transparent [&_button]:px-0 [&_button]:py-2 [&_button]:text-sm [&_button]:font-medium [&_button]:text-slate-700 [&_button]:shadow-none hover:[&_button]:text-orange-600">
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fffaf6] text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[286px] border-r border-orange-100 lg:block">{sidebar}</aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/25 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-label="Close menu" />
          <aside className="relative h-full w-[86%] max-w-[320px] border-r border-orange-100 shadow-2xl">
            <button onClick={() => setMobileOpen(false)} className="absolute right-4 top-5 z-10 grid h-10 w-10 place-items-center rounded-xl border border-orange-100 bg-white text-slate-600" aria-label="Close menu">
              <XIcon className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-[286px]">
        <header className="sticky top-0 z-20 flex min-h-[82px] items-center justify-between border-b border-orange-100 bg-white/90 px-4 backdrop-blur-xl sm:px-6 xl:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="grid h-11 w-11 place-items-center rounded-xl border border-orange-100 bg-white text-slate-700 lg:hidden" aria-label="Open menu">
              <MenuIcon className="h-5 w-5" />
            </button>
            <div>
              <p className="text-sm font-semibold text-slate-950">Welcome back, {profile.fullName.split(' ')[0]}</p>
              <p className="mt-0.5 hidden text-xs text-slate-500 sm:block">Manage bids, deliveries and earnings from one place.</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Link href="/driver/orders" className="hidden min-h-11 items-center gap-2 rounded-xl bg-orange-600 px-4 text-sm font-semibold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-700 sm:inline-flex">
              <SearchIcon className="h-4 w-4" /> Find deliveries
            </Link>
            <button className="relative grid h-11 w-11 place-items-center rounded-xl border border-orange-100 bg-white text-slate-700 shadow-sm" aria-label="Notifications">
              <BellIcon className="h-5 w-5" />
              <span className="absolute right-2.5 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 sm:py-8 xl:px-8">{children}</main>
      </div>
    </div>
  );
}
