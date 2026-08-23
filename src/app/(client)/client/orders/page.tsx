import Link from 'next/link';

import { ClientIcon } from '@/components/client/ClientIcons';
import { formatDate } from '@/lib/format';
import { createClient } from '@/lib/supabase/server';
import type { OrderStatus } from '@/types/supabase';

export const dynamic = 'force-dynamic';

const STATUS: Record<OrderStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-slate-50 text-slate-700' },
  pending: { label: 'Finding drivers', className: 'bg-amber-50 text-amber-700' },
  payment_pending: { label: 'Awaiting payment', className: 'bg-amber-50 text-amber-700' },
  assigned: { label: 'Assigned', className: 'bg-sky-50 text-sky-700' },
  driver_en_route: { label: 'Driver en route', className: 'bg-sky-50 text-sky-700' },
  arrived: { label: 'Driver arrived', className: 'bg-cyan-50 text-cyan-700' },
  loading: { label: 'Loading', className: 'bg-cyan-50 text-cyan-700' },
  picked_up: { label: 'Picked up', className: 'bg-indigo-50 text-indigo-700' },
  in_transit: { label: 'In transit', className: 'bg-orange-50 text-orange-700' },
  delivered: { label: 'Delivered', className: 'bg-emerald-50 text-emerald-700' },
  completed: { label: 'Completed', className: 'bg-emerald-50 text-emerald-700' },
  cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-700' },
  disputed: { label: 'Disputed', className: 'bg-red-50 text-red-700' },
};

export default async function ClientOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.from('orders').select('id, status, pickup_address, dropoff_address, goods_description, created_at').eq('client_id', user.id).order('created_at', { ascending: false });
  const orders = (data ?? []) as Array<{ id: string; status: OrderStatus; pickup_address: string; dropoff_address: string; goods_description: string; created_at: string }>;

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-black uppercase tracking-[.18em] text-[#ef4d16]">Delivery management</p><h1 className="mt-2 text-3xl font-black tracking-[-.035em] sm:text-4xl">My orders</h1><p className="mt-2 text-sm text-[#6b7280]">Review, track, and manage every parcel request.</p></div><Link href="/client/orders/new" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff5a1f] px-5 py-3 text-sm font-black text-white shadow-[0_12px_26px_rgba(255,90,31,.22)]"><ClientIcon name="plus" className="h-4 w-4" /> Send a parcel</Link></div>

      <div className="rounded-[26px] border border-[#ffe0d2] bg-white shadow-[0_16px_45px_rgba(255,90,31,.10)]">
        <div className="flex flex-col gap-3 border-b border-[#ffeadf] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><h2 className="font-black">Order history</h2><p className="mt-1 text-sm text-[#6b7280]">{orders.length} total order{orders.length === 1 ? '' : 's'}</p></div><div className="relative"><ClientIcon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]"/><input placeholder="Search orders" className="w-full rounded-xl border border-[#ffd8c7] bg-[#fffaf7] py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-[#ff8a5c] focus:ring-4 focus:ring-[#fff0e8] sm:w-64" /></div></div>
        {error ? <p className="p-6 text-sm text-red-600">Could not load your orders right now.</p> : null}
        {!error && orders.length === 0 ? <div className="p-12 text-center"><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#fff0e8] text-[#ef4d16]"><ClientIcon name="package" className="h-7 w-7" /></span><h3 className="mt-4 text-lg font-black">No orders yet</h3><p className="mt-1 text-sm text-[#6b7280]">Your delivery history will appear here.</p></div> : null}
        <div className="divide-y divide-[#fff0e8]">
          {orders.map((order) => (
            <Link key={order.id} href={`/client/orders/${order.id}`} className="grid gap-4 px-5 py-5 transition hover:bg-[#fffaf7] sm:grid-cols-[minmax(0,1.3fr)_minmax(220px,.8fr)_auto] sm:items-center sm:px-6">
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-black">#{order.id.slice(0, 8).toUpperCase()}</p><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS[order.status].className}`}>{STATUS[order.status].label}</span></div><p className="mt-1 truncate text-sm text-[#6b7280]">{order.goods_description}</p></div>
              <div className="min-w-0 text-sm"><p className="truncate font-semibold text-[#374151]">{order.pickup_address}</p><p className="my-1 text-xs text-[#d1d5db]">to</p><p className="truncate font-semibold text-[#374151]">{order.dropoff_address}</p></div>
              <div className="flex items-center justify-between gap-3 sm:justify-end"><span className="text-xs text-[#9ca3af]">{formatDate(order.created_at)}</span><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#fff0e8] text-[#ef4d16]"><ClientIcon name="arrow" className="h-4 w-4" /></span></div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
