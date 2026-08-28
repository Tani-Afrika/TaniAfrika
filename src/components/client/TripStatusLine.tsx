import { getClientOrderStatusLine, ORDER_STATUS_STYLES } from '@/lib/format';
import type { OrderStatus } from '@/types/supabase';

interface TripStatusLineProps {
  status: OrderStatus;
  driverName?: string | null;
}

export default function TripStatusLine({ status, driverName }: TripStatusLineProps) {
  const label = ORDER_STATUS_STYLES[status].label;
  const line = getClientOrderStatusLine(status, driverName);
  const detail = line.startsWith(`${label}: `) ? line.slice(label.length + 2) : line;

  return (
    <p className="mt-3 text-sm leading-6 text-ink-700" role="status">
      <span className="font-semibold text-ink-900">{label}. </span>
      {detail}
    </p>
  );
}
