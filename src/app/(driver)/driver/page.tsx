import Link from 'next/link';
import { formatCurrency, formatDate, VEHICLE_TYPE_LABELS } from '@/lib/format';
import { getDriverDashboardData } from '@/lib/actions/driver-orders';
import { ActionCard, EmptyState, StatCard } from '@/components/driver/DriverUI';
import { BoxIcon, CheckIcon, GavelIcon, MapPinIcon, RouteIcon, SearchIcon, TruckIcon, WalletIcon } from '@/components/driver/DriverIcons';

export const dynamic = 'force-dynamic';

export default async function DriverDashboardPage() {
  const data = await getDriverDashboardData();

  const isApproved = data.approvalStatus === 'approved';
  const isRejected = data.approvalStatus === 'rejected';

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      {/* Verification Status Alert for Pending / Rejected Drivers */}
      {!isApproved && (
        <div
          className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl p-4 sm:p-5 ${
            isRejected
              ? 'border border-red-200 bg-red-50 text-red-900'
              : 'border border-[#D4A244]/40 bg-[#FFF8F4] text-[#2A2A28]'
          }`}
        >
          <div className="flex items-start gap-3">
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl font-bold text-white ${
                isRejected ? 'bg-red-600' : 'bg-[#D4A244]'
              }`}
            >
              !
            </span>
            <div>
              <h3 className="font-display font-semibold text-sm sm:text-base">
                {isRejected
                  ? 'Application Requires Attention'
                  : 'Account Verification In Progress'}
              </h3>
              <p className="mt-0.5 text-xs sm:text-sm text-[#5F5E5E]">
                {isRejected
                  ? data.rejectionReason || 'Please update your documents on your profile.'
                  : 'Upload your National ID, Driving Licence, and Vehicle details to activate bidding.'}
              </p>
            </div>
          </div>
          <Link
            href="/driver/profile"
            className="inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-xl bg-[#1F5F3F] px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:bg-[#184c32]"
          >
            Complete Profile & Uploads →
          </Link>
        </div>
      )}

      {/* Hero Banner (Reliable Neighbour Trust Green) */}
      <section className="rounded-2xl border border-[#1F5F3F]/15 bg-[#1F5F3F] p-4 text-white shadow-sm sm:rounded-3xl sm:p-6">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D4A244] sm:text-xs">
            Driver Workspace
          </p>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Live Feed
          </span>
        </div>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight sm:text-3xl">
              Ready for your next delivery?
            </h1>
            <p className="mt-1 max-w-xl text-xs text-white/80 sm:text-sm">
              Browse nearby delivery requests, submit bids, and keep customers informed from pickup to delivery.
            </p>
          </div>
          <Link
            href="/driver/orders"
            className="native-press inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-white px-4 text-xs font-bold text-[#1F5F3F] shadow-xs transition hover:bg-slate-50 sm:h-11 sm:px-5 sm:text-sm"
          >
            <SearchIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Find deliveries
          </Link>
        </div>
      </section>

      {/* KPI Stats Grid — 2 columns on mobile, 4 columns on desktop */}
      <section className="grid grid-cols-2 gap-2 sm:gap-3.5 lg:grid-cols-4">
        <StatCard icon={BoxIcon} value={data.availableCount} label="Available" helper="Open for bids" />
        <StatCard icon={GavelIcon} value={data.pendingBidCount} label="Pending Bids" helper="Awaiting client" />
        <StatCard icon={TruckIcon} value={data.activeCount} label="Active" helper="In transit" />
        <StatCard icon={WalletIcon} value={formatCurrency(data.earnings)} label="Earnings" helper={`${data.deliveredCount} delivered`} />
      </section>

      {/* Quick Actions Micro-Grid — 2 columns on mobile, 4 on desktop */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 sm:text-sm">Quick actions</h2>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          <ActionCard icon={SearchIcon} title="Find loads" description="Browse marketplace" href="/driver/orders" />
          <ActionCard icon={GavelIcon} title="My bids" description="Pending offers" href="/driver/bids" />
          <ActionCard icon={MapPinIcon} title="Active trip" description="Current delivery" href="/driver/active" />
          <ActionCard icon={CheckIcon} title="Earnings" description="Income summary" href="/driver/earnings" />
        </div>
      </section>

      {/* Main Content Layout */}
      <section className="grid gap-3.5 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)]">
        {/* Available Opportunities */}
        <article className="native-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-3 sm:px-5 sm:py-4">
            <div>
              <h2 className="text-xs font-bold text-slate-950 sm:text-sm">New opportunities</h2>
              <p className="text-[10px] text-slate-400 sm:text-xs">Recently posted requests ready for bidding.</p>
            </div>
            <Link
              href="/driver/orders"
              className="text-xs font-semibold text-[#1F5F3F] transition hover:underline"
            >
              View all →
            </Link>
          </div>
          {data.availableOrders.length ? (
            <div className="divide-y divide-slate-100">
              {data.availableOrders.slice(0, 4).map((order) => (
                <Link
                  key={order.id}
                  href={`/driver/orders/${order.id}`}
                  className="native-press flex flex-col gap-2 p-3 transition hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between sm:p-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[#1F5F3F]/10 text-[#1F5F3F]">
                        <RouteIcon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-900 sm:text-sm">
                          {order.pickup_address} → {order.dropoff_address}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-slate-500">
                          {order.goods_description}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pl-8 sm:flex-col sm:items-end sm:pl-0">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-[#1F5F3F]">
                      {order.vehicle_type_required ? VEHICLE_TYPE_LABELS[order.vehicle_type_required] : 'Any vehicle'}
                    </span>
                    <span className="text-[10px] text-slate-400 sm:mt-1">
                      {formatDate(order.created_at)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-4">
              <EmptyState
                icon={SearchIcon}
                title="No open orders right now"
                description={
                  !isApproved
                    ? "Complete your verification on your profile to unlock live customer requests."
                    : "New customer requests will appear here as soon as they are posted."
                }
              />
            </div>
          )}
        </article>

        {/* Active Delivery Card */}
        <article className="native-card p-3.5 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-950 sm:text-sm">Active delivery</h2>
              <p className="text-[10px] text-slate-400 sm:text-xs">Your currently assigned job.</p>
            </div>
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[#1F5F3F]/10 text-[#1F5F3F] sm:h-8 sm:w-8">
              <TruckIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          {data.activeOrder ? (
            <div className="mt-3">
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 sm:p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#1F5F3F]">
                  #{data.activeOrder.id.slice(0, 8).toUpperCase()}
                </p>
                <div className="mt-2.5 space-y-1.5">
                  <div className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">Pickup</p>
                      <p className="truncate text-xs font-semibold text-slate-800">{data.activeOrder.pickup_address}</p>
                    </div>
                  </div>
                  <div className="ml-[2.5px] h-3 border-l border-dashed border-slate-300" />
                  <div className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D4A244]" />
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">Drop-off</p>
                      <p className="truncate text-xs font-semibold text-slate-800">{data.activeOrder.dropoff_address}</p>
                    </div>
                  </div>
                </div>
              </div>
              <Link
                href={`/driver/orders/${data.activeOrder.id}`}
                className="native-press mt-3 flex h-10 items-center justify-center rounded-xl bg-[#1F5F3F] text-xs font-bold text-white shadow-xs transition hover:bg-[#164E33]"
              >
                Open delivery controller →
              </Link>
            </div>
          ) : (
            <div className="mt-3">
              <EmptyState
                icon={TruckIcon}
                title="No active delivery"
                description="When a customer accepts your bid, trip details will appear here."
                href="/driver/orders"
                actionLabel="Browse deliveries"
              />
            </div>
          )}
        </article>
      </section>
    </div>
  );
}