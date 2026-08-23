'use client';

import { useState } from 'react';
import NavLinks from './NavLinks';
import LogoutButton from './LogoutButton';

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <div className="flex items-center justify-between border-b border-ink-200 bg-white px-4 py-3">
        <span className="font-display text-lg font-semibold text-maroon-600">TaniAfrika</span>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          className="rounded-md p-2 text-ink-600 transition hover:bg-ink-200/40"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <button
            aria-label="Close menu"
            className="flex-1 bg-black/30 animate-[fadeIn_180ms_ease-out]"
            onClick={() => setOpen(false)}
          />
          <div className="flex w-72 flex-col justify-between bg-white p-4 shadow-xl animate-[slideIn_220ms_ease-out]">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <span className="font-display text-lg font-semibold text-maroon-600">Menu</span>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="rounded-md p-2 text-ink-600 transition hover:bg-ink-200/40"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
            <LogoutButton />
          </div>
        </div>
      )}
    </div>
  );
}