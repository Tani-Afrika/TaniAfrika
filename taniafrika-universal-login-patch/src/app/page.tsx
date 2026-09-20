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
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[1fr_1fr] lg:items-center lg:py-16">
        <div>
          <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-4xl">
            Send anything, anywhere.
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            No account needed to get a quote.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-3">
            <Stat icon="📦" label="Post & compare bids" />
            <Stat icon="🚚" label="Verified drivers" />
            <Stat icon="📍" label="Live tracking" />
          </div>
        </div>

        <GuestQuoteWidget />
      </section>

      {/* Driver CTA */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-8 sm:flex-row sm:items-center sm:px-6">
          <h2 className="font-display text-lg font-bold text-slate-950">
            Drive & earn with TaniAfrika
          </h2>
          <Link
            href="/signup?role=driver"
            className="rounded-xl bg-[#1F5F3F] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#14422B]"
          >
            Become a driver
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-4 py-6 text-center text-xs text-slate-400 sm:px-6">
        TaniAfrika
      </footer>
    </main>
  );
}

function Stat({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-200 bg-white py-4 text-center">
      <span className="text-lg leading-none">{icon}</span>
      <span className="text-[11px] font-medium leading-tight text-slate-600">{label}</span>
    </div>
  );
}
