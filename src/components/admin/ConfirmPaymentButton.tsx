'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { confirmTestPaymentAction } from '@/lib/actions/admin-payment';

interface ConfirmPaymentButtonProps {
  orderId: string;
}

export default function ConfirmPaymentButton({ orderId }: ConfirmPaymentButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await confirmTestPaymentAction(orderId);
      if (!result.success) {
        setError(result.error ?? 'Failed to confirm payment.');
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-emerald-900">
              Payment Pending Confirmation
            </p>
            <p className="mt-0.5 text-xs text-emerald-700">
              Simulate or verify M-Pesa collection and unlock the order for driver dispatch.
            </p>
          </div>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
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
                <span>Processing payment…</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Confirm Test Payment</span>
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
