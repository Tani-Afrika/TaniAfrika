'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { acceptBid } from '@/lib/actions/client-order-detail';
import type { ClientBid } from '@/lib/actions/client-order-detail';
import { BID_STATUS_STYLES, formatCurrency, formatDate, formatRelativeTime, VEHICLE_TYPE_LABELS } from '@/lib/format';
import type { BidStatus, VehicleType } from '@/types/supabase';

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

  const handleAccept = (bidId: string) => {
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
  };

  const handleToggleMessages = (bidId: string) => {
    setExpandedBidId((current) => (current === bidId ? null : bidId));
  };

  return (
    <div className="space-y-3">
      {errorMessage ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {errorMessage}
        </div>
      ) : null}

      {bids.map((bid) => {
        const isExpanded = expandedBidId === bid.id;
        const canAccept = bid.status === 'pending';
        const statusStyle = BID_STATUS_STYLES[bid.status as BidStatus] ?? BID_STATUS_STYLES.pending;
        const driverName = bid.driver?.full_name ?? 'Driver';
        const vehicleLabel =
          bid.vehicle_type && bid.vehicle_type in VEHICLE_TYPE_LABELS
            ? VEHICLE_TYPE_LABELS[bid.vehicle_type as VehicleType]
            : null;

        return (
          <div key={bid.id} className="rounded-2xl border border-ink-400/15 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-trust-50 text-sm font-semibold text-trust-700">
                  {bid.driver?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={bid.driver.avatar_url} alt={driverName} className="h-full w-full object-cover" />
                  ) : (
                    driverName.slice(0, 1).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-900">{driverName}</p>
                  <p className="text-xs text-ink-400">{formatRelativeTime(bid.created_at)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-trust-700">{formatCurrency(bid.amount)}</p>
                <p className="mt-1 text-[11px] font-semibold" style={{ color: statusStyle.text }}>
                  {statusStyle.label}
                </p>
              </div>
            </div>

            <dl className="mt-3 grid grid-cols-1 gap-2 text-xs text-ink-500 sm:grid-cols-2">
              <div>
                <dt className="font-medium text-ink-400">ETA</dt>
                <dd className="mt-0.5 text-ink-700">
                  {bid.estimated_pickup_at ? formatDate(bid.estimated_pickup_at) : 'Not given'}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-ink-400">Vehicle</dt>
                <dd className="mt-0.5 text-ink-700">{vehicleLabel ?? 'Shown after you accept'}</dd>
              </div>
            </dl>

            {bid.message ? <p className="mt-3 text-sm leading-6 text-ink-600">{bid.message}</p> : null}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {canAccept ? (
                <button
                  type="button"
                  onClick={() => handleAccept(bid.id)}
                  disabled={isPending}
                  aria-label={`Accept bid of ${formatCurrency(bid.amount)} from ${driverName}`}
                  className="rounded-lg bg-trust-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-trust-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending && pendingBidId === bid.id ? 'Accepting…' : 'Accept bid'}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => handleToggleMessages(bid.id)}
                className="rounded-lg border border-ink-400/25 px-4 py-2 text-xs font-semibold text-ink-700 transition hover:border-trust-200 hover:text-trust-700"
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