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

      <div className="grid grid-cols-2 gap-2.5 sm:max-w-lg">
        <div className="native-card surface p-3.5 sm:p-4 rounded-2xl">
          <p className="text-[11px] font-medium text-ink-400 sm:text-xs">
            Pending bids
          </p>

          <p className="mt-1 font-display text-xl font-bold text-amber-700 sm:text-2xl">
            {pendingBids}
          </p>
        </div>

        <div className="native-card surface p-3.5 sm:p-4 rounded-2xl">
          <p className="text-[11px] font-medium text-ink-400 sm:text-xs">
            Accepted bids
          </p>

          <p className="mt-1 font-display text-xl font-bold text-trust sm:text-2xl">
            {acceptedBids}
          </p>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3.5">
        {bids.map((bid) => {
          const driverInitial = (bid.driver?.full_name ?? '?').trim().charAt(0).toUpperCase();
          const orderStatusLabel = bid.order?.status
            ? (bid.order.status as OrderStatus).replaceAll('_', ' ')
            : 'unknown';

          return (
            <article
              key={bid.id}
              className="native-card surface flex flex-col justify-between gap-3 p-3.5 sm:p-4 rounded-2xl"
            >
              <div>
                {/* Driver identity + bid status */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-trust-light/60 text-xs font-semibold text-trust sm:h-9 sm:w-9 sm:text-sm">
                      {driverInitial}
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate font-display text-xs font-semibold text-ink-900 sm:text-sm">
                        {bid.driver?.full_name ?? 'Unknown driver'}
                      </h2>
                      <p className="truncate text-[11px] text-ink-600">
                        {bid.driver?.phone ?? 'No phone provided'}
                      </p>
                    </div>
                  </div>

                  <StatusBadge kind="bid" status={bid.status as BidStatus} />
                </div>

                {/* Offer amount + submitted date, inline */}
                <div className="mt-3 flex items-center justify-between gap-2.5 rounded-xl bg-ink-900/[0.02] px-3 py-2">
                  <div>
                    <p className="text-[10px] text-ink-400">Driver offer</p>
                    <p className="font-display text-base font-bold text-trust sm:text-lg">
                      {formatCurrency(bid.amount)}
                    </p>
                  </div>
                  <p className="text-[11px] text-ink-500">
                    {formatDate(bid.created_at)}
                  </p>
                </div>

                {/* Related order, condensed to one row */}
                <Link
                  href={`/orders/${bid.order_id}`}
                  className="group mt-2.5 flex items-center justify-between gap-2.5 rounded-xl border border-ink-200/80 px-3 py-2 transition hover:border-trust/30 hover:bg-trust-light/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-trust/20 native-press"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-ink-900">
                      {bid.order?.pickup_address ?? 'Unknown pickup'}
                      <span className="text-ink-400"> → </span>
                      {bid.order?.dropoff_address ?? 'Unknown drop-off'}
                    </p>
                    <p className="mt-0.5 text-[10px] capitalize text-ink-500">
                      {orderStatusLabel}
                    </p>
                  </div>

                  <span className="shrink-0 text-xs font-semibold text-trust opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                    View →
                  </span>
                </Link>

                {bid.message && (
                  <p className="mt-2.5 line-clamp-2 text-xs leading-5 text-ink-600">
                    <span className="font-semibold text-ink-700">Message: </span>
                    {bid.message}
                  </p>
                )}
              </div>
            </article>
          );
        })}

        {bids.length === 0 && (
          <div className="col-span-full surface flex flex-col items-center px-4 py-12 text-center rounded-2xl">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-trust-light/60 text-trust sm:h-11 sm:w-11">
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