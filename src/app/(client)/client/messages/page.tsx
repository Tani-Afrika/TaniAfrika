import Link from 'next/link';

import { getPortalActor } from '@/lib/auth/portal-actor';
import { ClientIcon } from '@/components/client/ClientIcons';
import { formatRelativeTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

type MessageThread = {
  bidId: string;
  orderId: string;
  pickup: string;
  dropoff: string;
  driverName: string;
  preview: string;
  updatedAt: string;
};

export default async function ClientMessagesPage() {
  const actor = await getPortalActor();
  if (!actor.userId || (actor.usingDemo && actor.devSession?.role !== 'client')) {
    return null;
  }

  const supabase = actor.supabase;
  const userId = actor.userId;

  const { data: orders } = await supabase
    .from('orders')
    .select('id, pickup_address, dropoff_address, driver_id, status')
    .eq('client_id', userId)
    .order('updated_at', { ascending: false });

  const orderRows = orders ?? [];
  const orderIds = orderRows.map((order) => order.id);
  const orderById = new Map(orderRows.map((order) => [order.id, order]));

  let threads: MessageThread[] = [];

  if (orderIds.length) {
    const { data: bids } = await supabase
      .from('bids')
      .select('id, order_id, driver_id, message, status, updated_at, created_at')
      .in('order_id', orderIds)
      .in('status', ['pending', 'accepted'])
      .order('updated_at', { ascending: false });

    const bidRows = bids ?? [];
    const bidIds = bidRows.map((bid) => bid.id);
    const driverIds = [...new Set(bidRows.map((bid) => bid.driver_id).filter(Boolean))];

    const [{ data: messages }, { data: drivers }] = await Promise.all([
      bidIds.length
        ? supabase
            .from('bid_messages')
            .select('id, bid_id, message, created_at')
            .in('bid_id', bidIds)
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: [] as Array<{ id: string; bid_id: string; message: string; created_at: string }> }),
      driverIds.length
        ? supabase.from('profiles_public').select('id, full_name').in('id', driverIds)
        : Promise.resolve({ data: [] as Array<{ id: string; full_name: string }> }),
    ]);

    const latestByBid = new Map<string, { message: string; created_at: string }>();
    for (const message of messages ?? []) {
      if (!latestByBid.has(message.bid_id)) {
        latestByBid.set(message.bid_id, {
          message: message.message,
          created_at: message.created_at,
        });
      }
    }

    const driverNameById = new Map((drivers ?? []).map((driver) => [driver.id, driver.full_name]));

    threads = bidRows
      .map((bid) => {
        const order = orderById.get(bid.order_id);
        if (!order) return null;
        const latest = latestByBid.get(bid.id);
        // Keep threads that have chat activity, an opening bid note, or an accepted driver.
        if (!latest && !bid.message && bid.status !== 'accepted') return null;
        return {
          bidId: bid.id,
          orderId: bid.order_id,
          pickup: order.pickup_address,
          dropoff: order.dropoff_address,
          driverName: driverNameById.get(bid.driver_id) ?? 'Driver',
          preview: latest?.message ?? bid.message ?? 'Open conversation on this order',
          updatedAt: latest?.created_at ?? bid.updated_at ?? bid.created_at,
        } satisfies MessageThread;
      })
      .filter((thread): thread is MessageThread => Boolean(thread))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[.18em] text-[#1F5F3F]">Communication</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-.035em] sm:text-4xl">Messages</h1>
        <p className="mt-2 text-sm text-[#6b7280]">
          Bid and delivery conversations live here. Open a thread to continue on the order page.
        </p>
      </div>

      <div className="grid min-h-[620px] overflow-hidden rounded-[28px] border border-[#C2E4D2] bg-white shadow-[0_16px_45px_rgba(31,95,63,.10)] lg:grid-cols-[360px_1fr]">
        <aside className="border-b border-[#C2E4D2] lg:border-b-0 lg:border-r">
          <div className="border-b border-[#E8F5EE] p-4">
            <div className="rounded-2xl bg-[#E8F5EE] p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#1F5F3F] text-white">
                  <ClientIcon name="support" className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-black">TaniAfrika Support</p>
                  <p className="text-xs text-[#6b7280]">We are here to help.</p>
                </div>
              </div>
            </div>
          </div>

          {threads.length ? (
            <div className="divide-y divide-[#E8F5EE]">
              {threads.map((thread) => (
                <Link
                  key={thread.bidId}
                  href={`/client/orders/${thread.orderId}`}
                  className="block px-4 py-4 transition hover:bg-[#F3FAF4]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-[#14422B]">{thread.driverName}</p>
                      <p className="mt-0.5 truncate text-xs text-[#6b7280]">
                        {thread.pickup} → {thread.dropoff}
                      </p>
                      <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-[#374151]">{thread.preview}</p>
                    </div>
                    <span className="shrink-0 text-[10px] font-semibold text-[#9ca3af]">
                      {formatRelativeTime(thread.updatedAt)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-sm font-semibold text-[#374151]">No conversations yet</p>
              <p className="mt-1 text-xs leading-5 text-[#6b7280]">
                When drivers bid or are assigned, their threads appear here.
              </p>
            </div>
          )}
        </aside>

        <section className="grid place-items-center bg-white p-8 text-center">
          <div className="max-w-sm">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] bg-[#E8F5EE] text-[#1F5F3F]">
              <ClientIcon name="message" className="h-8 w-8" />
            </span>
            <h2 className="mt-5 text-xl font-black">
              {threads.length ? 'Select a conversation' : 'Your conversations will appear here'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#6b7280]">
              {threads.length
                ? 'Open a thread from the list to continue chatting on the order page.'
                : 'Message drivers from an order once bids arrive, then return here to find them quickly.'}
            </p>
            {!threads.length ? (
              <Link
                href="/client/orders/new"
                className="mt-5 inline-flex items-center justify-center rounded-xl bg-[#1F5F3F] px-5 py-3 text-sm font-black text-white transition hover:bg-[#14422B]"
              >
                Send a parcel
              </Link>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
