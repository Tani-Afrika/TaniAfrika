'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { acceptBid } from '@/lib/actions/client-order-detail';
import type { ClientBid } from '@/lib/actions/client-order-detail';
import { formatCurrency, formatRelativeTime } from '@/lib/format';

import BidMessageThread from '@/components/client/BidMessageThread';

interface BidsListProps {
  orderId: string;
  currentUserId: string;
  bids: ClientBid[];
}

export default function BidsList({ orderId, currentUserId, bids }: BidsListProps) {
  const router = useRouter();
  const [expandedBidId, setExpandedBidId] = useState<string | null>(null);
  const [pendingBidId, setPendingBidId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  if (bids.length === 0) {
    return (
      <div className="rounded-2xl border border-ink-400/15 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-medium text-ink-700">No bids yet</p>
        <p className="mt-1 text-xs text-ink-500">Approved drivers nearby will be notified about this order.</p>
      </div>
    );
  }

  function handleAccept(bidId: string) {
    setErrorMessage('');
    setPendingBidId(bidId);

    startTransition(async () => {
      const result = await acceptBid(orderId, bidId);

      if (!result.success) {
        setErrorMessage(result.error ?? 'Could not accept this bid. Please try again.');
        setPendingBidId(null);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {errorMessage ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {errorMessage}
        </div>
      ) : null}

      {bids.map((bid) => {
        const isExpanded = expandedBidId === bid.id;

        return (
          <div key={bid.id} className="rounded-2xl border border-ink-400/15 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-maroon-50 text-sm font-semibold text-maroon-700">
                  {bid.driver?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={bid.driver.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (bid.driver?.full_name ?? 'D').slice(0, 1).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-900">{bid.driver?.full_name ?? 'Driver'}</p>
                  <p className="text-xs text-ink-400">{formatRelativeTime(bid.created_at)}</p>
                </div>
              </div>
              <p className="text-lg font-semibold text-maroon-700">{formatCurrency(bid.amount)}</p>
            </div>

            {bid.message ? <p className="mt-3 text-sm leading-6 text-ink-600">{bid.message}</p> : null}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleAccept(bid.id)}
                disabled={isPending}
                className="rounded-lg bg-maroon-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-maroon-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending && pendingBidId === bid.id ? 'Accepting…' : 'Accept bid'}
              </button>
              <button
                type="button"
                onClick={() => setExpandedBidId(isExpanded ? null : bid.id)}
                className="rounded-lg border border-ink-400/25 px-4 py-2 text-xs font-semibold text-ink-700 transition hover:border-maroon-200 hover:text-maroon-700"
              >
                {isExpanded ? 'Hide messages' : `Messages${bid.messages.length ? ` (${bid.messages.length})` : ''}`}
              </button>
            </div>

            {isExpanded ? (
              <div className="mt-4">
                <BidMessageThread
                  orderId={orderId}
                  bidId={bid.id}
                  currentUserId={currentUserId}
                  messages={bid.messages}
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}