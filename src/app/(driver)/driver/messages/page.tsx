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
        <div className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm">
          <div className="divide-y divide-orange-100">
            {threads.map((b) => (
              <Link
                key={b.id}
                href={`/driver/orders/${b.order_id}`}
                className="flex items-center gap-3.5 px-5 py-4 transition hover:bg-orange-50/40 focus-visible:bg-orange-50/60 focus-visible:outline-none"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-orange-50 text-orange-600">
                  <MessageIcon className="h-4 w-4" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-950">
                    {b.order
                      ? `${b.order.pickup_address} → ${b.order.dropoff_address}`
                      : `Order #${b.order_id.slice(0, 8)}`}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">
                    {b.message ?? 'Open conversation'}
                  </p>
                </div>

                <span className="shrink-0 text-xs text-slate-400">
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