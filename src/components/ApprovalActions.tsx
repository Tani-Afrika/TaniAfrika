'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateDriverApprovalWithReason } from '@/lib/actions/admin-verification';
import type { ApprovalStatus } from '@/types/supabase';

const STATUS_STYLES: Record<ApprovalStatus, { label: string; bg: string; text: string }> = {
  pending: { label: 'Pending', bg: 'bg-amber-100', text: 'text-amber-800' },
  approved: { label: 'Approved', bg: 'bg-emerald-100', text: 'text-emerald-800' },
  rejected: { label: 'Rejected', bg: 'bg-red-100', text: 'text-red-800' },
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
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [reason, setReason] = useState('');

  function applyStatus(newStatus: ApprovalStatus, rejectionReason?: string) {
    const previousStatus = status;
    setStatus(newStatus);
    setErrorMessage('');
    setShowRejectBox(false);

    startTransition(async () => {
      const result = await updateDriverApprovalWithReason(driverId, newStatus, rejectionReason);

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
        className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${style.bg} ${style.text}`}
      >
        {style.label}
      </span>

      <div className="flex gap-1.5">
        {status !== 'approved' && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => applyStatus('approved')}
            className="rounded-lg bg-[#1F5F3F] px-2.5 py-1 text-xs font-bold text-white transition hover:bg-[#184c32] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Approve
          </button>
        )}

        {status !== 'rejected' && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => setShowRejectBox((prev) => !prev)}
            className="rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reject...
          </button>
        )}

        {status === 'rejected' && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => applyStatus('pending')}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reset
          </button>
        )}
      </div>

      {showRejectBox && (
        <div className="mt-1 flex flex-col gap-1.5 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs shadow-sm">
          <input
            type="text"
            placeholder="Rejection reason..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="rounded-lg border border-red-300 bg-white px-2 py-1 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-400"
          />
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setShowRejectBox(false)}
              className="rounded px-2 py-0.5 text-[11px] text-slate-600 hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPending || !reason.trim()}
              onClick={() => applyStatus('rejected', reason.trim())}
              className="rounded bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white hover:bg-red-700 disabled:opacity-50"
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {errorMessage && (
        <p className="max-w-[180px] text-right text-xs text-red-700">{errorMessage}</p>
      )}
    </div>
  );
}