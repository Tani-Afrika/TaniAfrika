'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { updateDriverApproval } from '@/lib/actions/users';
import type { ApprovalStatus } from '@/types/supabase';

const STATUS_STYLES: Record<ApprovalStatus, { label: string; bg: string; text: string }> = {
  pending: { label: 'Pending', bg: 'bg-amber-100', text: 'text-amber-700' },
  approved: { label: 'Approved', bg: 'bg-green-100', text: 'text-green-700' },
  rejected: { label: 'Rejected', bg: 'bg-red-100', text: 'text-red-700' },
  suspended: { label: 'Suspended', bg: 'bg-slate-100', text: 'text-slate-700' },
};

export default function ApprovalActions({
  driverId,
  currentStatus,
}: {
  driverId: string;
  currentStatus: ApprovalStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<ApprovalStatus>(currentStatus);
  const [errorMessage, setErrorMessage] = useState('');

  function applyStatus(newStatus: ApprovalStatus) {
    const previousStatus = status;
    setStatus(newStatus);
    setErrorMessage('');

    startTransition(async () => {
      const result = await updateDriverApproval(driverId, newStatus);

      if (!result.success) {
        setStatus(previousStatus);
        setErrorMessage(result.error ?? 'Failed to update approval status.');
        return;
      }

      router.refresh();
    });
  }

  const style = STATUS_STYLES[status];

  return (
    <div className="flex flex-col items-end gap-1.5">
      <span
        className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${style.bg} ${style.text}`}
      >
        {style.label}
      </span>

      <div className="flex gap-1.5">
        {status !== 'approved' && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => applyStatus('approved')}
            className="rounded-md bg-green-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Approve
          </button>
        )}

        {status !== 'rejected' && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => applyStatus('rejected')}
            className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reject
          </button>
        )}

        {status === 'rejected' && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => applyStatus('pending')}
            className="rounded-md border border-ink-200 bg-white px-2.5 py-1 text-xs font-semibold text-ink-700 transition hover:bg-ink-200/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reset
          </button>
        )}
      </div>

      {errorMessage && (
        <p className="max-w-[160px] text-right text-xs text-red-700">{errorMessage}</p>
      )}
    </div>
  );
}