import Link from 'next/link';
import { getDriverBids } from '@/lib/actions/driver-orders';
import { formatRelativeTime } from '@/lib/format';
import { EmptyState, PageHeading } from '@/components/driver/DriverUI';
import { MessageIcon } from '@/components/driver/DriverIcons';

export const dynamic = 'force-dynamic';

export default async function DriverMessagesPage() {
  const bids = await getDriverBids();
  const threads = bids.filter((b) => b.message || b.status === 'accepted');

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeading
        eyebrow="Communication"
        title="Messages"
        description="Open a bid conversation to answer customer questions or coordinate an accepted delivery."
      />

      {threads.length ? (
        <div className="native-card overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="divide-y divide-slate-100">
            {threads.map((b) => (
              <Link
                key={b.id}
                href={`/driver/orders/${b.order_id}`}
                className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-trust-light/30 focus-visible:bg-trust-light/40 focus-visible:outline-none sm:gap-3.5 sm:px-5 sm:py-4 native-press"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-trust-light/60 text-trust sm:h-10 sm:w-10">
                  <MessageIcon className="h-4 w-4" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-900 sm:text-sm">
                    {b.order
                      ? `${b.order.pickup_address} → ${b.order.dropoff_address}`
                      : `Order #${b.order_id.slice(0, 8)}`}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-slate-400">
                    {b.message ?? 'Open conversation'}
                  </p>
                </div>

                <span className="shrink-0 text-[11px] text-slate-400">
                  {formatRelativeTime(b.updated_at)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={MessageIcon}
          title="No conversations yet"
          description="Messages linked to your bids will appear here."
          href="/driver/orders"
          actionLabel="Find deliveries"
        />
      )}
    </div>
  );
}