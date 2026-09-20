import Image from 'next/image';
import { loginAsDevUserFormAction } from '@/lib/actions/dev-auth';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <main className="h-screen w-full overflow-hidden bg-slate-50 lg:grid lg:grid-cols-[1.1fr_0.9fr]">
      {/* Left hero banner */}
      <section className="relative hidden h-full lg:block overflow-hidden">
        <Image
          src="/images/auth/truck-hero.webp"
          alt="TaniAfrika logistics delivery"
          fill
          priority
          sizes="55vw"
          className="object-cover object-center"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#14422b]/90 via-[#1F5F3F]/70 to-[#1F5F3F]/30" />

        <div className="absolute inset-0 flex flex-col justify-center px-12 text-white">
          <span className="rounded-full bg-white/10 backdrop-blur px-3 py-1 w-fit text-[11px] font-semibold tracking-widest uppercase">
            Trusted African Logistics
          </span>

          <h1 className="mt-4 max-w-lg text-4xl font-bold leading-tight font-display">
            Deliver Anywhere.<br />Track Everything.
          </h1>

          <p className="mt-3 max-w-md text-sm text-emerald-50">
            Connecting businesses, verified drivers, and shippers across Africa with secure real-time logistics.
          </p>
        </div>
      </section>

      {/* Right container — 100% Server Component, zero client bundle, no scrolling */}
      <section className="flex h-full w-full items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {/* Header */}
          <div className="mb-5">
            <span className="font-display text-lg font-bold text-[#1F5F3F]">TaniAfrika</span>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 font-display">Fast Dev Access</h2>
            <p className="text-xs text-slate-500">Select a workspace to enter instantly:</p>
          </div>

          {/* Native HTML Form calling Server Action (Pure Server Component) */}
          <form action={loginAsDevUserFormAction} className="space-y-2.5">
            <button
              name="role"
              value="admin"
              type="submit"
              className="w-full flex items-center justify-between rounded-lg border border-slate-200 bg-emerald-50/50 p-3 text-left hover:bg-emerald-100/70 hover:border-emerald-300 transition cursor-pointer"
            >
              <div>
                <span className="block text-sm font-bold text-slate-900">Admin Dashboard</span>
                <span className="block text-xs text-slate-500">Fleet, verifications, orders & payments</span>
              </div>
              <span className="text-xs font-semibold text-[#1F5F3F]">Enter →</span>
            </button>

            <button
              name="role"
              value="approved_driver"
              type="submit"
              className="w-full flex items-center justify-between rounded-lg border border-slate-200 bg-blue-50/50 p-3 text-left hover:bg-blue-100/70 hover:border-blue-300 transition cursor-pointer"
            >
              <div>
                <span className="block text-sm font-bold text-slate-900">Driver (Approved)</span>
                <span className="block text-xs text-slate-500">Verified vehicle, active job feed & bids</span>
              </div>
              <span className="text-xs font-semibold text-[#1F5F3F]">Enter →</span>
            </button>

            <button
              name="role"
              value="pending_driver"
              type="submit"
              className="w-full flex items-center justify-between rounded-lg border border-slate-200 bg-amber-50/50 p-3 text-left hover:bg-amber-100/70 hover:border-amber-300 transition cursor-pointer"
            >
              <div>
                <span className="block text-sm font-bold text-slate-900">Driver (Pending KYC)</span>
                <span className="block text-xs text-slate-500">Document uploads & onboarding profile</span>
              </div>
              <span className="text-xs font-semibold text-[#1F5F3F]">Enter →</span>
            </button>
          </form>

          <p className="mt-5 text-center text-[11px] text-slate-400">
            Wilfred Osozi Dev Scope (Driver & Admin Verticals)
          </p>
        </div>
      </section>
    </main>
  );
}