import { formatCurrency } from '@/lib/format';
import type { PaymentHold } from '@/lib/actions/client-order-detail';

interface OrderReceiptProps {
  orderNumber: number | null;
  pickupAddress: string;
  dropoffAddress: string;
  hold: PaymentHold;
  driverName: string | null;
}

const formatMinorKes = (amountMinor: number | null) => {
  if (amountMinor == null) return '—';
  return formatCurrency(amountMinor / 100);
};

export default function OrderReceipt({
  orderNumber,
  pickupAddress,
  dropoffAddress,
  hold,
  driverName,
}: OrderReceiptProps) {
  const tripTotal =
    hold.priceAgreed != null
      ? formatCurrency(hold.priceAgreed)
      : hold.platformFeeMinor != null && hold.driverEarningsMinor != null
        ? formatCurrency((hold.platformFeeMinor + hold.driverEarningsMinor) / 100)
        : '—';

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-trust-600">Receipt</p>
      <h2 className="mt-2 font-display text-xl font-semibold text-ink-900">
        {orderNumber != null ? `Order ${orderNumber}` : 'Trip receipt'}
      </h2>

      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-xs text-ink-400">Pickup</dt>
          <dd className="mt-0.5 text-ink-800">{pickupAddress}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-400">Drop-off</dt>
          <dd className="mt-0.5 text-ink-800">{dropoffAddress}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-400">Driver</dt>
          <dd className="mt-0.5 text-ink-800">{driverName ?? '—'}</dd>
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-3">
          <div>
            <dt className="text-xs text-ink-400">Trip total</dt>
            <dd className="mt-0.5 font-semibold text-ink-900">{tripTotal}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-400">Platform fee</dt>
            <dd className="mt-0.5 text-ink-800">{formatMinorKes(hold.platformFeeMinor)}</dd>
          </div>
        </div>
      </dl>
    </section>
  );
}
