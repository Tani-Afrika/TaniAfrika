'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { createClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

type SignupRole = 'client' | 'driver';

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<SignupRole>('client');

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
      setError('Your password must contain at least 8 characters.');
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
        setError('Account creation failed. Please try again.');
        return;
      }

      if (!data.session) {
        setNotice(
          'Account created. Check your email to confirm your account before logging in.'
        );

        setFullName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        return;
      }

      // If user session is active, route based on role
      router.push(role === 'client' ? '/client' : '/driver/profile');
      router.refresh();
    } catch {
      setError('Unable to create your account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative grid min-h-screen overflow-hidden bg-[#fbfdfa] lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#14422B] via-[#1F5F3F] to-[#1F5F3F] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border-[48px] border-white/10" />
        <div className="absolute -bottom-40 -left-28 h-96 w-96 rounded-full bg-white/10 blur-2xl" />

        <Brand light />

        <div className="relative z-10 max-w-lg">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-200">
            Join TaniAfrika
          </p>

          <h1 className="mt-5 text-5xl font-bold leading-tight tracking-tight font-display">
            Deliver or send parcels with one trusted platform.
          </h1>

          <p className="mt-6 max-w-md text-base leading-7 text-emerald-100/90">
            Create a client account to book moves and send cargo, or register as a driver to bid on delivery jobs.
          </p>
        </div>

        <p className="relative z-10 text-sm text-emerald-200/80">
          Simple. Reliable. African.
        </p>
      </section>

      <section className="relative flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-lg">
          <div className="mb-8 lg:hidden">
            <Brand />
          </div>

          <div className="rounded-[28px] border border-emerald-950/10 bg-white p-6 shadow-xl shadow-emerald-950/5 sm:p-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1F5F3F]">
                Get started
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 font-display">
                Create your account
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Select your account role to continue:
              </p>
            </div>

            <form onSubmit={handleSignup} className="mt-8 space-y-5">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  I want to
                </p>

                <div className="mt-2 grid grid-cols-2 gap-3">
                  <RoleOption
                    active={role === 'client'}
                    title="Send parcels"
                    description="Create and track deliveries"
                    onClick={() => setRole('client')}
                  />

                  <RoleOption
                    active={role === 'driver'}
                    title="Drive & deliver"
                    description="Bid for delivery jobs"
                    onClick={() => setRole('driver')}
                  />
                </div>
              </div>

              <label htmlFor="full-name" className="block">
                <span className="text-sm font-semibold text-slate-800">
                  Full name
                </span>

                <input
                  id="full-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Jane Wanjiru"
                  className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#1F5F3F] focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              <label htmlFor="signup-email" className="block">
                <span className="text-sm font-semibold text-slate-800">
                  Email address
                </span>

                <input
                  id="signup-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#1F5F3F] focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              <PasswordInput
                id="signup-password"
                label="Password"
                value={password}
                visible={showPassword}
                onChange={setPassword}
                onToggle={() => setShowPassword((current) => !current)}
              />

              <PasswordInput
                id="confirm-password"
                label="Confirm password"
                value={confirmPassword}
                visible={showConfirmation}
                onChange={setConfirmPassword}
                onToggle={() => setShowConfirmation((current) => !current)}
              />

              {error ? (
                <p
                  role="alert"
                  className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </p>
              ) : null}

              {notice ? (
                <p
                  role="status"
                  className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-[#1F5F3F]"
                >
                  {notice}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1F5F3F] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-950/10 transition hover:bg-[#14422B] focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRightIcon />
                  </>
                )}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-semibold text-[#1F5F3F] hover:underline"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

interface RoleOptionProps {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}

function RoleOption({
  active,
  title,
  description,
  onClick,
}: RoleOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition cursor-pointer ${
        active
          ? 'border-[#1F5F3F] bg-emerald-50/60 ring-4 ring-emerald-100'
          : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/20'
      }`}
    >
      <span
        className={`block text-sm font-semibold ${
          active ? 'text-[#1F5F3F]' : 'text-slate-800'
        }`}
      >
        {title}
      </span>

      <span className="mt-1 block text-xs leading-5 text-slate-500">
        {description}
      </span>
    </button>
  );
}

interface PasswordInputProps {
  id: string;
  label: string;
  value: string;
  visible: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
}

function PasswordInput({
  id,
  label,
  value,
  visible,
  onChange,
  onToggle,
}: PasswordInputProps) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-sm font-semibold text-slate-800">
        {label}
      </span>

      <div className="relative mt-2">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          required
          minLength={8}
          autoComplete="new-password"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="At least 8 characters"
          className="min-h-12 w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#1F5F3F] focus:ring-4 focus:ring-emerald-100"
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

function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="relative z-10 flex items-center gap-3">
      <span
        className={`grid h-11 w-11 place-items-center rounded-xl text-lg font-black shadow-lg ${
          light
            ? 'bg-white text-[#1F5F3F]'
            : 'bg-[#1F5F3F] text-white'
        }`}
      >
        T
      </span>

      <span>
        <span
          className={`block text-xl font-bold tracking-tight ${
            light ? 'text-white' : 'text-slate-950'
          }`}
        >
          TaniAfrika
        </span>

        <span
          className={`block text-[9px] font-semibold uppercase tracking-[0.2em] ${
            light ? 'text-emerald-100' : 'text-slate-400'
          }`}
        >
          Delivering what matters
        </span>
      </span>
    </Link>
  );
}

function LoadingSpinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
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