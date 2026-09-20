'use client';

import { Suspense, useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { loginAsDevUserFormAction } from '@/lib/actions/dev-auth';
// Import from constants (not dev-session) — dev-session.ts pulls in
// next/headers, which is server-only and breaks when a Client Component
// imports it, even just for a re-exported string constant.
import { DEV_ROLE_COOKIE } from '@/lib/auth/constants';

export function UniversalLoginForm() {
  return (
    <Suspense fallback={null}>
      <UniversalLoginFormInner />
    </Suspense>
  );
}

function UniversalLoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Where to send the user after a successful sign-in — set by any page that
  // sent a guest here mid-transaction (e.g. "Book this delivery" from the
  // public quote widget on the homepage). Falls back to the role's home.
  const redirectTo = searchParams.get('redirectTo');
  const intentNotice = searchParams.get('intent') === 'order'
    ? 'Sign in (or create a free account) to confirm this delivery.'
    : null;

  const [activeTab, setActiveTab] = useState<'quick' | 'email'>(redirectTo ? 'email' : 'quick');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEmailLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      // Clear any dev session cookie so the real authenticated session is recognized by proxy
      document.cookie = `${DEV_ROLE_COOKIE}=; path=/; max-age=0`;

      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message || 'Invalid email or password.');
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError('Login failed. Please verify your credentials.');
        setLoading(false);
        return;
      }

      // Query user profile from database to determine role & destination
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, approval_status')
        .eq('id', data.user.id)
        .single();

      const userRole = profile?.role;
      let destination = '/';

      if (userRole === 'client') {
        destination = '/client';
      } else if (userRole === 'driver') {
        destination = profile?.approval_status === 'approved' ? '/driver' : '/driver/profile';
      } else if (userRole === 'admin') {
        destination = '/admin';
      }

      const safeRedirect = redirectTo?.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : null;
      router.push(safeRedirect || destination);
      router.refresh();
    } catch {
      setError('An unexpected error occurred during sign in. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-emerald-950/10 bg-white p-6 shadow-xl shadow-emerald-950/5">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1F5F3F] text-xs font-black text-white">
            T
          </span>
          <span className="font-display text-lg font-bold text-[#1F5F3F]">TaniAfrika</span>
          <span className="ml-auto rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-[#1F5F3F] border border-emerald-200">
            Universal Portal
          </span>
        </div>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 font-display">
          Welcome back
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Universal access for clients, drivers, and fleet operators.
        </p>
        {intentNotice && (
          <p className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-[#1F5F3F]">
            {intentNotice}
          </p>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="mb-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-xs font-semibold">
        <button
          type="button"
          onClick={() => {
            setActiveTab('quick');
            setError(null);
          }}
          className={`rounded-lg py-2 transition cursor-pointer ${
            activeTab === 'quick'
              ? 'bg-white text-[#1F5F3F] shadow-sm font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          ⚡ Fast Demo Access
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('email');
            setError(null);
          }}
          className={`rounded-lg py-2 transition cursor-pointer ${
            activeTab === 'email'
              ? 'bg-white text-[#1F5F3F] shadow-sm font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          ✉️ Email & Password
        </button>
      </div>

      {/* TAB 1: Fast One-Click Dev / Staging Access */}
      {activeTab === 'quick' ? (
        <form action={loginAsDevUserFormAction} className="space-y-2.5">
          <p className="mb-2 text-[11px] text-slate-500">
            Select an active persona to enter without typing credentials:
          </p>

          {/* Client / Shipper Card */}
          <button
            name="role"
            value="client"
            type="submit"
            className="w-full flex items-center justify-between rounded-xl border border-slate-200/80 bg-[#f8faf8] p-3 text-left hover:border-emerald-400 hover:bg-emerald-50/60 transition cursor-pointer group"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 text-sm font-bold">
                📦
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-slate-900 group-hover:text-[#1F5F3F] transition">
                    Client (Shipper)
                  </span>
                  <span className="rounded bg-emerald-100/70 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-800">
                    Alice
                  </span>
                </div>
                <span className="block text-xs text-slate-500">
                  Book moves, post cargo & view driver bids
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold text-[#1F5F3F] group-hover:translate-x-0.5 transition">
              /client →
            </span>
          </button>

          {/* Driver Approved Card */}
          <button
            name="role"
            value="approved_driver"
            type="submit"
            className="w-full flex items-center justify-between rounded-xl border border-slate-200/80 bg-[#f8faf8] p-3 text-left hover:border-blue-400 hover:bg-blue-50/60 transition cursor-pointer group"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-800 text-sm font-bold">
                🚚
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition">
                    Driver (Approved)
                  </span>
                  <span className="rounded bg-blue-100/70 px-1.5 py-0.2 text-[10px] font-semibold text-blue-800">
                    John
                  </span>
                </div>
                <span className="block text-xs text-slate-500">
                  Verified vehicle, job feed, place bids & earnings
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold text-[#1F5F3F] group-hover:translate-x-0.5 transition">
              /driver →
            </span>
          </button>

          {/* Driver Pending KYC Card */}
          <button
            name="role"
            value="pending_driver"
            type="submit"
            className="w-full flex items-center justify-between rounded-xl border border-slate-200/80 bg-[#f8faf8] p-3 text-left hover:border-amber-400 hover:bg-amber-50/60 transition cursor-pointer group"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800 text-sm font-bold">
                📋
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-slate-900 group-hover:text-amber-800 transition">
                    Driver (Pending KYC)
                  </span>
                  <span className="rounded bg-amber-100/70 px-1.5 py-0.2 text-[10px] font-semibold text-amber-800">
                    Sam
                  </span>
                </div>
                <span className="block text-xs text-slate-500">
                  Document uploads, vehicle license & onboarding
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold text-[#1F5F3F] group-hover:translate-x-0.5 transition">
              /profile →
            </span>
          </button>

          {/* Admin Dashboard Card */}
          <button
            name="role"
            value="admin"
            type="submit"
            className="w-full flex items-center justify-between rounded-xl border border-slate-200/80 bg-[#f8faf8] p-3 text-left hover:border-emerald-400 hover:bg-emerald-50/60 transition cursor-pointer group"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-800 text-white text-sm font-bold">
                🛡️
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-slate-900 group-hover:text-[#1F5F3F] transition">
                    Admin Operations
                  </span>
                  <span className="rounded bg-emerald-100/70 px-1.5 py-0.2 text-[10px] font-semibold text-[#1F5F3F]">
                    Wilfred
                  </span>
                </div>
                <span className="block text-xs text-slate-500">
                  Fleet verifications, live bids, orders & settlements
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold text-[#1F5F3F] group-hover:translate-x-0.5 transition">
              /admin →
            </span>
          </button>
        </form>
      ) : (
        /* TAB 2: Real Supabase Universal Email & Password Login */
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700">
              Email address
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#1F5F3F] focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              <Link
                href="/reset-password"
                className="text-xs font-medium text-[#1F5F3F] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative mt-1.5">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="min-h-11 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#1F5F3F] focus:ring-4 focus:ring-emerald-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-400 hover:text-slate-700 transition"
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3l18 18M10.6 6.2A9.7 9.7 0 0 1 12 6c6 0 9.5 6 9.5 6a16 16 0 0 1-2.2 2.9M6.1 6.2C3.7 8 2.5 12 2.5 12s3.5 6 9.5 6c1.5 0 2.8-.4 4-.9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
                    <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6Z" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="2.5" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50/80 px-3.5 py-2.5 text-xs text-red-700"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1F5F3F] py-3 text-sm font-semibold text-white shadow-md shadow-emerald-950/10 hover:bg-[#14422B] transition cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Signing in...
              </>
            ) : (
              'Sign In →'
            )}
          </button>
        </form>
      )}

      {/* Footer link to Sign Up */}
      <div className="mt-6 pt-5 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500">
          Don&apos;t have an account?{' '}
          <Link
            href={redirectTo ? `/signup?redirectTo=${encodeURIComponent(redirectTo)}` : '/signup'}
            className="font-semibold text-[#1F5F3F] hover:underline"
          >
            Create an account (Client or Driver)
          </Link>
        </p>
        <p className="mt-2 text-[10px] text-slate-400">
          Unified Account Architecture • Nicholas (Client) & Wilfred (Driver/Admin)
        </p>
      </div>
    </div>
  );
}
