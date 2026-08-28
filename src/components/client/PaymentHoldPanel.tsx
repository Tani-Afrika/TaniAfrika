'use client';

import { useState, useTransition } from 'react';

import { initiateClientPayment } from '@/lib/actions/client-payment';
import type { PaymentHold } from '@/lib/actions/client-order-detail';
import { formatCurrency } from '@/lib/format';

interface PaymentHoldPanelProps {
  orderId: string;
  hold: PaymentHold;
  mpesaEnabled: boolean;
}

const formatMinorKes = (amountMinor: number | null) => {
  if (amountMinor == null) return '—';
  return formatCurrency(amountMinor / 100);
};

export default function PaymentHoldPanel({ orderId, hold, mpesaEnabled }: PaymentHoldPanelProps) {
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [flagOff, setFlagOff] = useState(false);
  const [isPending, startTransition] = useTransition();

  const heldAmount =
    hold.priceAgreed != null
      ? formatCurrency(hold.priceAgreed)
      : hold.platformFeeMinor != null && hold.driverEarningsMinor != null
        ? formatCurrency((hold.platformFeeMinor + hold.driverEarningsMinor) / 100)
        : '—';

  const handlePay = () => {
    setNotice(null);
    setErrorMessage(null);
    setFlagOff(false);

    startTransition(async () => {
      const result = await initiateClientPayment(orderId);

      if (!result.ok) {
        setFlagOff(Boolean(result.flagOff));
        setErrorMessage(result.error);
        return;
      }

      setNotice(result.message);
    });
  };

  const showFlagOff = !mpesaEnabled || flagOff;

  return (
    <section className="rounded-2xl border border-amber-100 bg-amber-50/80 p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">Payment held</p>
      <h2 className="mt-2 font-display text-xl font-semibold text-ink-900">{heldAmount} is held safely</h2>
      <p className="mt-2 text-sm leading-6 text-ink-600">
        Your driver is paid when delivery is confirmed. We do not mark this order paid unless M-Pesa (or an admin
        staging confirmation) actually succeeds.
      </p>

      <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-ink-400">Trip total</dt>
          <dd className="mt-0.5 font-semibold text-ink-900">{heldAmount}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-400">Platform fee</dt>
          <dd className="mt-0.5 text-ink-800">{formatMinorKes(hold.platformFeeMinor)}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-400">Driver earnings</dt>
          <dd className="mt-0.5 text-ink-800">{formatMinorKes(hold.driverEarningsMinor)}</dd>
        </div>
      </dl>

      {showFlagOff ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-ink-700" role="status">
          M-Pesa is not live yet. Ask an admin to use Confirm test payment on this order. Pay with M-Pesa will not
          invent a success.
        </p>
      ) : null}

      {errorMessage && !showFlagOff ? (
        <p className="mt-4 rounded-xl border border-red-100 bg-white px-3 py-2 text-sm text-red-700" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {notice ? (
        <p className="mt-4 rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm text-emerald-800" role="status">
          {notice}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handlePay}
        disabled={isPending}
        aria-label="Pay with M-Pesa"
        className="mt-4 w-full rounded-lg bg-maroon-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-maroon-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {isPending ? 'Starting M-Pesa…' : 'Pay with M-Pesa'}
      </button>
    </section>
  );
}
