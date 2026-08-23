import Link from 'next/link';

import { ClientIcon, type ClientIconName } from '@/components/client/ClientIcons';
import { formatDate } from '@/lib/format';
import { createClient } from '@/lib/supabase/server';
import type { OrderStatus } from '@/types/supabase';

export const dynamic = 'force-dynamic';

type ClientOrder = {
  id: string;
  status: OrderStatus;
  pickup_address: string;
  dropoff_address: string;
  created_at: string;
};

const STATUS: Record<
  OrderStatus,
  { label: string; badge: string; icon: string; iconText: string; iconName: ClientIconName }
> = {
  draft: {
    label: 'Draft',
    badge: 'bg-[#f2f4f7] text-[#475467]',
    icon: 'bg-[#f2f4f7]',
    iconText: 'text-[#667085]',
    iconName: 'package',
  },
  pending: {
    label: 'Pending',
    badge: 'bg-[#fff5df] text-[#d97706]',
    icon: 'bg-[#fff7e8]',
    iconText: 'text-[#f59e0b]',
    iconName: 'clock',
  },
  payment_pending: {
    label: 'Payment pending',
    badge: 'bg-[#fff5df] text-[#b54708]',
    icon: 'bg-[#fff7e8]',
    iconText: 'text-[#d97706]',
    iconName: 'card',
  },
  assigned: {
    label: 'Assigned',
    badge: 'bg-[#eef6ff] text-[#1570ef]',
    icon: 'bg-[#eef6ff]',
    iconText: 'text-[#1570ef]',
    iconName: 'truck',
  },
  driver_en_route: {
    label: 'Driver en route',
    badge: 'bg-[#eef6ff] text-[#1570ef]',
    icon: 'bg-[#eef6ff]',
    iconText: 'text-[#1570ef]',
    iconName: 'truck',
  },
  arrived: {
    label: 'Driver arrived',
    badge: 'bg-[#eef6ff] text-[#1570ef]',
    icon: 'bg-[#eef6ff]',
    iconText: 'text-[#1570ef]',
    iconName: 'pin',
  },
  loading: {
    label: 'Loading',
    badge: 'bg-[#eef6ff] text-[#1570ef]',
    icon: 'bg-[#eef6ff]',
    iconText: 'text-[#1570ef]',
    iconName: 'package',
  },
  picked_up: {
    label: 'Picked up',
    badge: 'bg-[#eef6ff] text-[#1570ef]',
    icon: 'bg-[#eef6ff]',
    iconText: 'text-[#1570ef]',
    iconName: 'truck',
  },
  in_transit: {
    label: 'In transit',
    badge: 'bg-[#eef6ff] text-[#1570ef]',
    icon: 'bg-[#eef6ff]',
    iconText: 'text-[#1570ef]',
    iconName: 'truck',
  },
  delivered: {
    label: 'Delivered',
    badge: 'bg-[#eefbe9] text-[#399918]',
    icon: 'bg-[#effbea]',
    iconText: 'text-[#41ad23]',
    iconName: 'check',
  },
  completed: {
    label: 'Completed',
    badge: 'bg-[#eefbe9] text-[#399918]',
    icon: 'bg-[#effbea]',
    iconText: 'text-[#41ad23]',
    iconName: 'check',
  },
  cancelled: {
    label: 'Cancelled',
    badge: 'bg-[#f2f4f7] text-[#475467]',
    icon: 'bg-[#fff0ef]',
    iconText: 'text-[#f04438]',
    iconName: 'support',
  },
  disputed: {
    label: 'Disputed',
    badge: 'bg-[#fff0ef] text-[#d92d20]',
    icon: 'bg-[#fff0ef]',
    iconText: 'text-[#f04438]',
    iconName: 'support',
  },
};

function RoutePreview({ order }: { order: ClientOrder | undefined }) {
  return (
    <div className="relative h-[177px] overflow-hidden rounded-2xl border border-[#f1ddd4] bg-[#fbf5f0]">
      <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(32deg,transparent_46%,#ffffff_47%,#ffffff_49%,transparent_50%),linear-gradient(145deg,transparent_47%,#efe6df_48%,#efe6df_50%,transparent_51%)] [background-size:130px_90px,170px_120px]" />
      <div className="absolute -right-5 -top-10 h-36 w-36 rounded-full bg-[#e8f4dc]" />
      <div className="absolute -bottom-16 right-24 h-28 w-36 rotate-12 rounded-full bg-[#e5f3dd]" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 620 180" fill="none" aria-hidden>
        <path
          d="M45 66C105 82 120 95 180 80C235 66 250 118 325 103C395 89 438 62 492 84C535 102 540 129 583 138"
          stroke="white"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M45 66C105 82 120 95 180 80C235 66 250 118 325 103C395 89 438 62 492 84C535 102 540 129 583 138"
          stroke="#ff5b18"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute left-[5%] top-[28%] grid h-9 w-9 place-items-center rounded-full bg-[#54b435] text-white shadow-lg ring-4 ring-white">
        <ClientIcon name="pin" className="h-5 w-5" />
      </span>
      <span className="absolute left-[34%] top-[43%] grid h-9 w-9 place-items-center rounded-lg bg-[#ff5b18] text-white shadow-lg ring-4 ring-white">
        <ClientIcon name="truck" className="h-5 w-5" />
      </span>
      <span className="absolute right-[7%] bottom-[15%] grid h-9 w-9 place-items-center rounded-full bg-[#ff5b18] text-white shadow-lg ring-4 ring-white">
        <ClientIcon name="pin" className="h-5 w-5" />
      </span>
      <span className="absolute bottom-3 left-4 max-w-[45%] truncate rounded-lg bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-[#475467] shadow-sm backdrop-blur">
        {order?.pickup_address ?? 'Pickup location'}
      </span>
    </div>
  );
}

export default async function ClientHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: orderRows, error } = await supabase
    .from('orders')
    .select('id, status, pickup_address, dropoff_address, created_at')
    .eq('client_id', user.id)
    .order('created_at', { ascending: false });

  const orders = (orderRows ?? []) as ClientOrder[];
  const recentOrders = orders.slice(0, 5);
  const trackOrder = orders.find((order) =>
    ['payment_pending', 'assigned', 'driver_en_route', 'arrived', 'loading', 'picked_up', 'in_transit', 'delivered'].includes(order.status),
  ) ?? orders[0];

  const total = orders.length;
  const inTransit = orders.filter((order) =>
    ['payment_pending', 'assigned', 'driver_en_route', 'arrived', 'loading', 'picked_up', 'in_transit', 'delivered'].includes(order.status),
  ).length;
  const delivered = orders.filter((order) => ['delivered', 'completed'].includes(order.status)).length;
  const pending = orders.filter((order) => order.status === 'pending').length;

  const stats: Array<{
    label: string;
    value: number;
    note: string;
    icon: ClientIconName;
  }> = [
    { label: 'Total orders', value: total, note: 'All time orders', icon: 'package' },
    { label: 'In transit', value: inTransit, note: 'On the way', icon: 'truck' },
    { label: 'Delivered', value: delivered, note: 'Successfully delivered', icon: 'check' },
    { label: 'Pending', value: pending, note: 'Awaiting pickup', icon: 'clock' },
  ];

  const quickActions: Array<{
    title: string;
    text: string;
    href: string;
    icon: ClientIconName;
  }> = [
    { title: 'Send a parcel', text: 'Create a new delivery', href: '/client/orders/new', icon: 'package' },
    { title: 'Find locations', text: 'Find pickup & drop-off points', href: '/client/orders/new', icon: 'pin' },
    { title: 'Get a quote', text: 'Estimate delivery cost', href: '/client/orders/new', icon: 'card' },
    { title: 'Contact support', text: "We're here to help", href: '/client/messages', icon: 'support' },
  ];

  return (
    <div className="mx-auto max-w-[1535px] space-y-7">
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <article
            key={item.label}
            className="flex min-h-[128px] items-center gap-5 rounded-2xl border border-[#f2ded5] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(76,35,18,.05)]"
          >
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#fff0e8] text-[#ff5b18]">
              <ClientIcon name={item.icon} className="h-7 w-7" />
            </span>
            <div>
              <p className="text-2xl font-black tracking-[-.03em] text-[#101828]">{item.value}</p>
              <p className="mt-1 text-sm font-semibold text-[#344054]">{item.label}</p>
              <p className="mt-1 text-xs text-[#667085]">{item.note}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1.04fr]">
        <article className="overflow-hidden rounded-2xl border border-[#f2ded5] bg-white shadow-[0_8px_24px_rgba(76,35,18,.05)]">
          <div className="flex items-center justify-between border-b border-[#f2ded5] px-6 py-5">
            <h2 className="text-lg font-bold text-[#101828]">Recent orders</h2>
            <Link href="/client/orders" className="text-sm font-semibold text-[#ff5b18] hover:text-[#e94b0b]">
              View all
            </Link>
          </div>

          {error ? (
            <p className="p-6 text-sm text-red-600">Could not load your orders. Please refresh.</p>
          ) : null}

          {!error && recentOrders.length === 0 ? (
            <div className="p-10 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#fff0e8] text-[#ff5b18]">
                <ClientIcon name="package" className="h-7 w-7" />
              </span>
              <h3 className="mt-4 font-bold text-[#101828]">No orders yet</h3>
              <p className="mt-1 text-sm text-[#667085]">Your recent deliveries will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f2ded5]">
              {recentOrders.map((order) => {
                const style = STATUS[order.status];
                return (
                  <Link
                    key={order.id}
                    href={`/client/orders/${order.id}`}
                    className="grid min-h-[76px] gap-3 px-5 py-4 transition hover:bg-[#fffaf7] sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] sm:items-center"
                  >
                    <span className={`grid h-11 w-11 place-items-center rounded-full ${style.icon} ${style.iconText}`}>
                      <ClientIcon name={style.iconName} className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#101828]">#{order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="mt-1 truncate text-xs text-[#667085]">
                        {order.pickup_address} <span className="px-1">→</span> {order.dropoff_address}
                      </p>
                    </div>
                    <span className="hidden text-xs text-[#667085] md:block">{formatDate(order.created_at)}</span>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold ${style.badge}`}>
                        {style.label}
                      </span>
                      <ClientIcon name="arrow" className="h-4 w-4 text-[#98a2b3]" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </article>

        <article className="overflow-hidden rounded-2xl border border-[#f2ded5] bg-white p-5 shadow-[0_8px_24px_rgba(76,35,18,.05)]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#101828]">Track your delivery</h2>
            <Link href="/client/orders" className="text-sm font-semibold text-[#ff5b18] hover:text-[#e94b0b]">
              Track new order
            </Link>
          </div>

          {trackOrder ? (
            <>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <p className="font-bold text-[#101828]">#{trackOrder.id.slice(0, 8).toUpperCase()}</p>
                <span className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold ${STATUS[trackOrder.status].badge}`}>
                  {STATUS[trackOrder.status].label}
                </span>
              </div>

              <div className="mt-4 grid items-center gap-3 text-sm font-semibold text-[#101828] sm:grid-cols-[auto_1fr_auto]">
                <span className="flex min-w-0 items-center gap-2 truncate">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#54b435]" />
                  <span className="truncate">{trackOrder.pickup_address}</span>
                </span>
                <span className="hidden border-t border-dashed border-[#b8c0cc] sm:block" />
                <span className="flex min-w-0 items-center justify-end gap-2 truncate">
                  <ClientIcon name="pin" className="h-5 w-5 shrink-0 text-[#ff5b18]" />
                  <span className="truncate">{trackOrder.dropoff_address}</span>
                </span>
              </div>

              <div className="mt-4">
                <RoutePreview order={trackOrder} />
              </div>

              <div className="mt-4 flex items-center gap-4 rounded-xl border border-[#f2ded5] bg-[#fff9f6] px-4 py-3.5">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-[#ff5b18] shadow-sm">
                  <ClientIcon name="clock" className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs text-[#667085]">Estimated delivery</p>
                  <p className="mt-1 text-sm font-bold text-[#101828]">Updates available in order details</p>
                </div>
              </div>

              <Link
                href={`/client/orders/${trackOrder.id}`}
                className="mt-4 flex w-full items-center justify-center rounded-xl bg-[#ff5b18] px-5 py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(255,91,24,.18)] transition hover:bg-[#ec4d0d]"
              >
                View order details
              </Link>
            </>
          ) : (
            <div className="grid min-h-[400px] place-items-center text-center">
              <div>
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#fff0e8] text-[#ff5b18]">
                  <ClientIcon name="truck" className="h-7 w-7" />
                </span>
                <h3 className="mt-4 font-bold">No delivery to track</h3>
                <p className="mt-1 text-sm text-[#667085]">Create an order to start tracking.</p>
              </div>
            </div>
          )}
        </article>
      </section>

      <section className="rounded-2xl border border-[#f2ded5] bg-white p-5 shadow-[0_8px_24px_rgba(76,35,18,.04)]">
        <h2 className="text-lg font-bold text-[#101828]">What would you like to do?</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="group flex min-h-[108px] items-center gap-4 rounded-2xl border border-[#f2ded5] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#ffcdb8] hover:shadow-[0_10px_26px_rgba(255,91,24,.08)]"
            >
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#fff0e8] text-[#ff5b18]">
                <ClientIcon name={action.icon} className="h-7 w-7" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-[#101828]">{action.title}</span>
                <span className="mt-1 block text-xs leading-5 text-[#667085]">{action.text}</span>
              </span>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#fff0e8] text-[#ff5b18] transition group-hover:bg-[#ff5b18] group-hover:text-white">
                <ClientIcon name="arrow" className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
