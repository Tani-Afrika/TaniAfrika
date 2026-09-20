import Link from 'next/link';
import { getDashboardStats } from '@/lib/queries';
import { formatCurrency, formatRelativeTime, ORDER_STATUS_STYLES } from '@/lib/format';
import StatusBadge from '@/components/StatusBadge';
import OrdersChart from '@/components/OrdersChart';
import type { OrderStatus } from '@/types/supabase';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const statCards = [
    { label: 'Total orders', value: stats.totalOrders },
    { label: 'Active orders', value: stats.activeOrders },
    { label: 'Drivers', value: stats.totalDrivers },
    { label: 'Clients', value: stats.totalClients },
  ];

  const statusCounts = (Object.keys(ORDER_STATUS_STYLES) as OrderStatus[]).map((status) => ({
    status,
    count: stats.recentOrders.filter((o) => o.status === status).length,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900">Dashboard</h1>
        <p className="text-sm text-ink-600">Overview of TaniAfrika operations</p>
      </div>

      {stats.pendingDriverApprovals > 0 && (
        <Link
          href="/drivers?status=pending"
          className="flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 transition hover:border-amber-300 hover:bg-amber-100"
        >
          <div>
            <p className="font-display font-semibold text-amber-900">
              {stats.pendingDriverApprovals} driver
              {stats.pendingDriverApprovals === 1 ? '' : 's'} awaiting approval
            </p>
            <p className="mt-0.5 text-sm text-amber-700">
              New driver signups can&apos;t bid or go online until reviewed.
            </p>
          </div>
          <span className="shrink-0 text-sm font-semibold text-amber-900">Review →</span>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="native-card surface p-3.5 sm:p-5">
            <p className="text-[11px] font-medium text-ink-400 sm:text-xs">{card.label}</p>
            <p className="font-display mt-1 text-xl font-bold text-ink-900 sm:text-3xl">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-5">
        <div className="native-card surface p-3.5 sm:p-5 lg:col-span-2">
          <h2 className="mb-3 font-display text-xs font-bold uppercase tracking-[0.06em] text-ink-700 sm:text-sm">
            Recent order statuses
          </h2>
          <OrdersChart data={statusCounts} />
        </div>

        <div className="native-card surface p-3.5 sm:p-5 lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xs font-bold uppercase tracking-[0.06em] text-ink-700 sm:text-sm">Recent orders</h2>
            <Link href="/orders" className="text-xs font-semibold text-trust hover:underline">
              View all
            </Link>
          </div>

          {stats.recentOrders.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center sm:py-10">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-trust-light/60 text-trust sm:h-11 sm:w-11">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M20 12H4m8-8l-8 8 8 8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-xs text-ink-400 sm:text-sm">No orders yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-ink-400/15">
              {stats.recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/orders/${order.id}`}
                    className="-mx-2 flex items-center justify-between gap-2.5 rounded-xl px-2 py-2.5 transition hover:bg-trust-light/40 native-press sm:gap-3 sm:py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-ink-900 sm:text-sm">
                        {order.pickup_address} → {order.dropoff_address}
                      </p>
                      <p className="text-[11px] text-ink-400">{formatRelativeTime(order.created_at)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                      <span className="hidden text-xs font-medium text-ink-900 sm:inline sm:text-sm">
                        {formatCurrency(order.price_agreed)}
                      </span>
                      <StatusBadge kind="order" status={order.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}