import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <main className="min-h-screen w-full bg-[#fbfdfa] text-slate-900">
      {/* 1. Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-[#fbfdfa]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1F5F3F] text-sm font-black text-white shadow-md shadow-emerald-950/10">
              T
            </span>
            <span className="font-display text-xl font-bold tracking-tight text-slate-950">
              TaniAfrika
            </span>
          </div>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#shippers" className="transition hover:text-[#1F5F3F]">
              For Shippers
            </a>
            <a href="#drivers" className="transition hover:text-[#1F5F3F]">
              For Drivers
            </a>
            <a href="#how-it-works" className="transition hover:text-[#1F5F3F]">
              How It Works
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-[#1F5F3F] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-950/10 transition hover:bg-[#14422B]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section (No Open Form) */}
      <section className="relative overflow-hidden px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-28">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3.5 py-1 text-xs font-semibold text-[#1F5F3F]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1F5F3F]" />
            Trusted Kenyan Logistics Network
          </div>

          <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight text-slate-950 sm:text-6xl sm:leading-[1.1]">
            Move anything, anywhere across Kenya.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            A reliable two-sided delivery marketplace. Shippers compare transparent driver bids in real time; verified drivers access instant loads and guaranteed payouts.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/signup?role=client"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1F5F3F] px-8 text-sm font-semibold text-white shadow-lg shadow-emerald-950/15 transition hover:bg-[#14422B] sm:w-auto"
            >
              Book a Delivery →
            </Link>
            <Link
              href="/signup?role=driver"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-8 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
            >
              Drive &amp; Earn with Us
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="text-[#1F5F3F]">✓</span> Verified NTSA Drivers
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-[#1F5F3F]">✓</span> M-Pesa Escrow Protection
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-[#1F5F3F]">✓</span> Live GPS Route Tracking
            </span>
          </div>
        </div>
      </section>

      {/* 3. Two-Sided Value Proposition Cards */}
      <section className="border-t border-slate-200/80 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1F5F3F]">
              Two-Sided Marketplace
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Built for businesses, shippers, and drivers
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {/* Shippers Card */}
            <div id="shippers" className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-[#fbfdfa] p-8 shadow-sm transition hover:shadow-md">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">
                  📦
                </div>
                <h3 className="mt-5 font-display text-xl font-bold text-slate-950">
                  For Shippers &amp; Cargo Owners
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Whether moving house, restocking retail goods, or delivering packages, post your job and receive transparent bids from nearby verified drivers.
                </p>

                <ul className="mt-6 space-y-3 text-sm text-slate-600">
                  <li className="flex items-center gap-2.5">
                    <span className="font-bold text-[#1F5F3F]">•</span>
                    Compare driver profiles, ratings, and price bids
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="font-bold text-[#1F5F3F]">•</span>
                    Secure escrow payment released only upon arrival
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="font-bold text-[#1F5F3F]">•</span>
                    Real-time GPS trip tracking and arrival proof
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200">
                <Link
                  href="/signup?role=client"
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1F5F3F] hover:underline"
                >
                  Create a client account →
                </Link>
              </div>
            </div>

            {/* Drivers Card */}
            <div id="drivers" className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-[#fbfdfa] p-8 shadow-sm transition hover:shadow-md">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-2xl">
                  🚚
                </div>
                <h3 className="mt-5 font-display text-xl font-bold text-slate-950">
                  For Verified Drivers &amp; Fleets
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Turn your pickup, van, lorry, or motorcycle into consistent daily revenue. Pick your own routes, bid your price, and earn on your schedule.
                </p>

                <ul className="mt-6 space-y-3 text-sm text-slate-600">
                  <li className="flex items-center gap-2.5">
                    <span className="font-bold text-blue-700">•</span>
                    Direct access to open delivery jobs across Kenya
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="font-bold text-blue-700">•</span>
                    Guaranteed, fast M-Pesa payouts after delivery
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="font-bold text-blue-700">•</span>
                    Build reputation with verified customer ratings
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200">
                <Link
                  href="/signup?role=driver"
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1F5F3F] hover:underline"
                >
                  Apply to drive &amp; deliver →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. How It Works */}
      <section id="how-it-works" className="border-t border-slate-200/80 bg-[#fbfdfa] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1F5F3F]">
              Simple &amp; Reliable
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              How TaniAfrika Works
            </h2>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1F5F3F]/10 font-display text-sm font-bold text-[#1F5F3F]">
                1
              </span>
              <h4 className="mt-4 font-display text-lg font-bold text-slate-950">
                Post your shipment
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Specify pickup, destination, cargo type, and vehicle needed. Your order broadcasts instantly to verified drivers.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1F5F3F]/10 font-display text-sm font-bold text-[#1F5F3F]">
                2
              </span>
              <h4 className="mt-4 font-display text-lg font-bold text-slate-950">
                Compare bids &amp; assign
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Review incoming price offers, driver credentials, and estimated pickup times before accepting the best offer.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1F5F3F]/10 font-display text-sm font-bold text-[#1F5F3F]">
                3
              </span>
              <h4 className="mt-4 font-display text-lg font-bold text-slate-950">
                Track &amp; complete
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Monitor your cargo via live GPS. Funds stay safeguarded in escrow and are released securely upon proof of delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Bottom CTA Banner */}
      <section className="border-t border-slate-200 bg-[#14422B] py-14 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to experience reliable logistics?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-emerald-100/90 sm:text-base">
            Join shippers, verified drivers, and fleet operators delivering across Kenya every day.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/signup"
              className="flex h-11 items-center justify-center rounded-xl bg-white px-8 text-sm font-bold text-[#14422B] shadow-md transition hover:bg-emerald-50"
            >
              Create Free Account
            </Link>
            <Link
              href="/login"
              className="flex h-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-8 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              Sign In to Portal
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="border-t border-slate-200 bg-white px-4 py-8 text-center text-xs text-slate-400 sm:px-6">
        <p>© 2026 TaniAfrika. Reliable Neighbour Logistics Standard • Nairobi, Kenya</p>
      </footer>
    </main>
  );
}
