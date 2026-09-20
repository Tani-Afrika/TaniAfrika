import Image from 'next/image';
import { UniversalLoginForm } from '@/components/auth/UniversalLoginForm';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <main className="min-h-screen w-full bg-[#fbfdfa] lg:grid lg:grid-cols-[1.1fr_0.9fr]">
      {/* Left hero banner */}
      <section className="relative hidden min-h-screen lg:block overflow-hidden">
        <Image
          src="/images/auth/truck-hero.webp"
          alt="TaniAfrika logistics delivery"
          fill
          priority
          sizes="55vw"
          className="object-cover object-center"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#14422b]/95 via-[#1F5F3F]/80 to-[#1F5F3F]/40" />

        <div className="absolute inset-0 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#1F5F3F] font-black text-sm shadow-md">
              T
            </span>
            <span className="font-display text-xl font-bold tracking-tight">TaniAfrika</span>
          </div>

          <div className="max-w-lg">
            <span className="rounded-full bg-white/10 backdrop-blur px-3 py-1 w-fit text-[11px] font-semibold tracking-widest uppercase text-emerald-100 border border-white/20">
              Trusted African Logistics
            </span>

            <h1 className="mt-4 text-4xl font-bold leading-tight font-display">
              Deliver Anywhere.<br />Track Everything.
            </h1>

            <p className="mt-3 text-sm text-emerald-100/90 leading-relaxed">
              Universal marketplace connecting clients, verified drivers, and fleet operators across Africa with real-time tracking, transparent bidding, and secure payments.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/15 pt-6">
              <div>
                <p className="text-xs font-medium text-emerald-200">Cargo Shippers</p>
                <p className="text-sm font-semibold text-white">Post moves & compare bids</p>
              </div>
              <div>
                <p className="text-xs font-medium text-emerald-200">Verified Drivers</p>
                <p className="text-sm font-semibold text-white">Instant loads & quick payouts</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-emerald-200/80">
            Simple. Reliable. Kenyan Logistics Standard.
          </p>
        </div>
      </section>

      {/* Right container — Universal Login Interface */}
      <section className="flex min-h-screen w-full items-center justify-center p-4 sm:p-6 sm:py-10">
        <UniversalLoginForm />
      </section>
    </main>
  );
}