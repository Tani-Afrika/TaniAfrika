import Link from 'next/link';
import { formatDate, VEHICLE_TYPE_LABELS } from '@/lib/format';
import { getAvailableOrders, getDriverProfileData } from '@/lib/actions/driver-orders';
import { EmptyState, PageHeading } from '@/components/driver/DriverUI';
import { RouteIcon, SearchIcon, TruckIcon } from '@/components/driver/DriverIcons';

export const dynamic = 'force-dynamic';

interface AvailableOrdersPageProps {
  searchParams?: Promise<{ filter?: string }>;
}

export default async function AvailableOrdersPage({ searchParams }: AvailableOrdersPageProps) {
  const params = await searchParams;
  const filter = params?.filter;

  const [orders, profileData] = await Promise.all([
    getAvailableOrders(),
    getDriverProfileData(),
  ]);

  const driverVehicle = profileData.vehicle?.vehicle_type;
  const matchingOrders = driverVehicle
    ? orders.filter(
        (o) => !o.vehicle_type_required || o.vehicle_type_required === driverVehicle
      )
    : orders;

  const displayedOrders = filter === 'matched' && driverVehicle ? matchingOrders : orders;

  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeading
        eyebrow="Delivery marketplace"
        title="Find deliveries"
        description="Browse open customer requests and place a bid that reflects the route, parcel and vehicle required."
      />

      {driverVehicle && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Link
            href="/driver/orders"
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              filter !== 'matched'
                ? 'bg-trust text-white shadow-xs'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            All deliveries ({orders.length})
          </Link>
          <Link
            href="/driver/orders?filter=matched"
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              filter === 'matched'
                ? 'bg-trust-deep text-white shadow-xs'
                : 'border border-trust/20 bg-trust-light/40 text-trust hover:bg-trust-light/70'
            }`}
          >
            ✓ Matches vehicle ({matchingOrders.length})
          </Link>
          <span className="text-[11px] text-slate-400">
            Vehicle: <strong className="font-semibold text-slate-700">{VEHICLE_TYPE_LABELS[driverVehicle]}</strong>
          </span>
        </div>
      )}

      {displayedOrders.length ? (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 sm:gap-3.5">
          {displayedOrders.map((order) => {
            const isVehicleMatch =
              driverVehicle &&
              (!order.vehicle_type_required || order.vehicle_type_required === driverVehicle);

            return (
              <article
                key={order.id}
                className="native-card group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition hover:border-trust/40 hover:shadow-sm sm:p-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-trust-light/60 text-trust">
                        <TruckIcon className="h-4 w-4" />
                      </span>
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-trust/10 px-2 py-0.5 text-[10px] font-semibold text-trust">
                      Open for bids
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-trust" />
                      <p className="min-w-0 truncate font-medium text-slate-700">
                        {order.pickup_address}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                      <p className="min-w-0 truncate font-medium text-slate-700">
                        {order.dropoff_address}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1 text-[10px]">
                    <span className="rounded-md bg-slate-100/80 px-2 py-0.5 font-medium text-slate-600">
                      {order.goods_description}
                    </span>
                    <span className="rounded-md bg-slate-100/80 px-2 py-0.5 font-medium text-slate-600">
                      {order.vehicle_type_required
                        ? VEHICLE_TYPE_LABELS[order.vehicle_type_required]
                        : 'Any vehicle'}
                    </span>
                    {isVehicleMatch && (
                      <span className="rounded-md bg-amber-50 px-2 py-0.5 font-semibold text-amber-800 border border-amber-200/50">
                        ✓ Fits {VEHICLE_TYPE_LABELS[driverVehicle]}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-[11px] text-slate-400">
                    {formatDate(order.created_at)}
                  </span>

                  <Link
                    href={`/driver/orders/${order.id}`}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-trust px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-trust-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-trust/30 native-press"
                  >
                    View &amp; bid
                    <RouteIcon className="h-3 w-3" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={SearchIcon}
          title="No deliveries available"
          description={
            filter === 'matched'
              ? 'No open deliveries currently match your vehicle type. Try viewing all deliveries.'
              : 'There are no pending customer orders right now. Check again soon for new opportunities.'
          }
        />
      )}
    </div>
  );
}