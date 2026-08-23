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
        <div className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm">
          <div className="divide-y divide-orange-100">
            {bids.map((bid) => (
              <Link
                key={bid.id}
                href={`/driver/orders/${bid.order_id}`}
                className="grid grid-cols-1 items-center gap-3 px-5 py-4 transition hover:bg-orange-50/40 focus-visible:bg-orange-50/60 focus-visible:outline-none md:grid-cols-[auto_1fr_auto_auto] md:gap-5"
              >
                <span className="hidden h-9 w-9 shrink-0 place-items-center rounded-lg bg-orange-50 text-orange-600 md:grid">
                  <GavelIcon className="h-4 w-4" />
                </span>

                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-orange-600">
                    #{bid.order_id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-950">
                    {bid.order
                      ? `${bid.order.pickup_address} → ${bid.order.dropoff_address}`
                      : 'Delivery order'}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Submitted {formatDate(bid.created_at)}
                  </p>
                </div>

                <div className="md:text-right">
                  <p className="text-[11px] uppercase tracking-[0.06em] text-slate-400">
                    Your bid
                  </p>
                  <p className="mt-1 text-base font-bold text-slate-950 md:text-lg">
                    {formatCurrency(bid.amount)}
                  </p>
                </div>

                <div className="md:justify-self-end">
                  <StatusBadge kind="bid" status={bid.status} />
                </div>
              </Link>
            ))}
          </div>
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