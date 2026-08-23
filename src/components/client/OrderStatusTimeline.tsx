import StatusBadge from '@/components/StatusBadge';
import { formatDate } from '@/lib/format';
import type { OrderStatusHistory } from '@/types/supabase';

interface OrderStatusTimelineProps {
  history: OrderStatusHistory[];
}

export default function OrderStatusTimeline({ history }: OrderStatusTimelineProps) {
  if (history.length === 0) {
    return <p className="text-sm text-ink-500">No status updates yet.</p>;
  }

  return (
    <ol className="space-y-0">
      {history.map((entry, index) => (
        <li key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
          {index !== history.length - 1 ? (
            <span className="absolute left-[7px] top-4 h-full w-px bg-ink-200" aria-hidden />
          ) : null}
          <span className="relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-white bg-maroon-600 shadow" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge kind="order" status={entry.status} />
              <span className="text-xs text-ink-400">{formatDate(entry.created_at)}</span>
            </div>
            {entry.notes ? <p className="mt-1 text-sm text-ink-600">{entry.notes}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}