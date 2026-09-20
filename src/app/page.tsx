import Link from 'next/link';
import { GuestQuoteWidget } from '@/components/marketing/GuestQuoteWidget';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <main className="min-h-screen w-full bg-[#fbfdfa]">
      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-[#fbfdfa]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1F5F3F] text-xs font-black text-white shadow-sm">
              T
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-slate-950">
              TaniAfrika
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:px-4"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-[#1F5F3F] px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-950/10 transition hover:bg-[#14422B] sm:px-4"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero + guest quote widget — anyone can use this without an account. */}
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:py-20">
        <div>
          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-[#1F5F3F]">
            Trusted African Logistics
          </span>

          <h1 className="mt-5 font-display text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl">
            Send anything, anywhere.<br />No account needed to start.
          </h1>

          <p className="mt-4 max-w-lg text-base leading-7 text-slate-600">
            Get an instant delivery estimate below — browse freely, no sign-in required.
            We only ask you to create a free account or log in the moment you&apos;re
            ready to confirm a booking, just like the ride and delivery apps you
            already use.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-slate-200 pt-6 sm:grid-cols-3">
            <Stat label="Cargo Shippers" value="Post moves & compare bids" />
            <Stat label="Verified Drivers" value="Instant loads & fast payouts" />
            <Stat label="Live Tracking" value="Know exactly where it is" />
          </div>

          <div className="mt-10 hidden sm:block">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              How it works
            </p>
            <ol className="mt-3 space-y-3 text-sm text-slate-600">
              <li className="flex gap-3">
                <StepNumber n={1} /> Enter your pickup and drop-off to see an estimate — no account needed.
              </li>
              <li className="flex gap-3">
                <StepNumber n={2} /> Sign up or log in only when you&apos;re ready to confirm the delivery.
              </li>
              <li className="flex gap-3">
                <StepNumber n={3} /> Verified drivers bid on your job; you pick, track, and pay securely.
              </li>
            </ol>
          </div>
        </div>

        <GuestQuoteWidget />
      </section>

      {/* Driver CTA — mirrors Uber/Bolt's separate "drive with us" pitch on the same homepage */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-12 sm:flex-row sm:items-center sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1F5F3F]">
              Drive & deliver
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-slate-950 sm:text-3xl">
              Earn on your own schedule.
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
              Register your vehicle, get verified, and start bidding on delivery
              jobs near you.
            </p>
          </div>
          <Link
            href="/signup?role=driver"
            className="inline-flex items-center gap-2 rounded-xl bg-[#1F5F3F] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-950/10 transition hover:bg-[#14422B]"
          >
            Become a driver →
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-4 py-8 text-center text-xs text-slate-400 sm:px-6">
        Simple. Reliable. Kenyan Logistics Standard.
      </footer>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-[#1F5F3F]">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function StepNumber({ n }: { n: number }) {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1F5F3F]/10 text-[11px] font-bold text-[#1F5F3F]">
      {n}
    </span>
  );
}
