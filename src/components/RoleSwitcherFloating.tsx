'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { DEV_ROLE_COOKIE, type DevRole } from '@/lib/auth/constants';

interface RoleOption {
  label: string;
  role: DevRole;
  href: string;
  icon: string;
  desc: string;
}

const ROLES: RoleOption[] = [
  {
    label: 'Driver Portal',
    role: 'approved_driver',
    href: '/driver',
    icon: '🚗',
    desc: 'Marketplace, bidding & active loads',
  },
  {
    label: 'Driver Verification',
    role: 'pending_driver',
    href: '/driver/profile',
    icon: '⏳',
    desc: 'KYC & 2-column vehicle registration',
  },
  {
    label: 'Admin Operations',
    role: 'admin',
    href: '/admin',
    icon: '🛡️',
    desc: 'Fleet overview & driver approvals',
  },
  {
    label: 'Client Portal',
    role: 'client',
    href: '/client',
    icon: '📦',
    desc: 'Customer bookings & parcel tracking',
  },
];

export default function RoleSwitcherFloating() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  // Determine current surface
  const isDriver = pathname.startsWith('/driver');
  const isAdmin = pathname.startsWith('/admin');
  const isClient = pathname.startsWith('/client');
  const isAuth = pathname.startsWith('/login') || pathname.startsWith('/signup');

  const currentLabel = isDriver
    ? 'Driver'
    : isAdmin
    ? 'Admin'
    : isClient
    ? 'Client'
    : isAuth
    ? 'Auth'
    : 'Portal';

  const currentIcon = isDriver ? '🚗' : isAdmin ? '🛡️' : isClient ? '📦' : '🌐';

  const handleSwitch = (opt: RoleOption) => {
    setSwitching(true);
    // Set dev role cookie directly for 30 days
    document.cookie = `${DEV_ROLE_COOKIE}=${opt.role}; path=/; max-age=2592000; SameSite=Lax`;
    setOpen(false);
    // Hard navigate to ensure server components read the new role cookie cleanly
    window.location.href = opt.href;
  };

  const handleLogout = () => {
    setSwitching(true);
    window.location.href = '/logout';
  };

  return (
    <aside aria-label="Quick Portal Switcher" className="fixed bottom-4 right-4 z-50 flex flex-col items-end print:hidden">
      {/* Expanded Modal / Flyout Menu */}
      {open ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-2xs"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-50 mb-2 w-80 max-w-[92vw] overflow-hidden rounded-2xl border-2 border-[#1F5F3F]/30 bg-white p-4 text-slate-900 shadow-2xl animate-[fadeIn_150ms_ease-out]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#EBF8ED] text-xs font-bold text-[#1F5F3F] border border-[#74C67A]/40">
                  ⇄
                </span>
                <div>
                  <h4 className="font-display text-xs font-bold text-[#14422B]">
                    TaniAfrika Portal Switcher
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Switch between roles anytime
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="grid h-6 w-6 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close switcher"
              >
                ✕
              </button>
            </div>

            {/* Role Options */}
            <div className="space-y-1.5">
              {ROLES.map((opt) => {
                const isSelected =
                  (opt.role === 'approved_driver' && isDriver && !pathname.includes('profile')) ||
                  (opt.role === 'pending_driver' && pathname.includes('profile')) ||
                  (opt.role === 'admin' && isAdmin) ||
                  (opt.role === 'client' && isClient);

                return (
                  <button
                    key={opt.role}
                    onClick={() => handleSwitch(opt)}
                    disabled={switching}
                    className={`w-full flex items-start gap-2.5 rounded-xl p-2 text-left transition ${
                      isSelected
                        ? 'bg-[#EBF8ED] border border-[#74C67A] text-[#14422B] shadow-2xs font-bold'
                        : 'border border-slate-100 bg-slate-50/70 hover:bg-slate-100/90 text-slate-800'
                    }`}
                  >
                    <span className="text-base shrink-0 mt-0.5">{opt.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{opt.label}</span>
                        {isSelected && (
                          <span className="text-[9px] font-bold text-[#1F5F3F] uppercase tracking-wider">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 truncate leading-tight">
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer / Exit */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <button
                onClick={() => {
                  setOpen(false);
                  router.push('/');
                }}
                className="text-slate-500 hover:text-[#1F5F3F] font-semibold"
              >
                ← Homepage
              </button>
              <button
                onClick={handleLogout}
                disabled={switching}
                className="flex items-center gap-1 font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition"
              >
                <span>🚪</span> Sign Out
              </button>
            </div>
          </div>
        </>
      ) : null}

      {/* Floating Trigger Pill */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="group flex items-center gap-2 rounded-full border-2 border-[#1F5F3F]/35 bg-white/95 px-3.5 py-2 text-xs font-bold text-[#14422B] shadow-lg backdrop-blur-md transition hover:bg-[#EBF8ED] hover:border-[#1F5F3F] active:scale-[0.96]"
        title="Switch portal role (Driver / Admin / Client)"
      >
        <span className="text-sm">{currentIcon}</span>
        <span>{currentLabel}</span>
        <span className="rounded-md bg-[#1F5F3F] px-1.5 py-0.5 text-[9px] font-extrabold text-white group-hover:bg-[#14422B]">
          Switch ▾
        </span>
      </button>
    </aside>
  );
}
