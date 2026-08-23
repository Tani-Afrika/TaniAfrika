'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { cancelOrder } from '@/lib/actions/client-order-detail';

interface CancelOrderControlProps {
  orderId: string;
}

export default function CancelOrderControl({ orderId }: CancelOrderControlProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    setErrorMessage('');

    startTransition(async () => {
      const result = await cancelOrder(orderId);

      if (!result.success) {
        setErrorMessage(result.error ?? 'Could not cancel this order. Please try again.');
        return;
      }

      setShowConfirm(false);
      router.refresh();
    });
  }

  if (!showConfirm) {
    return (
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="text-xs font-semibold text-red-700 underline decoration-red-200 underline-offset-4 hover:text-red-800"
      >
        Cancel order
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-red-100 bg-red-50 p-3">
      <p className="text-sm font-medium text-red-800">Cancel this order?</p>
      <p className="mt-1 text-xs text-red-700">This cannot be undone.</p>
      {errorMessage ? <p className="mt-2 text-xs text-red-700">{errorMessage}</p> : null}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isPending}
          className="rounded-lg bg-red-700 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? 'Cancelling…' : 'Yes, cancel order'}
        </button>
        <button
          type="button"
          onClick={() => setShowConfirm(false)}
          disabled={isPending}
          className="rounded-lg border border-ink-400/25 px-3.5 py-2 text-xs font-semibold text-ink-700 transition hover:border-ink-400/50"
        >
          Keep order
        </button>
      </div>
    </div>
  );
}