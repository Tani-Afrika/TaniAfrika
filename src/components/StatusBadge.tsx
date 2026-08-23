import { ORDER_STATUS_STYLES, BID_STATUS_STYLES } from '@/lib/format';
import type { OrderStatus, BidStatus } from '@/types/supabase';

type Props =
  | { kind: 'order'; status: OrderStatus }
  | { kind: 'bid'; status: BidStatus };

export default function StatusBadge(props: Props) {
  const style =
    props.kind === 'order' ? ORDER_STATUS_STYLES[props.status] : BID_STATUS_STYLES[props.status];

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {style.label}
    </span>
  );
}