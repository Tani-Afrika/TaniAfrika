import Link from 'next/link';

import StatusBadge from '@/components/StatusBadge';
import {
  formatCurrency,
  formatDate,
} from '@/lib/format';
import { getBids } from '@/lib/queries';
import type {
  BidStatus,
  OrderStatus,
} from '@/types/supabase';

export const dynamic = 'force-dynamic';

export default async function BidsPage() {
  const bids = await getBids();

  const pendingBids = bids.filter(
    (bid) => bid.status === 'pending'
  ).length;

  const acceptedBids = bids.filter(
    (bid) => bid.status === 'accepted'
  ).length;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-semibold text-ink-900">
          Bids
        </h1>

        <p className="text-sm text-ink-600">
          Review driver price offers submitted against
          delivery orders.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:max-w-lg">
        <div className="surface p-4">
          <p className="text-xs font-medium text-ink-400">
            Pending bids
          </p>

          <p className="mt-1 font-display text-2xl font-semibold text-amber-700">
            {pendingBids}
          </p>
        </div>

        <div className="surface p-4">
          <p className="text-xs font-medium text-ink-400">
            Accepted bids
          </p>

          <p className="mt-1 font-display text-2xl font-semibold text-green-700">
            {acceptedBids}
          </p>
        </div>
      </div>

      <section className="grid gap-3.5 lg:grid-cols-2">
        {bids.map((bid) => {
          const driverInitial = (bid.driver?.full_name ?? '?').trim().charAt(0).toUpperCase();
          const orderStatusLabel = bid.order?.status
            ? (bid.order.status as OrderStatus).replaceAll('_', ' ')
            : 'unknown';

          return (
            <article
              key={bid.id}
              className="surface flex flex-col gap-3.5 p-4"
            >
              {/* Driver identity + bid status */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-maroon-100 text-sm font-semibold text-maroon-600">
                    {driverInitial}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-sm font-semibold text-ink-900">
                      {bid.driver?.full_name ?? 'Unknown driver'}
                    </h2>
                    <p className="truncate text-xs text-ink-600">
                      {bid.driver?.phone ?? 'No phone provided'}
                    </p>
                  </div>
                </div>

                <StatusBadge kind="bid" status={bid.status as BidStatus} />
              </div>

              {/* Offer amount + submitted date, inline */}
              <div className="flex items-center justify-between gap-3 rounded-lg bg-ink-900/[0.02] px-3 py-2.5">
                <div>
                  <p className="text-xs text-ink-400">Driver offer</p>
                  <p className="font-display text-lg font-semibold text-maroon-600">
                    {formatCurrency(bid.amount)}
                  </p>
                </div>
                <p className="text-xs text-ink-500">
                  Submitted {formatDate(bid.created_at)}
                </p>
              </div>

              {/* Related order, condensed to one row */}
              <Link
                href={`/orders/${bid.order_id}`}
                className="group flex items-center justify-between gap-3 rounded-lg border border-ink-200 px-3 py-2.5 transition hover:border-maroon-100 hover:bg-maroon-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-200"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-ink-900">
                    {bid.order?.pickup_address ?? 'Unknown pickup'}
                    <span className="text-ink-400"> → </span>
                    {bid.order?.dropoff_address ?? 'Unknown drop-off'}
                  </p>
                  <p className="mt-0.5 text-xs capitalize text-ink-500">
                    {orderStatusLabel}
                  </p>
                </div>

                <span className="shrink-0 text-xs font-semibold text-maroon-600 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                  View →
                </span>
              </Link>

              {bid.message && (
                <p className="line-clamp-2 text-xs leading-5 text-ink-600">
                  <span className="font-medium text-ink-700">Message: </span>
                  {bid.message}
                </p>
              )}
            </article>
          );
        })}

        {bids.length === 0 && (
          <div className="col-span-full surface flex flex-col items-center px-4 py-14 text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-maroon-50 text-maroon-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <p className="font-medium text-ink-600">
              No bids found
            </p>

            <p className="mt-1 text-sm text-ink-400">
              Driver bids will appear here once submitted.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}