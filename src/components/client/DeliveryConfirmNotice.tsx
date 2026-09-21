interface DeliveryConfirmNoticeProps {
  driverName: string | null;
}

export default function DeliveryConfirmNotice({ driverName }: DeliveryConfirmNoticeProps) {
  const name = driverName?.trim() || 'your driver';

  return (
    <section className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">Delivery received</p>
      <h2 className="mt-2 font-display text-xl font-semibold text-ink-900">Goods are with you</h2>
      <p className="mt-2 text-sm leading-6 text-ink-600">
        This confirms {name} marked the trip delivered. Completing payout is not done from this screen — we will
        not mark the order completed here.
      </p>
    </section>
  );
}
