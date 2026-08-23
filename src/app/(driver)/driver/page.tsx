import Link from 'next/link';
import { formatCurrency, formatDate, VEHICLE_TYPE_LABELS } from '@/lib/format';
import { getDriverDashboardData } from '@/lib/actions/driver-orders';
import { ActionCard, EmptyState, StatCard } from '@/components/driver/DriverUI';
import { BoxIcon, CheckIcon, GavelIcon, MapPinIcon, RouteIcon, SearchIcon, TruckIcon, WalletIcon } from '@/components/driver/DriverIcons';

export const dynamic = 'force-dynamic';

export default async function DriverDashboardPage() {
  const data = await getDriverDashboardData();

  return (
    <div className="mx-auto max-w-[1500px]">
      <section className="mb-5 rounded-3xl border border-orange-100 bg-gradient-to-r from-orange-500 to-orange-400 p-5 text-white shadow-xl shadow-orange-200/40 sm:p-7">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/80">Driver workspace</p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Ready for your next delivery?</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85">Browse nearby parcel requests, submit a competitive bid, and keep customers informed from pickup to delivery.</p>
          </div>
          <Link
            href="/driver/orders"
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-orange-600 shadow-lg transition hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <SearchIcon className="h-5 w-5" /> Find deliveries
          </Link>
        </div>
      </section>

      <section className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        <StatCard icon={BoxIcon} value={data.availableCount} label="Available orders" helper="Open for bids" />
        <StatCard icon={GavelIcon} value={data.pendingBidCount} label="Pending bids" helper="Awaiting customer response" />
        <StatCard icon={TruckIcon} value={data.activeCount} label="Active delivery" helper="Currently assigned" />
        <StatCard icon={WalletIcon} value={formatCurrency(data.earnings)} label="Total earnings" helper={`${data.deliveredCount} completed deliveries`} />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(380px,.95fr)]">
        <article className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-orange-100 px-5 py-4">
            <div>
              <h2 className="text-base font-bold text-slate-950">New delivery opportunities</h2>
              <p className="mt-0.5 text-xs text-slate-400">Recently posted orders available for bidding.</p>
            </div>
            <Link
              href="/driver/orders"
              className="rounded-md text-sm font-semibold text-orange-600 transition hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
            >
              View all
            </Link>
          </div>
          {data.availableOrders.length ? (
            <div className="divide-y divide-orange-100">
              {data.availableOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/driver/orders/${order.id}`}
                  className="grid gap-3 px-5 py-4 transition hover:bg-orange-50/40 focus-visible:bg-orange-50/60 focus-visible:outline-none sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-orange-50 text-orange-600">
                        <RouteIcon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950">{order.pickup_address} → {order.dropoff_address}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-400">{order.goods_description}</p>
                      </div>
                    </div>
                  </div>
                  <div className="pl-11 text-left sm:pl-0 sm:text-right">
                    <p className="text-xs font-semibold text-orange-600">{order.vehicle_type_required ? VEHICLE_TYPE_LABELS[order.vehicle_type_required] : 'Any vehicle'}</p>
                    <p className="mt-1 text-xs text-slate-400">{formatDate(order.created_at)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : <div className="p-5"><EmptyState icon={SearchIcon} title="No open orders right now" description="New customer requests will appear here as soon as they are posted." /></div>}
        </article>

        <article className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-950">Active delivery</h2>
              <p className="mt-0.5 text-xs text-slate-400">Your currently assigned parcel.</p>
            </div>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-orange-50 text-orange-600"><TruckIcon className="h-4 w-4" /></span>
          </div>
          {data.activeOrder ? (
            <div className="mt-4">
              <div className="rounded-2xl bg-orange-50/60 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-orange-600">#{data.activeOrder.id.slice(0, 8).toUpperCase()}</p>
                <div className="mt-3.5 space-y-2 pt-0.5">
                  <div className="flex gap-2.5">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.06em] text-slate-400">Pickup</p>
                      <p className="truncate text-sm font-semibold text-slate-800">{data.activeOrder.pickup_address}</p>
                    </div>
                  </div>
                  <div className="ml-[3px] h-4 border-l border-dashed border-orange-300" />
                  <div className="flex gap-2.5">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-orange-500" />
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.06em] text-slate-400">Drop-off</p>
                      <p className="truncate text-sm font-semibold text-slate-800">{data.activeOrder.dropoff_address}</p>
                    </div>
                  </div>
                </div>
              </div>
              <Link
                href={`/driver/orders/${data.activeOrder.id}`}
                className="mt-4 flex min-h-12 items-center justify-center rounded-xl bg-orange-600 text-sm font-semibold text-white transition hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
              >
                Open delivery
              </Link>
            </div>
          ) : (
            <div className="mt-4"><EmptyState icon={TruckIcon} title="No active delivery" description="An accepted bid will appear here with customer and delivery details." href="/driver/orders" actionLabel="Browse deliveries" /></div>
          )}
        </article>
      </section>

      <section className="mt-5 rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-bold text-slate-950">Quick actions</h2>
        <div className="mt-3.5 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(230px,1fr))]">
          <ActionCard icon={SearchIcon} title="Find deliveries" description="Browse open delivery requests and place bids." href="/driver/orders" />
          <ActionCard icon={GavelIcon} title="Review your bids" description="Track pending, accepted and past bids." href="/driver/bids" />
          <ActionCard icon={MapPinIcon} title="Active delivery" description="Update parcel status and share your location." href="/driver/active" />
          <ActionCard icon={CheckIcon} title="View earnings" description="Review completed deliveries and income." href="/driver/earnings" />
        </div>
      </section>
    </div>
  );
}