'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { sendBidMessage } from '@/lib/actions/client-order-detail';
import type { BidMessageRow } from '@/lib/actions/client-order-detail';
import { formatRelativeTime } from '@/lib/format';

interface BidMessageThreadProps {
  orderId: string;
  bidId: string;
  currentUserId: string;
  messages: BidMessageRow[];
}

export default function BidMessageThread({ orderId, bidId, currentUserId, messages }: BidMessageThreadProps) {
  const router = useRouter();
  const [draft, setDraft] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSend() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setErrorMessage('');

    startTransition(async () => {
      const result = await sendBidMessage(orderId, bidId, trimmed);

      if (!result.success) {
        setErrorMessage(result.error ?? 'Could not send message. Please try again.');
        return;
      }

      setDraft('');
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-ink-200/70 bg-ink-50/40 p-3">
      <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <p className="py-2 text-center text-xs text-ink-400">No messages yet. Ask a question about this bid.</p>
        ) : (
          messages.map((message) => {
            const isMine = message.sender_id === currentUserId;
            return (
              <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-5 ${
                    isMine ? 'bg-trust-600 text-white' : 'bg-white text-ink-800 shadow-sm'
                  }`}
                >
                  <p>{message.message}</p>
                  <p className={`mt-1 text-[10px] ${isMine ? 'text-white/70' : 'text-ink-400'}`}>
                    {formatRelativeTime(message.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {errorMessage ? <p className="mt-2 text-xs text-red-700">{errorMessage}</p> : null}

      <div className="mt-3 flex items-center gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask the driver a question…"
          className="flex-1 rounded-lg border border-ink-400/30 bg-white px-3 py-2 text-sm outline-none focus:border-trust-600 focus:ring-2 focus:ring-trust-100"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!draft.trim() || isPending}
          className="rounded-lg bg-trust-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-trust-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Send
        </button>
      </div>
    </div>
  );
}