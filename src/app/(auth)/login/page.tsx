'use client';

import Link from 'next/link';
import { FormEvent, Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(
    searchParams.get('passwordUpdated') === 'true'
      ? 'Your password was updated successfully. You can now log in.'
      : null,
  );
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();
  const isBusy = isLoggingIn || isSendingReset;

  function clearMessages() {
    setError(null);
    setNotice(null);
  }

  function validateEmail() {
    if (!normalizedEmail) {
      setError('Enter your email address.');
      return false;
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setError('Enter a valid email address.');
      return false;
    }

    return true;
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    if (!validateEmail()) return;

    if (!password) {
      setError('Enter your password.');
      return;
    }

    setIsLoggingIn(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (signInError) {
        setError(
          signInError.message === 'Invalid login credentials'
            ? 'The email or password you entered is incorrect.'
            : signInError.message,
        );
        return;
      }

      router.replace('/');
      router.refresh();
    } catch {
      setError('We could not log you in. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleForgotPassword() {
    clearMessages();

    if (!validateEmail()) return;

    setIsSendingReset(true);

    try {
      const callbackUrl = new URL('/auth/callback', window.location.origin);
      callbackUrl.searchParams.set('next', '/reset-password');

      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo: callbackUrl.toString(),
        });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setNotice(
        'Reset link sent. Check your inbox and spam folder, then open the link to create a new password.',
      );
    } catch {
      setError('We could not send the reset email. Please try again.');
    } finally {
      setIsSendingReset(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fffaf7] lg:grid lg:grid-cols-[1.12fr_0.88fr]">
      <section className="relative hidden lg:block overflow-hidden">
        <Image
          src="/images/auth/truck-hero.webp"
          alt="TaniAfrika delivery truck on an African highway"
          fill
          priority
          sizes="55vw"
          className="object-cover object-center"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#6f1717]/80 via-[#8b2424]/55 to-[#8b2424]/10" />

        <div className="absolute inset-0 flex flex-col justify-center px-14 text-white">
          <span className="rounded-full bg-white/10 backdrop-blur px-4 py-2 w-fit text-xs font-semibold tracking-widest uppercase">
            Trusted African Logistics
          </span>

          <h1 className="mt-6 max-w-xl text-5xl font-bold leading-tight">
            Deliver Anywhere.
            <br />
            Track Everything.
          </h1>

          <p className="mt-5 max-w-lg text-lg text-orange-50">
            Connecting businesses, drivers and customers across Africa
            through secure, affordable and real-time logistics.
          </p>
        </div>
      </section>

      <section className="relative flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
        <div aria-hidden="true" className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-orange-100/70 blur-3xl lg:hidden" />

        <div className="relative z-10 w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Brand />
          </div>

          <div className="rounded-3xl border border-orange-100/80 bg-white p-6 shadow-[0_24px_80px_rgba(124,45,18,0.10)] sm:p-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">Welcome back</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Log in to your account</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Enter your account details to continue to TaniAfrika.</p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleLogin} noValidate>
              <div>
                <label htmlFor="email" className="text-sm font-semibold text-slate-800">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  disabled={isBusy}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  aria-describedby={error ? 'login-message' : undefined}
                  className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 hover:border-orange-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-4">
                  <label htmlFor="password" className="text-sm font-semibold text-slate-800">Password</label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={isBusy}
                    className="text-xs font-semibold text-orange-600 transition hover:text-orange-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSendingReset ? 'Sending reset link...' : 'Forgot password?'}
                  </button>
                </div>

                <div className="relative mt-2">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    disabled={isBusy}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 hover:border-orange-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    disabled={isBusy}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-400 transition hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {error ? (
                <div id="login-message" role="alert" className="flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                  <AlertIcon />
                  <span>{error}</span>
                </div>
              ) : null}

              {notice ? (
                <div id="login-message" role="status" aria-live="polite" className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">
                  <CheckIcon />
                  <span>{notice}</span>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isBusy}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(234,88,12,0.24)] transition hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoggingIn ? (
                  <><LoadingSpinner />Logging in...</>
                ) : (
                  <>Log in<ArrowRightIcon /></>
                )}
              </button>
            </form>

            <div className="my-7 flex items-center gap-4">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-medium text-slate-400">New to TaniAfrika?</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <Link
              href="/signup"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-orange-200 bg-orange-50 px-5 py-3 text-sm font-semibold text-orange-700 transition hover:border-orange-300 hover:bg-orange-100 focus:outline-none focus:ring-4 focus:ring-orange-100"
            >
              Create an account
            </Link>
          </div>

          <p className="mt-6 text-center text-xs leading-5 text-slate-400">
            By continuing, you agree to TaniAfrika&apos;s terms and privacy policy.
          </p>
        </div>
      </section>
    </main>
  );
}

function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" prefetch={false} aria-label="TaniAfrika home" className="relative z-10 inline-flex items-center gap-3">
      <span className={`grid h-11 w-11 place-items-center rounded-xl text-lg font-black shadow-lg ${light ? 'bg-white text-orange-600' : 'bg-gradient-to-br from-orange-500 to-orange-600 text-white'}`}>
        T
      </span>
      <span>
        <span className={`block text-xl font-bold tracking-tight ${light ? 'text-white' : 'text-slate-950'}`}>
          Tani<span className={light ? 'text-orange-100' : 'text-orange-600'}>Afrika</span>
        </span>
        <span className={`block text-[9px] font-semibold uppercase tracking-[0.2em] ${light ? 'text-orange-100' : 'text-slate-400'}`}>
          Delivering what matters
        </span>
      </span>
    </Link>
  );
}

function FeatureStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
      <p className="text-lg font-bold">{value}</p>
      <p className="mt-1 text-xs leading-5 text-orange-100">{label}</p>
    </div>
  );
}

function LoadingSpinner() {
  return <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />;
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3 3l18 18" strokeLinecap="round" />
      <path d="M10.6 6.2A9.7 9.7 0 0 1 12 6c6 0 9.5 6 9.5 6a16 16 0 0 1-2.2 2.9M6.1 6.2C3.7 8 2.5 12 2.5 12s3.5 6 9.5 6c1.5 0 2.8-.4 4-.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="mt-0.5 h-5 w-5 shrink-0" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6" strokeLinecap="round" />
      <path d="M12 17h.01" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="mt-0.5 h-5 w-5 shrink-0" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}