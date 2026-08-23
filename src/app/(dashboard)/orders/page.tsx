import Link from 'next/link';

import Pagination from '@/components/Pagination';
import StatusBadge from '@/components/StatusBadge';
import {
  formatCurrency,
  formatDate,
  ORDER_STATUS_STYLES,
  VEHICLE_TYPE_LABELS,
} from '@/lib/format';
import { getOrders } from '@/lib/queries';
import type { OrderStatus } from '@/types/supabase';

export const dynamic = 'force-dynamic';

interface OrdersPageProps {
  searchParams: Promise<{
    status?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  }>;
}

const orderStatuses = Object.keys(ORDER_STATUS_STYLES) as OrderStatus[];

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const { status, search, dateFrom, dateTo, page: pageParam } = await searchParams;

  const selectedStatus: OrderStatus | 'all' =
    status && status in ORDER_STATUS_STYLES ? (status as OrderStatus) : 'all';

  const page = Math.max(1, Number(pageParam) || 1);

  const { orders, totalPages, totalCount } = await getOrders({
    status: selectedStatus,
    search,
    dateFrom,
    dateTo,
    page,
  });

  // Params to preserve when switching status tabs or paging (page itself excluded).
  const filterParams: Record<string, string | undefined> = {
    search,
    dateFrom,
    dateTo,
  };

  const statusHref = (targetStatus: OrderStatus | 'all') => {
    const sp = new URLSearchParams();
    Object.entries(filterParams).forEach(([key, value]) => {
      if (value) sp.set(key, value);
    });
    if (targetStatus !== 'all') sp.set('status', targetStatus);
    const query = sp.toString();
    return query ? `/orders?${query}` : '/orders';
  };

  const hasActiveFilters = Boolean(search || dateFrom || dateTo);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-semibold text-ink-900">
          Orders
        </h1>

        <p className="text-sm text-ink-600">
          Track and review all TaniAfrika delivery requests.
        </p>
      </header>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
        <Link
          href={statusHref('all')}
          className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
            selectedStatus === 'all'
              ? 'bg-maroon-600 text-white'
              : 'border border-ink-400/25 bg-white text-ink-600 hover:border-maroon-100 hover:bg-maroon-50 hover:text-maroon-700'
          }`}
        >
          All orders
        </Link>

        {orderStatuses.map((orderStatus) => (
          <Link
            key={orderStatus}
            href={statusHref(orderStatus)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
              selectedStatus === orderStatus
                ? 'bg-maroon-600 text-white'
                : 'border border-ink-400/25 bg-white text-ink-600 hover:border-maroon-100 hover:bg-maroon-50 hover:text-maroon-700'
            }`}
          >
            {ORDER_STATUS_STYLES[orderStatus].label}
          </Link>
        ))}
      </div>

      {/* Search + date range filter — plain GET form, no client JS needed */}
      <form
        method="get"
        action="/orders"
        className="flex flex-wrap items-end gap-3 surface p-4"
      >
        {selectedStatus !== 'all' && (
          <input type="hidden" name="status" value={selectedStatus} />
        )}

        <div className="min-w-[220px] flex-1">
          <label
            htmlFor="search"
            className="mb-1 block text-xs font-medium text-ink-600"
          >
            Search
          </label>
          <input
            id="search"
            type="text"
            name="search"
            defaultValue={search ?? ''}
            placeholder="Client name or route"
            className="w-full rounded-lg border border-ink-400/30 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-maroon-600 focus:outline-none focus:ring-2 focus:ring-maroon-100"
          />
        </div>

        <div>
          <label
            htmlFor="dateFrom"
            className="mb-1 block text-xs font-medium text-ink-600"
          >
            From
          </label>
          <input
            id="dateFrom"
            type="date"
            name="dateFrom"
            defaultValue={dateFrom ?? ''}
            className="rounded-lg border border-ink-400/30 px-3 py-2 text-sm text-ink-900 focus:border-maroon-600 focus:outline-none focus:ring-2 focus:ring-maroon-100"
          />
        </div>

        <div>
          <label
            htmlFor="dateTo"
            className="mb-1 block text-xs font-medium text-ink-600"
          >
            To
          </label>
          <input
            id="dateTo"
            type="date"
            name="dateTo"
            defaultValue={dateTo ?? ''}
            className="rounded-lg border border-ink-400/30 px-3 py-2 text-sm text-ink-900 focus:border-maroon-600 focus:outline-none focus:ring-2 focus:ring-maroon-100"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-lg bg-maroon-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-maroon-700"
          >
            Apply
          </button>

          {hasActiveFilters && (
            <Link
              href={selectedStatus !== 'all' ? `/orders?status=${selectedStatus}` : '/orders'}
              className="rounded-lg border border-ink-400/25 px-4 py-2 text-sm font-medium text-ink-600 transition hover:bg-ink-900/[0.03]"
            >
              Clear
            </Link>
          )}
        </div>
      </form>

      <section className="overflow-hidden surface">
        {/* Desktop and tablet table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[960px] text-left">
            <thead className="bg-ink-900/[0.02] text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-5 py-3 font-semibold">Route</th>
                <th className="px-5 py-3 font-semibold">Client</th>
                <th className="px-5 py-3 font-semibold">Driver</th>
                <th className="px-5 py-3 font-semibold">Vehicle</th>
                <th className="px-5 py-3 font-semibold">Price</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Created</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-ink-400/15">
              {orders.map((order) => (
                <tr key={order.id} className="transition hover:bg-maroon-50/40">
                  <td className="max-w-xs px-5 py-4">
                    <Link
                      href={`/orders/${order.id}`}
                      className="block font-medium text-maroon-600 hover:underline"
                    >
                      <span className="block truncate">
                        {order.pickup_address}
                      </span>

                      <span className="mt-1 block truncate text-xs font-normal text-ink-400">
                        To: {order.dropoff_address}
                      </span>
                    </Link>
                  </td>

                  <td className="px-5 py-4 text-sm text-ink-900">
                    {order.client?.full_name ?? 'Unknown client'}
                  </td>

                  <td className="px-5 py-4 text-sm text-ink-600">
                    {order.driver?.full_name ?? 'Not assigned'}
                  </td>

                  <td className="px-5 py-4 text-sm text-ink-600">
                    {order.vehicle_type_required
                      ? VEHICLE_TYPE_LABELS[order.vehicle_type_required]
                      : 'Not specified'}
                  </td>

                  <td className="px-5 py-4 text-sm font-semibold text-ink-900">
                    {formatCurrency(order.price_agreed)}
                  </td>

                  <td className="px-5 py-4">
                    <StatusBadge kind="order" status={order.status} />
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm text-ink-600">
                    {formatDate(order.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="divide-y divide-ink-400/15 md:hidden">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block p-4 transition hover:bg-maroon-50/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-900">
                    {order.pickup_address}
                  </p>

                  <p className="mt-1 truncate text-xs text-ink-600">
                    To: {order.dropoff_address}
                  </p>
                </div>

                <StatusBadge kind="order" status={order.status} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <p className="text-xs text-ink-400">Client</p>
                  <p className="mt-0.5 truncate font-medium text-ink-900">
                    {order.client?.full_name ?? 'Unknown client'}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-ink-400">Price</p>
                  <p className="mt-0.5 font-semibold text-ink-900">
                    {formatCurrency(order.price_agreed)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-ink-400">Vehicle</p>
                  <p className="mt-0.5 text-ink-600">
                    {order.vehicle_type_required
                      ? VEHICLE_TYPE_LABELS[order.vehicle_type_required]
                      : 'Not specified'}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-ink-400">Created</p>
                  <p className="mt-0.5 text-xs text-ink-600">
                    {formatDate(order.created_at)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {orders.length === 0 && (
          <div className="flex flex-col items-center px-4 py-14 text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-maroon-50 text-maroon-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M20 7L9 18l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <p className="font-medium text-ink-600">No orders found</p>

            <p className="mt-1 text-sm text-ink-400">
              {hasActiveFilters
                ? 'No orders match your search or filters.'
                : 'No orders match the selected status filter.'}
            </p>
          </div>
        )}

        {totalCount > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            baseParams={{
              status: selectedStatus !== 'all' ? selectedStatus : undefined,
              search,
              dateFrom,
              dateTo,
            }}
            basePath="/orders"
          />
        )}
      </section>
    </div>
  );
}