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

const QUICK_ROLES = [
  { value: 'client', label: 'Client', icon: '📦' },
  { value: 'approved_driver', label: 'Driver', icon: '🚚' },
  { value: 'pending_driver', label: 'New driver', icon: '📋' },
  { value: 'admin', label: 'Admin', icon: '🛡️' },
] as const;

function UniversalLoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Where to send the user after a successful sign-in — set by any page that
  // sent a guest here mid-transaction (e.g. "Book this delivery" from the
  // public quote widget on the homepage). Falls back to the role's home.
  const redirectTo = searchParams.get('redirectTo');
  const intentNotice = searchParams.get('intent') === 'order'
    ? 'Sign in to confirm this delivery.'
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
      setError('Enter both email and password.');
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
        setError('Login failed. Check your details and try again.');
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
      setError('Something went wrong. Try again.');
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-xs mx-auto sm:max-w-none">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-slate-950">Log in</h1>

        {/* Segmented control */}
        <div className="flex rounded-full bg-slate-100 p-0.5 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('quick');
              setError(null);
            }}
            className={`rounded-full px-3 py-1.5 transition cursor-pointer ${
              activeTab === 'quick' ? 'bg-white text-[#1F5F3F] shadow-sm' : 'text-slate-500'
            }`}
          >
            Demo
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('email');
              setError(null);
            }}
            className={`rounded-full px-3 py-1.5 transition cursor-pointer ${
              activeTab === 'email' ? 'bg-white text-[#1F5F3F] shadow-sm' : 'text-slate-500'
            }`}
          >
            Email
          </button>
        </div>
      </div>

      {intentNotice && (
        <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-[#1F5F3F]">
          {intentNotice}
        </p>
      )}

      {activeTab === 'quick' ? (
        <form action={loginAsDevUserFormAction} className="mt-5 grid grid-cols-2 gap-2.5">
          {QUICK_ROLES.map((role) => (
            <button
              key={role.value}
              name="role"
              value={role.value}
              type="submit"
              className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 py-4 transition hover:border-[#1F5F3F]/40 hover:bg-emerald-50/60 cursor-pointer"
            >
              <span className="text-xl leading-none">{role.icon}</span>
              <span className="text-xs font-semibold text-slate-800">{role.label}</span>
            </button>
          ))}
        </form>
      ) : (
        <form onSubmit={handleEmailLogin} className="mt-5 space-y-3.5">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="min-h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1F5F3F] focus:ring-4 focus:ring-emerald-100"
          />

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="min-h-11 w-full rounded-xl border border-slate-200 px-3.5 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1F5F3F] focus:ring-4 focus:ring-emerald-100"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 grid w-10 place-items-center text-slate-400 hover:text-slate-700"
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

          <div className="flex justify-end">
            <Link href="/reset-password" className="text-xs font-medium text-[#1F5F3F]">
              Forgot password?
            </Link>
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1F5F3F] text-sm font-semibold text-white transition hover:bg-[#14422B] disabled:opacity-60 cursor-pointer"
          >
            {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : 'Sign in'}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-xs text-slate-500">
        New here?{' '}
        <Link
          href={redirectTo ? `/signup?redirectTo=${encodeURIComponent(redirectTo)}` : '/signup'}
          className="font-semibold text-[#1F5F3F]"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
