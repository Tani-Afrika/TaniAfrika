import Link from 'next/link';

import { getPortalActor } from '@/lib/auth/portal-actor';
import ClientOrdersList from '@/components/client/ClientOrdersList';
import { ClientIcon } from '@/components/client/ClientIcons';
import type { OrderStatus } from '@/types/supabase';

export const dynamic = 'force-dynamic';

export default async function ClientOrdersPage() {
  const actor = await getPortalActor();
  if (!actor.userId || (actor.usingDemo && actor.devSession?.role !== 'client')) return null;
  const user = { id: actor.userId };
  const supabase = actor.supabase;

  const { data, error } = await supabase
    .from('orders')
    .select('id, status, pickup_address, dropoff_address, goods_description, created_at')
    .eq('client_id', user.id)
    .order('created_at', { ascending: false });

  const orders = (data ?? []) as Array<{
    id: string;
    status: OrderStatus;
    pickup_address: string;
    dropoff_address: string;
    goods_description: string;
    created_at: string;
  }>;

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[.18em] text-[#1F5F3F]">Delivery management</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-.035em] sm:text-4xl">My orders</h1>
          <p className="mt-2 text-sm text-[#6b7280]">Review, track, and manage every parcel request.</p>
        </div>
        <Link
          href="/client/orders/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1F5F3F] px-5 py-3 text-sm font-black text-white shadow-[0_12px_26px_rgba(31,95,63,.22)] transition-[background-color,transform] duration-160 ease-out hover:bg-[#14422B] active:scale-[0.97]"
        >
          <ClientIcon name="plus" className="h-4 w-4" /> Send a parcel
        </Link>
      </div>

      {error ? (
        <p className="rounded-[26px] border border-red-200 bg-red-50 p-6 text-sm text-red-600">
          Could not load your orders right now.
        </p>
      ) : (
        <ClientOrdersList orders={orders} />
      )}
    </div>
  );
}
