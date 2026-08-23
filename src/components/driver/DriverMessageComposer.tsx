'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { sendDriverBidMessage } from '@/lib/actions/driver-orders';

export default function DriverMessageComposer({ bidId, orderId }: { bidId: string; orderId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      {error ? <p className="mb-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p> : null}
      <div className="flex gap-2">
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              if (!message.trim()) return;
              startTransition(async () => {
                const result = await sendDriverBidMessage({ bidId, orderId, message });
                if (!result.success) setError(result.error ?? 'Could not send message.');
                else { setMessage(''); setError(''); router.refresh(); }
              });
            }
          }}
          placeholder="Write a message…"
          className="min-h-11 flex-1 rounded-xl border border-orange-100 bg-white px-4 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
        />
        <button
          type="button"
          disabled={isPending || !message.trim()}
          onClick={() => startTransition(async () => {
            const result = await sendDriverBidMessage({ bidId, orderId, message });
            if (!result.success) setError(result.error ?? 'Could not send message.');
            else { setMessage(''); setError(''); router.refresh(); }
          })}
          className="rounded-xl bg-orange-600 px-5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
        >
          {isPending ? 'Sending…' : 'Send'}
        </button>
      </div>
    </div>
  );
}
