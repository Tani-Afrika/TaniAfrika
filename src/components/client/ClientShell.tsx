'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import LogoutButton from '@/components/LogoutButton';
import { ClientIcon, type ClientIconName } from './ClientIcons';

const NAV_ITEMS: Array<{ href: string; label: string; icon: ClientIconName }> = [
  { href: '/client', label: 'Overview', icon: 'home' },
  { href: '/client/orders', label: 'My orders', icon: 'package' },
  { href: '/client/orders/new', label: 'Send a parcel', icon: 'plus' },
  { href: '/client/messages', label: 'Messages', icon: 'message' },
  { href: '/client/profile', label: 'Account', icon: 'user' },
];

export default function ClientShell({
  children,
  fullName,
  email,
}: {
  children: React.ReactNode;
  fullName: string;
  email: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const initials =
    fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'TA';

  const isActive = (href: string) =>
    href === '/client'
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  const sidebar = (
    <div className="flex h-full flex-col border-r border-[#C2E4D2]/60 bg-white text-[#101828]">
      <div className="flex h-[116px] items-center border-b border-[#C2E4D2]/60 px-8">
        <Link
          href="/client"
          className="flex items-center gap-4"
          onClick={() => setOpen(false)}
        >
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#1F5F3F] text-xl font-black text-white shadow-[0_8px_22px_rgba(31,95,63,.22)]">
            T
          </span>
          <div>
            <p className="text-[25px] font-black leading-none tracking-[-.04em]">
              Tani<span className="text-[#1F5F3F]">Afrika</span>
            </p>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[.2em] text-[#667085]">
              Client portal
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-2 px-5 py-6">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-4 rounded-2xl px-4 py-4 text-[15px] font-medium transition ${
                active
                  ? 'bg-[#E8F5EE] font-bold text-[#1F5F3F]'
                  : 'text-[#101828] hover:bg-[#F3FAF4] hover:text-[#1F5F3F]'
              }`}
            >
              <ClientIcon name={item.icon} className="h-6 w-6" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="m-5 overflow-hidden rounded-2xl border border-[#C2E4D2]/60 bg-white">
        <Link
          href="/client/profile"
          className="flex items-center gap-3 border-b border-[#C2E4D2]/60 p-4 transition hover:bg-[#F3FAF4]"
        >
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#E8F5EE] text-sm font-black text-[#1F5F3F]">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-[#101828]">{fullName}</p>
            <p className="mt-1 truncate text-xs text-[#667085]">{email}</p>
          </div>
          <span className="text-[#344054]">⌄</span>
        </Link>

        <Link
          href="/client/messages"
          className="flex items-center gap-3 px-5 py-4 text-sm font-medium text-[#344054] transition hover:bg-[#F3FAF4] hover:text-[#1F5F3F]"
        >
          <ClientIcon name="support" className="h-5 w-5" />
          Help &amp; support
        </Link>

        <div className="border-t border-[#C2E4D2]/60 px-5 py-1 [&_button]:flex [&_button]:w-full [&_button]:items-center [&_button]:justify-start [&_button]:gap-3 [&_button]:bg-transparent [&_button]:px-0 [&_button]:py-4 [&_button]:text-sm [&_button]:font-medium [&_button]:text-[#344054] hover:[&_button]:text-[#1F5F3F]">
          <LogoutButton />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F3FAF4] text-[#101828]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[304px] lg:block">
        {sidebar}
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-[#101828]/35 backdrop-blur-sm"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          />
          <aside className="relative h-full w-[304px] max-w-[88vw] shadow-2xl">
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-[304px]">
        <header className="sticky top-0 z-30 border-b border-[#C2E4D2]/60 bg-white/95 backdrop-blur-xl">
          <div className="flex h-[104px] items-center justify-between gap-4 px-4 sm:px-8 xl:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setOpen(true)}
                className="grid h-11 w-11 place-items-center rounded-xl border border-[#C2E4D2]/60 bg-white text-[#344054] shadow-sm lg:hidden"
                aria-label="Open navigation"
              >
                <ClientIcon name="menu" className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-[20px] font-bold tracking-[-.02em] text-[#101828]">
                  Welcome back, {fullName.split(' ')[0] || 'there'} 👋
                </p>
                <p className="mt-1 truncate text-sm text-[#667085]">
                  Manage every delivery from one place.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/client/orders/new"
                className="hidden items-center gap-3 rounded-xl bg-[#1F5F3F] px-5 py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(31,95,63,.18)] transition-[background-color,transform] duration-160 ease-out hover:bg-[#14422B] active:scale-[0.97] sm:inline-flex"
              >
                <ClientIcon name="plus" className="h-5 w-5" />
                New delivery
              </Link>
              <button
                className="relative grid h-14 w-14 place-items-center rounded-xl border border-[#C2E4D2]/60 bg-white text-[#344054] shadow-sm"
                aria-label="Notifications"
              >
                <ClientIcon name="bell" className="h-6 w-6" />
                <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-[#ef4444] ring-2 ring-white" />
              </button>
            </div>
          </div>
        </header>

        {/* Navigation & Portal Escape Banner */}
        <div className="bg-[#EBF8ED] border-b border-[#74C67A]/40 px-4 py-2.5 text-xs text-[#14422B] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span className="font-semibold">Client portal in development — switch to an active section anytime:</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="/driver"
              onClick={() => {
                document.cookie = 'taniafrika_dev_role=approved_driver; path=/; max-age=2592000';
              }}
              className="font-bold text-white bg-[#1F5F3F] hover:bg-[#14422B] px-3 py-1.5 rounded-xl transition shadow-xs"
            >
              🚗 Driver Portal
            </a>
            <a
              href="/admin"
              onClick={() => {
                document.cookie = 'taniafrika_dev_role=admin; path=/; max-age=2592000';
              }}
              className="font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 px-3 py-1.5 rounded-xl transition shadow-xs"
            >
              🛡️ Admin
            </a>
            <a
              href="/logout"
              className="font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-xl transition"
            >
              🚪 Exit
            </a>
          </div>
        </div>

        <main className="px-4 py-7 sm:px-8 xl:px-8">{children}</main>
      </div>
    </div>
  );
}
