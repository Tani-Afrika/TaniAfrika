'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { createClient } from '@/lib/supabase/client';
import { AuthIllustration } from '@/components/auth/AuthIllustration';

export const dynamic = 'force-dynamic';

type SignupRole = 'client' | 'driver';

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupPageInner />
    </Suspense>
  );
}

function SignupPageInner() {
  const router = useRouter();
  const supabase = createClient();
  const searchParams = useSearchParams();

  // Carried over from the public guest quote widget or the driver CTA on
  // the homepage — preselects the role and, after account creation, sends
  // the person straight back to finish the transaction they started as a
  // guest (e.g. confirming the delivery they already quoted).
  const requestedRole = searchParams.get('role') === 'driver' ? 'driver' : 'client';
  const redirectTo = searchParams.get('redirectTo');
  const intentNotice = searchParams.get('intent') === 'order'
    ? 'Create an account to confirm this delivery.'
    : null;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<SignupRole>(requestedRole);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setNotice(null);

    if (!fullName.trim()) {
      setError('Enter your full name.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role,
          },
        },
      });

      if (signupError) {
        setError(signupError.message);
        return;
      }

      if (!data.user) {
        setError('Account creation failed. Try again.');
        return;
      }

      if (!data.session) {
        setNotice('Check your email to confirm your account.');
        setFullName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        return;
      }

      const safeRedirect = redirectTo?.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : null;
      router.push(safeRedirect || (role === 'client' ? '/client' : '/driver/profile'));
      router.refresh();
    } catch {
      setError('Unable to create your account. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClassName =
    'min-h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1F5F3F] focus:ring-4 focus:ring-emerald-100';

  return (
    <main className="min-h-screen w-full bg-[#fbfdfa] sm:grid sm:place-items-center sm:p-6">
      <div className="relative flex min-h-screen w-full flex-col overflow-hidden sm:min-h-0 sm:max-w-sm sm:rounded-[28px] sm:shadow-xl sm:shadow-emerald-950/10">
        <div className="relative h-[24vh] min-h-[140px] w-full shrink-0 sm:h-32">
          <AuthIllustration className="h-full w-full" />
          <span className="absolute left-5 top-5 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-xs font-black text-[#1F5F3F] shadow-sm">
            T
          </span>
        </div>

        <div className="relative -mt-6 flex-1 rounded-t-[28px] bg-white px-5 pb-8 pt-6 sm:mt-0 sm:rounded-none sm:px-6 sm:pb-7">
          <h1 className="font-display text-xl font-bold text-slate-950">Create account</h1>

          {intentNotice ? (
            <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-[#1F5F3F]">
              {intentNotice}
            </p>
          ) : null}

          <form onSubmit={handleSignup} className="mt-5 space-y-3.5">
            <div className="grid grid-cols-2 gap-2.5">
              <RoleOption active={role === 'client'} label="Send parcels" onClick={() => setRole('client')} />
              <RoleOption active={role === 'driver'} label="Drive & deliver" onClick={() => setRole('driver')} />
            </div>

            <input
              type="text"
              required
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Full name"
              className={inputClassName}
            />

            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              className={inputClassName}
            />

            <PasswordInput
              value={password}
              visible={showPassword}
              onChange={setPassword}
              onToggle={() => setShowPassword((current) => !current)}
              placeholder="Password"
            />

            <PasswordInput
              value={confirmPassword}
              visible={showConfirmation}
              onChange={setConfirmPassword}
              onToggle={() => setShowConfirmation((current) => !current)}
              placeholder="Confirm password"
            />

            {error ? (
              <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </p>
            ) : null}

            {notice ? (
              <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-[#1F5F3F]">
                {notice}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1F5F3F] text-sm font-semibold text-white transition hover:bg-[#14422B] disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link
              href={redirectTo ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : '/login'}
              className="font-semibold text-[#1F5F3F]"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

function RoleOption({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-3 text-center text-xs font-semibold transition cursor-pointer ${
        active
          ? 'border-[#1F5F3F] bg-emerald-50/60 text-[#1F5F3F] ring-4 ring-emerald-100'
          : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-200'
      }`}
    >
      {label}
    </button>
  );
}

function PasswordInput({
  value,
  visible,
  onChange,
  onToggle,
  placeholder,
}: {
  value: string;
  visible: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        required
        minLength={8}
        autoComplete="new-password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-11 w-full rounded-xl border border-slate-200 px-3.5 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1F5F3F] focus:ring-4 focus:ring-emerald-100"
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-0 grid w-10 place-items-center text-slate-400 hover:text-slate-700"
      >
        {visible ? (
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
  );
}
