import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/format';
import { getDriverBids } from '@/lib/actions/driver-orders';
import { EmptyState, PageHeading } from '@/components/driver/DriverUI';
import { GavelIcon } from '@/components/driver/DriverIcons';

export const dynamic = 'force-dynamic';

export default async function DriverBidsPage() {
  const bids = await getDriverBids();

  return (
    <div className="mx-auto max-w-[1300px]">
      <PageHeading
        eyebrow="Bid centre"
        title="My bids"
        description="Monitor customer responses and open the related delivery for messages or next steps."
      />

      {bids.length ? (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 sm:gap-3.5">
          {bids.map((bid) => (
            <Link
              key={bid.id}
              href={`/driver/orders/${bid.order_id}`}
              className="native-card group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition hover:border-trust/40 hover:shadow-sm sm:p-4 native-press"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-trust-light/60 text-trust">
                      <GavelIcon className="h-4 w-4" />
                    </span>
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                      #{bid.order_id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <StatusBadge kind="bid" status={bid.status} />
                </div>

                <div className="mt-3 space-y-1 border-t border-slate-100 pt-2.5">
                  <p className="text-[10px] font-medium text-slate-400">Route</p>
                  <p className="line-clamp-2 text-xs font-semibold text-slate-900">
                    {bid.order
                      ? `${bid.order.pickup_address} → ${bid.order.dropoff_address}`
                      : 'Delivery order'}
                  </p>
                </div>
              </div>

              <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.06em] text-slate-400">
                    Your offer
                  </p>
                  <p className="text-sm font-bold text-trust sm:text-base">
                    {formatCurrency(bid.amount)}
                  </p>
                </div>
                <span className="text-[11px] text-slate-400">
                  {formatDate(bid.created_at)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={GavelIcon}
          title="You have not placed any bids"
          description="Browse available deliveries and submit your first competitive bid."
          href="/driver/orders"
          actionLabel="Find deliveries"
        />
      )}
    </div>
  );
}