'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { placeDriverBid, withdrawDriverBid } from '@/lib/actions/driver-orders';

export function BidForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setError('');
        startTransition(async () => {
          const result = await placeDriverBid({ orderId, amount: Number(amount), message });
          if (!result.success) {
            setError(result.error ?? 'Could not submit bid.');
            return;
          }
          router.refresh();
        });
      }}
      className="space-y-4"
    >
      <label className="block">
        <span className="text-sm font-semibold text-slate-800">Your delivery fee (KES)</span>
        <input
          type="number"
          min="1"
          step="1"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="e.g. 1,450"
          className="mt-2 w-full rounded-xl border border-orange-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
          required
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-slate-800">Message to customer <span className="font-normal text-slate-400">(optional)</span></span>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={4}
          placeholder="Confirm vehicle, availability or estimated pickup time."
          className="mt-2 w-full resize-none rounded-xl border border-orange-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
        />
      </label>
      {error ? <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <button type="submit" disabled={isPending || !amount} className="w-full rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60">
        {isPending ? 'Submitting bid…' : 'Submit bid'}
      </button>
    </form>
  );
}

export function WithdrawBidButton({ bidId, orderId }: { bidId: string; orderId: string }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setError('');
          startTransition(async () => {
            const result = await withdrawDriverBid(bidId, orderId);
            if (!result.success) setError(result.error ?? 'Could not withdraw bid.');
            else router.refresh();
          });
        }}
        className="min-h-11 rounded-xl border border-red-100 bg-white px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
      >
        {isPending ? 'Withdrawing…' : 'Withdraw bid'}
      </button>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
