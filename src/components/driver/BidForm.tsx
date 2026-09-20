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
        <span className="text-xs font-semibold text-slate-800">Your delivery fee (KES)</span>
        <input
          type="number"
          min="1"
          step="1"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="e.g. 1,450"
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-trust focus:ring-4 focus:ring-trust/15"
          required
        />
        <div className="mt-2 flex items-center gap-1.5">
          <span className="text-[10px] font-medium text-slate-400">Quick add:</span>
          {[500, 1000, 1500, 2500].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                const current = Number(amount) || 0;
                setAmount(String(current + preset));
              }}
              className="native-press rounded-lg border border-slate-200 bg-paper-light px-2 py-1 text-[11px] font-semibold text-trust hover:border-trust/40 hover:bg-trust-light/40"
            >
              +{preset.toLocaleString()}
            </button>
          ))}
          {amount ? (
            <button
              type="button"
              onClick={() => setAmount('')}
              className="text-[10px] text-slate-400 hover:text-slate-600 underline ml-auto"
            >
              Clear
            </button>
          ) : null}
        </div>
      </label>
      <label className="block">
        <span className="text-xs font-semibold text-slate-800">Message to customer <span className="font-normal text-slate-400">(optional)</span></span>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={3}
          placeholder="Confirm vehicle, availability or estimated pickup time."
          className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-trust focus:ring-4 focus:ring-trust/15"
        />
      </label>
      {error ? <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={isPending || !amount}
        className="w-full rounded-xl bg-trust px-4 py-3 text-sm font-semibold text-white shadow-md shadow-trust/20 transition hover:bg-trust-deep disabled:cursor-not-allowed disabled:opacity-60 native-press"
      >
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
