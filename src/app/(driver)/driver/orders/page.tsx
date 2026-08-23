import Link from 'next/link';
import { formatDate, VEHICLE_TYPE_LABELS } from '@/lib/format';
import { getAvailableOrders } from '@/lib/actions/driver-orders';
import { EmptyState, PageHeading } from '@/components/driver/DriverUI';
import { RouteIcon, SearchIcon, TruckIcon } from '@/components/driver/DriverIcons';

export const dynamic = 'force-dynamic';

export default async function AvailableOrdersPage() {
  const orders = await getAvailableOrders();

  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeading
        eyebrow="Delivery marketplace"
        title="Find deliveries"
        description="Browse open customer requests and place a bid that reflects the route, parcel and vehicle required."
      />

      {orders.length ? (
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
          {orders.map((order) => (
            <article
              key={order.id}
              className="group rounded-xl border border-orange-100 bg-white p-4 shadow-sm transition hover:border-orange-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-orange-50 text-orange-600">
                    <TruckIcon className="h-4 w-4" />
                  </span>
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  Open for bids
                </span>
              </div>

              <div className="mt-3.5 space-y-2 border-t border-slate-100 pt-3.5">
                <div className="flex gap-2.5">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                  <p className="min-w-0 truncate text-sm font-medium text-slate-700">
                    {order.pickup_address}
                  </p>
                </div>
                <div className="flex gap-2.5">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-orange-500" />
                  <p className="min-w-0 truncate text-sm font-medium text-slate-700">
                    {order.dropoff_address}
                  </p>
                </div>
              </div>

              <div className="mt-3.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="rounded-md bg-slate-50 px-2 py-1 font-medium text-slate-600">
                  {order.goods_description}
                </span>
                <span className="rounded-md bg-slate-50 px-2 py-1 font-medium text-slate-600">
                  {order.vehicle_type_required
                    ? VEHICLE_TYPE_LABELS[order.vehicle_type_required]
                    : 'Any vehicle'}
                </span>
              </div>

              <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-3.5">
                <span className="text-xs text-slate-400">
                  Posted {formatDate(order.created_at)}
                </span>

                <Link
                  href={`/driver/orders/${order.id}`}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-orange-600 px-3.5 text-sm font-semibold text-white transition group-hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
                >
                  View &amp; bid
                  <RouteIcon className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={SearchIcon}
          title="No deliveries available"
          description="There are no pending customer orders right now. Check again soon for new opportunities."
        />
      )}
    </div>
  );
}