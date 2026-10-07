'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { ClientIcon } from '@/components/client/ClientIcons';
import { formatDate } from '@/lib/format';
import type { OrderStatus } from '@/types/supabase';

type OrderRow = {
  id: string;
  status: OrderStatus;
  pickup_address: string;
  dropoff_address: string;
  goods_description: string;
  created_at: string;
};

const STATUS: Record<OrderStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-slate-50 text-slate-700' },
  pending: { label: 'Finding drivers', className: 'bg-amber-50 text-amber-700' },
  payment_pending: { label: 'Awaiting payment', className: 'bg-amber-50 text-amber-700' },
  assigned: { label: 'Assigned', className: 'bg-sky-50 text-sky-700' },
  driver_en_route: { label: 'Driver en route', className: 'bg-sky-50 text-sky-700' },
  arrived: { label: 'Driver arrived', className: 'bg-cyan-50 text-cyan-700' },
  loading: { label: 'Loading', className: 'bg-cyan-50 text-cyan-700' },
  picked_up: { label: 'Picked up', className: 'bg-indigo-50 text-indigo-700' },
  in_transit: { label: 'In transit', className: 'bg-trust-50 text-trust-700' },
  delivered: { label: 'Delivered', className: 'bg-emerald-50 text-emerald-700' },
  completed: { label: 'Completed', className: 'bg-emerald-50 text-emerald-700' },
  cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-700' },
  disputed: { label: 'Disputed', className: 'bg-red-50 text-red-700' },
};

export default function ClientOrdersList({ orders }: { orders: OrderRow[] }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return orders;
    return orders.filter((order) => {
      const haystack = [
        order.id,
        order.pickup_address,
        order.dropoff_address,
        order.goods_description,
        STATUS[order.status]?.label ?? order.status,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [orders, query]);

  return (
    <div className="rounded-[26px] border border-[#C2E4D2] bg-white shadow-[0_16px_45px_rgba(31,95,63,.10)]">
      <div className="flex flex-col gap-3 border-b border-[#E8F5EE] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="font-black">Order history</h2>
          <p className="mt-1 text-sm text-[#6b7280]">
            {filtered.length === orders.length
              ? `${orders.length} total order${orders.length === 1 ? '' : 's'}`
              : `${filtered.length} of ${orders.length} order${orders.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <div className="relative">
          <ClientIcon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search orders"
            aria-label="Search orders"
            className="w-full rounded-xl border border-[#C2E4D2] bg-[#F3FAF4] py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-[#1F5F3F] focus:ring-4 focus:ring-[#E8F5EE] sm:w-64"
          />
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="p-12 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#E8F5EE] text-[#1F5F3F]">
            <ClientIcon name="package" className="h-7 w-7" />
          </span>
          <h3 className="mt-4 text-lg font-black">No orders yet</h3>
          <p className="mt-1 text-sm text-[#6b7280]">Your delivery history will appear here.</p>
        </div>
      ) : null}

      {orders.length > 0 && filtered.length === 0 ? (
        <div className="p-12 text-center">
          <h3 className="text-lg font-black">No matching orders</h3>
          <p className="mt-1 text-sm text-[#6b7280]">Try a different address, status, or order id.</p>
        </div>
      ) : null}

      <div className="divide-y divide-[#E8F5EE]">
        {filtered.map((order) => (
          <Link
            key={order.id}
            href={`/client/orders/${order.id}`}
            className="grid gap-4 px-5 py-5 transition hover:bg-[#F3FAF4] sm:grid-cols-[minmax(0,1.3fr)_minmax(220px,.8fr)_auto] sm:items-center sm:px-6"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-black">#{order.id.slice(0, 8).toUpperCase()}</p>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS[order.status].className}`}>
                  {STATUS[order.status].label}
                </span>
              </div>
              <p className="mt-1 truncate text-sm text-[#6b7280]">{order.goods_description}</p>
            </div>
            <div className="min-w-0 text-sm">
              <p className="truncate font-semibold text-[#374151]">{order.pickup_address}</p>
              <p className="my-1 text-xs text-[#d1d5db]">to</p>
              <p className="truncate font-semibold text-[#374151]">{order.dropoff_address}</p>
            </div>
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <span className="text-xs text-[#9ca3af]">{formatDate(order.created_at)}</span>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#E8F5EE] text-[#1F5F3F]">
                <ClientIcon name="arrow" className="h-4 w-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
