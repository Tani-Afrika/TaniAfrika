'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { confirmTestPayoutAction } from '@/lib/actions/admin-payment';

interface ConfirmPayoutButtonProps {
  orderId: string;
}

export default function ConfirmPayoutButton({ orderId }: ConfirmPayoutButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await confirmTestPayoutAction(orderId);
      if (!result.success) {
        setError(result.error ?? 'Failed to confirm payout.');
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-amber-950">
              Delivery complete — release driver payout
            </p>
            <p className="mt-0.5 text-xs text-amber-800">
              Staging only: simulate escrow release and M-Pesa B2C success so the order can reach completed.
            </p>
          </div>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-trust px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-trust-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-trust/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Releasing payout…</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Confirm Test Payout</span>
              </>
            )}
          </button>
        </div>
      </div>
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
