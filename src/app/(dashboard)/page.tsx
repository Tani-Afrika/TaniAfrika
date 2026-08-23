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

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="surface p-4 sm:p-5">
            <p className="text-xs font-medium text-ink-400">{card.label}</p>
            <p className="font-display mt-1 text-2xl font-semibold text-ink-900 sm:text-3xl">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="surface p-4 sm:p-5 lg:col-span-2">
          <h2 className="mb-3 font-display text-sm font-semibold text-ink-900">
            Recent order statuses
          </h2>
          <OrdersChart data={statusCounts} />
        </div>

        <div className="surface p-4 sm:p-5 lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-ink-900">Recent orders</h2>
            <Link href="/orders" className="text-xs font-medium text-maroon-600 hover:underline">
              View all
            </Link>
          </div>

          {stats.recentOrders.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-maroon-50 text-maroon-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M20 12H4m8-8l-8 8 8 8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm text-ink-400">No orders yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-ink-400/15">
              {stats.recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/orders/${order.id}`}
                    className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-3 transition hover:bg-maroon-50/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-900">
                        {order.pickup_address} → {order.dropoff_address}
                      </p>
                      <p className="text-xs text-ink-400">{formatRelativeTime(order.created_at)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="hidden text-sm font-medium text-ink-900 sm:inline">
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