'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { disputeOrder } from '@/lib/actions/client-order-detail';

interface DisputeControlProps {
  orderId: string;
}

export default function DisputeControl({ orderId }: DisputeControlProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleDispute = () => {
    setErrorMessage('');

    startTransition(async () => {
      const result = await disputeOrder(orderId, notes);

      if (!result.success) {
        setErrorMessage(result.error ?? 'Could not open a dispute. Please try again.');
        return;
      }

      setShowConfirm(false);
      router.refresh();
    });
  };

  if (!showConfirm) {
    return (
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="text-xs font-semibold text-red-700 underline decoration-red-200 underline-offset-4 hover:text-red-800"
      >
        Dispute this delivery
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-red-100 bg-red-50 p-3">
      <p className="text-sm font-medium text-red-800">Open a dispute?</p>
      <p className="mt-1 text-xs text-red-700">
        Use this if goods were damaged, missing, or not as agreed. This holds payout review. It cannot be undone
        from this screen.
      </p>
      <label htmlFor="dispute-notes" className="mt-3 block text-xs font-medium text-red-800">
        What went wrong (optional)
      </label>
      <textarea
        id="dispute-notes"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        maxLength={500}
        rows={3}
        className="mt-1 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-ink-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
      />
      {errorMessage ? <p className="mt-2 text-xs text-red-700">{errorMessage}</p> : null}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleDispute}
          disabled={isPending}
          className="rounded-lg bg-red-700 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? 'Opening dispute…' : 'Yes, dispute'}
        </button>
        <button
          type="button"
          onClick={() => setShowConfirm(false)}
          disabled={isPending}
          className="rounded-lg border border-ink-400/25 px-3.5 py-2 text-xs font-semibold text-ink-700 transition hover:border-ink-400/50"
        >
          Keep delivery
        </button>
      </div>
    </div>
  );
}
