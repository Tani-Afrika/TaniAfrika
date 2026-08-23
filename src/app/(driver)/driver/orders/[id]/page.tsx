import Link from 'next/link';
import { notFound } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import { formatCurrency, formatDate, formatRelativeTime, VEHICLE_TYPE_LABELS } from '@/lib/format';
import { getDriverOrderDetail } from '@/lib/actions/driver-orders';
import { BidForm, WithdrawBidButton } from '@/components/driver/BidForm';
import DeliveryStatusControls from '@/components/driver/DeliveryStatusControls';
import DriverMessageComposer from '@/components/driver/DriverMessageComposer';
import DriverLocationTracker from '@/components/driver/DriverLocationTracker';
import { CalendarIcon, MapPinIcon, MessageIcon, PhoneIcon, RouteIcon, TruckIcon, UserIcon } from '@/components/driver/DriverIcons';
import type { OrderStatus, VehicleType } from '@/types/supabase';

export const dynamic = 'force-dynamic';

export default async function DriverOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getDriverOrderDetail(id);
  if (!detail) notFound();
  const { order, ownBid, client, history, messages, currentUserId } = detail;
  const assignedToMe = order.driver_id === currentUserId;
  const active = assignedToMe && ['assigned', 'driver_en_route', 'arrived', 'loading', 'picked_up', 'in_transit'].includes(order.status);

  return (
    <div className="mx-auto max-w-[1450px]">
      <div className="mb-5 flex items-center gap-3">
        <Link
          href="/driver/orders"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-orange-100 bg-white text-slate-700 transition hover:bg-orange-50"
        >
          ←
        </Link>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-orange-600">
            Delivery details
          </p>
          <h1 className="font-display text-2xl font-bold text-slate-950 sm:text-3xl">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </h1>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,.9fr)]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs text-slate-400">Posted {formatDate(order.created_at)}</p>
                <h2 className="mt-1 text-lg font-bold text-slate-950">Delivery route</h2>
              </div>
              <StatusBadge kind="order" status={order.status as OrderStatus} />
            </div>

            <div className="mt-5 rounded-2xl bg-orange-50/60 p-4">
              <div className="flex gap-3.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                  <MapPinIcon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.06em] text-slate-400">
                    Pickup location
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">{order.pickup_address}</p>
                </div>
              </div>

              <div className="ml-[18px] h-6 border-l border-dashed border-orange-300" />

              <div className="flex gap-3.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-orange-100 text-orange-600">
                  <MapPinIcon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.06em] text-slate-400">
                    Drop-off location
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">{order.dropoff_address}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Info icon={TruckIcon} label="Parcel" value={order.goods_description} />
              <Info
                icon={RouteIcon}
                label="Vehicle"
                value={
                  order.vehicle_type_required
                    ? VEHICLE_TYPE_LABELS[order.vehicle_type_required as VehicleType]
                    : 'Any vehicle'
                }
              />
              <Info
                icon={CalendarIcon}
                label="Agreed price"
                value={order.price_agreed ? formatCurrency(Number(order.price_agreed)) : 'Pending bid'}
              />
            </div>
          </section>

          {client ? (
            <section className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-base font-bold text-slate-950">Customer</h2>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-orange-50 font-bold text-orange-600">
                  {client.avatar_url ? (
                    <img src={client.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <UserIcon className="h-6 w-6" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-950">{client.full_name}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Contact details are shown only after assignment.
                  </p>
                </div>
                {client.phone ? (
                  <a
                    href={`tel:${client.phone}`}
                    className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-orange-100 px-4 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
                  >
                    <PhoneIcon className="h-4 w-4" />
                    Call customer
                  </a>
                ) : null}
              </div>
            </section>
          ) : null}

          {ownBid ? (
            <section className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-950">Bid conversation</h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Messages remain private between you and this customer.
                  </p>
                </div>
                <StatusBadge kind="bid" status={ownBid.status} />
              </div>

              <div className="mt-4 max-h-[420px] space-y-2.5 overflow-y-auto rounded-2xl bg-orange-50/40 p-4">
                {messages.length ? (
                  messages.map((m: { id: string; sender_id: string; message: string; created_at: string }) => {
                    const mine = m.sender_id === currentUserId;
                    return (
                      <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm ${
                            mine ? 'bg-orange-600 text-white' : 'bg-white text-slate-800 shadow-sm'
                          }`}
                        >
                          <p>{m.message}</p>
                          <p className={`mt-1 text-[10px] ${mine ? 'text-white/70' : 'text-slate-400'}`}>
                            {formatRelativeTime(m.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="py-8 text-center text-sm text-slate-400">No messages yet.</p>
                )}
              </div>

              <div className="mt-4">
                <DriverMessageComposer bidId={ownBid.id} orderId={order.id} />
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-5 xl:sticky xl:top-[106px] xl:self-start">
          {order.status === 'pending' && !ownBid ? (
            <section className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-slate-950">Place your bid</h2>
              <p className="mt-1 text-sm text-slate-500">
                Choose a fair delivery fee and tell the customer when you can collect the parcel.
              </p>
              <div className="mt-4">
                <BidForm orderId={order.id} />
              </div>
            </section>
          ) : null}

          {ownBid ? (
            <section className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-orange-600">
                Your offer
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-950">
                {formatCurrency(Number(ownBid.amount))}
              </p>
              {ownBid.message ? (
                <p className="mt-3 text-sm leading-6 text-slate-500">{ownBid.message}</p>
              ) : null}
              {ownBid.status === 'pending' ? (
                <div className="mt-4">
                  <WithdrawBidButton bidId={ownBid.id} orderId={order.id} />
                </div>
              ) : null}
            </section>
          ) : null}

          {active ? (
            <section className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
              <DriverLocationTracker driverId={currentUserId} enabled={active} />
              <div className="mt-4">
                <DeliveryStatusControls orderId={order.id} status={order.status as OrderStatus} />
              </div>
            </section>
          ) : null}

          <section className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-slate-950">Status timeline</h2>
            <div className="mt-4 space-y-0">
              {history.length ? (
                history.map(
                  (
                    entry: { id: string; status: OrderStatus; created_at: string; notes: string | null },
                    index: number,
                  ) => (
                    <div key={entry.id} className="relative flex gap-3 pb-4 last:pb-0">
                      {index < history.length - 1 ? (
                        <span className="absolute left-[7px] top-4 h-full border-l border-orange-200" />
                      ) : null}
                      <span className="relative z-10 mt-1.5 h-4 w-4 rounded-full border-4 border-white bg-orange-500 shadow" />
                      <div>
                        <StatusBadge kind="order" status={entry.status} />
                        <p className="mt-1 text-xs text-slate-400">{formatDate(entry.created_at)}</p>
                        {entry.notes ? (
                          <p className="mt-1 text-xs text-slate-500">{entry.notes}</p>
                        ) : null}
                      </div>
                    </div>
                  ),
                )
              ) : (
                <p className="text-sm text-slate-400">No status updates yet.</p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof TruckIcon; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-orange-100 p-3.5">
      <Icon className="h-4 w-4 text-orange-600" />
      <p className="mt-2.5 text-[11px] uppercase tracking-[0.06em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}
