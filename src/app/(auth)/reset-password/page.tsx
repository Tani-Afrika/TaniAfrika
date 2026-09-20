'use client';

import {
  FormEvent,
  Suspense,
  useEffect,
  useState,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { createClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

const MINIMUM_PASSWORD_LENGTH = 8;

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPageInner />
    </Suspense>
  );
}

function ResetPasswordPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [checkingSession, setCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState(
    searchParams.get('error') === 'invalid_recovery_link'
      ? 'This password reset link is invalid or has expired.'
      : '',
  );

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    async function checkRecoverySession() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        setErrorMessage(error.message);
        setCheckingSession(false);
        return;
      }

      setHasRecoverySession(Boolean(session));
      setCheckingSession(false);
    }

    void checkRecoverySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (
        event === 'PASSWORD_RECOVERY' ||
        event === 'SIGNED_IN'
      ) {
        setHasRecoverySession(Boolean(session));
        setCheckingSession(false);
      }

      if (event === 'SIGNED_OUT') {
        setHasRecoverySession(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setErrorMessage('');

    if (password.length < MINIMUM_PASSWORD_LENGTH) {
      setErrorMessage(
        `Password must contain at least ${MINIMUM_PASSWORD_LENGTH} characters.`,
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setHasRecoverySession(false);
        setErrorMessage(
          'Your password reset session has expired. Request a new reset link.',
        );
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      // End the temporary recovery session.
      await supabase.auth.signOut();

      router.replace('/login?passwordUpdated=true');
      router.refresh();
    } catch {
      setErrorMessage(
        'The password could not be updated. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#fbfdfa] px-4">
        <BackgroundDecoration />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl border border-emerald-950/10 bg-white shadow-xl shadow-emerald-950/5">
            <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-emerald-100 border-t-[#1F5F3F]" />
          </div>

          <p className="mt-4 font-semibold text-slate-900">
            Verifying your reset link
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Please wait for a moment.
          </p>
        </div>
      </main>
    );
  }

  if (!hasRecoverySession) {
    return (
      <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#fbfdfa] px-4 py-10">
        <BackgroundDecoration />

        <section className="relative z-10 w-full max-w-md rounded-[28px] border border-emerald-950/10 bg-white p-6 text-center shadow-xl shadow-emerald-950/5 sm:p-8">
          <Brand />

          <div className="mx-auto mt-8 grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-red-500">
            <BrokenLinkIcon />
          </div>

          <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-950 font-display">
            Reset link unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            This password reset link may have expired, already
            been used, or failed to create a recovery session.
          </p>

          {errorMessage ? (
            <p
              role="alert"
              className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {errorMessage}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() =>
              router.replace('/login?requestReset=true')
            }
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#1F5F3F] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-950/10 transition hover:bg-[#14422B] focus:outline-none focus:ring-4 focus:ring-emerald-100 cursor-pointer"
          >
            Request another reset link
          </button>

          <button
            type="button"
            onClick={() => router.replace('/login')}
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center text-sm font-semibold text-slate-500 transition hover:text-[#1F5F3F] cursor-pointer"
          >
            Return to login
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#fbfdfa] px-4 py-10">
      <BackgroundDecoration />

      <section className="relative z-10 w-full max-w-md overflow-hidden rounded-[28px] border border-emerald-950/10 bg-white shadow-xl shadow-emerald-950/5">
        <header className="border-b border-slate-100 bg-gradient-to-br from-emerald-50/50 via-white to-emerald-50/30 px-6 py-7 sm:px-8">
          <Brand />

          <div className="mt-8 flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#1F5F3F] text-white shadow-md shadow-emerald-950/10">
              <LockIcon />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1F5F3F]">
                Account security
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 font-display">
                Create a new password
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Enter and confirm the new password for your
                TaniAfrika account.
              </p>
            </div>
          </div>
        </header>

        <form
          className="space-y-5 p-6 sm:p-8"
          onSubmit={handleSubmit}
        >
          <PasswordField
            id="new-password"
            label="New password"
            value={password}
            visible={showPassword}
            onChange={setPassword}
            onToggle={() =>
              setShowPassword((current) => !current)
            }
          />

          <PasswordField
            id="confirm-password"
            label="Confirm new password"
            value={confirmPassword}
            visible={showConfirmation}
            onChange={setConfirmPassword}
            onToggle={() =>
              setShowConfirmation((current) => !current)
            }
          />

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-[#1F5F3F]">
                <ShieldIcon />
              </span>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Use at least 8 characters
                </p>

                <p className="mt-0.5 text-xs leading-5 text-slate-500">
                  Use a combination of letters, numbers, and
                  symbols for better security.
                </p>
              </div>
            </div>
          </div>

          {errorMessage ? (
            <p
              role="alert"
              className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={
              loading ||
              password.length < MINIMUM_PASSWORD_LENGTH ||
              confirmPassword.length <
                MINIMUM_PASSWORD_LENGTH
            }
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1F5F3F] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-950/10 transition hover:bg-[#14422B] focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Updating password...
              </>
            ) : (
              <>
                Update password
                <ArrowRightIcon />
              </>
            )}
          </button>
        </form>
      </section>
    </main>
  );
}

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  visible: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
}

function PasswordField({
  id,
  label,
  value,
  visible,
  onChange,
  onToggle,
}: PasswordFieldProps) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-sm font-semibold text-slate-800">
        {label}
      </span>

      <div className="relative mt-2">
        <input
          id={id}
          required
          minLength={MINIMUM_PASSWORD_LENGTH}
          type={visible ? 'text' : 'password'}
          value={value}
          autoComplete="new-password"
          onChange={(event) => onChange(event.target.value)}
          placeholder="Enter your new password"
          className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#1F5F3F] focus:ring-4 focus:ring-emerald-100"
        />

        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-400 transition hover:text-slate-700"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </label>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#1F5F3F] text-lg font-black text-white shadow-md">
        T
      </div>

      <div className="text-left">
        <p className="text-xl font-bold tracking-tight text-slate-950 font-display">
          TaniAfrika
        </p>

        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
          Delivering what matters
        </p>
      </div>
    </div>
  );
}

function BackgroundDecoration() {
  return (
    <>
      <div className="pointer-events-none absolute -left-28 -top-28 h-72 w-72 rounded-full bg-emerald-100/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-36 -right-24 h-80 w-80 rounded-full bg-emerald-50/50 blur-3xl" />
    </>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      stroke="currentColor"
      strokeWidth="1.9"
      aria-hidden="true"
    >
      <path d="M7 10V7a5 5 0 0 1 10 0v3" />
      <rect x="4" y="10" width="16" height="11" rx="3" />
      <path d="M12 14v3" strokeLinecap="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path
        d="M12 3 5 6v5c0 4.6 2.9 8.6 7 10 4.1-1.4 7-5.4 7-10V6l-7-3Z"
        strokeLinejoin="round"
      />
      <path
        d="m9.5 12 1.7 1.7 3.6-4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6Z"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M3 3l18 18" strokeLinecap="round" />
      <path
        d="M10.6 6.2A9.7 9.7 0 0 1 12 6c6 0 9.5 6 9.5 6a16 16 0 0 1-2.2 2.9M6.1 6.2C3.7 8 2.5 12 2.5 12s3.5 6 9.5 6c1.5 0 2.8-.4 4-.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path
        d="M5 12h14M13 6l6 6-6 6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BrokenLinkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-7 w-7"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path
        d="m9.5 14.5-1 1a4 4 0 0 1-5.7-5.7l3-3a4 4 0 0 1 5.7 0"
        strokeLinecap="round"
      />
      <path
        d="m14.5 9.5 1-1a4 4 0 0 1 5.7 5.7l-3 3a4 4 0 0 1-5.7 0"
        strokeLinecap="round"
      />
      <path d="M4 4l16 16" strokeLinecap="round" />
    </svg>
  );
}