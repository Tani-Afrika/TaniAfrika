'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NavLinks from './NavLinks';
import LogoutButton from './LogoutButton';

const ADMIN_BOTTOM_TABS = [
  {
    href: '/',
    label: 'Overview',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: '/orders',
    label: 'Orders',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    href: '/drivers',
    label: 'Drivers',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="1" y="3" width="15" height="13" rx="2" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
  },
  {
    href: '/bids',
    label: 'Bids',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10" />
        <path d="m16 16 6-6" />
        <path d="m8 8 6-6" />
        <path d="m9 7 8 8" />
        <path d="m21 11-8-8" />
      </svg>
    ),
  },
  {
    href: '/clients',
    label: 'Clients',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isTabActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="md:hidden">
      {/* Compact Native Top Header */}
      <header className="sticky top-0 z-20 flex h-13 items-center justify-between border-b border-slate-200/80 bg-white/95 px-3.5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-1.5">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#1F5F3F] text-xs font-bold text-white shadow-xs">
              T
            </span>
            <span className="font-display text-sm font-bold tracking-tight text-slate-950">
              Tani<span className="text-[#1F5F3F]">Afrika</span>
            </span>
          </Link>
          <span className="rounded-full bg-[#1F5F3F]/10 px-2 py-0.5 text-[10px] font-bold text-[#1F5F3F]">
            Admin
          </span>
        </div>

        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      {/* Slide-out Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <button
            aria-label="Close menu"
            className="flex-1 bg-black/30 backdrop-blur-xs animate-[fadeIn_150ms_ease-out]"
            onClick={() => setOpen(false)}
          />
          <div className="flex w-72 flex-col justify-between bg-white p-4 shadow-xl animate-[slideIn_200ms_ease-out]">
            <div>
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#1F5F3F] text-xs font-bold text-white">
                    T
                  </span>
                  <span className="font-display text-base font-bold text-slate-950">TaniAfrika Admin</span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
            <div className="border-t border-slate-100 pt-3">
              <LogoutButton />
            </div>
          </div>
        </div>
      )}

      {/* Persistent React Native-Style Bottom Tab Bar */}
      <nav
        aria-label="Admin mobile navigation"
        className="fixed bottom-0 inset-x-0 z-40 flex h-14 items-center justify-around border-t border-slate-200/90 bg-white/95 px-1 backdrop-blur-md safe-bottom shadow-[0_-2px_10px_rgba(0,0,0,0.04)]"
      >
        {ADMIN_BOTTOM_TABS.map((tab) => {
          const active = isTabActive(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`native-press flex flex-1 flex-col items-center justify-center py-1 transition-colors ${
                active ? 'text-[#1F5F3F]' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div
                className={`flex h-7 w-10 items-center justify-center rounded-full transition-all ${
                  active ? 'bg-[#1F5F3F]/12 text-[#1F5F3F]' : 'text-slate-500'
                }`}
              >
                {tab.icon}
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