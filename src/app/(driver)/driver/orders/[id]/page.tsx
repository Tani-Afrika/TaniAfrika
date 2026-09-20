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
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/driver/orders"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-trust/40 hover:bg-trust-light/30 native-press"
        >
          ←
        </Link>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-trust">
            Delivery details
          </p>
          <h1 className="font-display text-xl font-bold text-slate-950 sm:text-2xl">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </h1>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,.9fr)]">
        <div className="space-y-4">
          <section className="native-card rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] text-slate-400">Posted {formatDate(order.created_at)}</p>
                <h2 className="mt-0.5 text-base font-bold text-slate-950">Delivery route</h2>
              </div>
              <StatusBadge kind="order" status={order.status as OrderStatus} />
            </div>

            <div className="mt-3.5 rounded-xl border border-slate-200/70 bg-paper-light p-3.5">
              <div className="flex gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-trust/10 text-trust">
                  <MapPinIcon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                    Pickup location
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-900 sm:text-sm">{order.pickup_address}</p>
                </div>
              </div>

              <div className="ml-[15px] h-5 border-l-2 border-dashed border-slate-200" />

              <div className="flex gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-800">
                  <MapPinIcon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                    Drop-off location
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-900 sm:text-sm">{order.dropoff_address}</p>
                </div>
              </div>
            </div>

            <div className="mt-3.5 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5">
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
              <div className="col-span-2 sm:col-span-1">
                <Info
                  icon={CalendarIcon}
                  label="Agreed price"
                  value={order.price_agreed ? formatCurrency(Number(order.price_agreed)) : 'Pending bid'}
                />
              </div>
            </div>
          </section>

          {client ? (
            <section className="native-card rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5">
              <h2 className="text-sm font-bold text-slate-950">Customer</h2>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-trust-light/60 font-bold text-trust">
                  {client.avatar_url ? (
                    <img src={client.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <UserIcon className="h-5 w-5" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-950">{client.full_name}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Contact details are shown only after assignment.
                  </p>
                </div>
                {client.phone ? (
                  <a
                    href={`tel:${client.phone}`}
                    className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-xl border border-trust/25 bg-trust-light/30 px-3.5 text-xs font-semibold text-trust transition hover:bg-trust-light/60 native-press"
                  >
                    <PhoneIcon className="h-3.5 w-3.5" />
                    Call customer
                  </a>
                ) : null}
              </div>
            </section>
          ) : null}

          {ownBid ? (
            <section className="native-card rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-950">Bid conversation</h2>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Messages remain private between you and this customer.
                  </p>
                </div>
                <StatusBadge kind="bid" status={ownBid.status} />
              </div>

              <div className="mt-3.5 max-h-[360px] space-y-2 overflow-y-auto rounded-xl bg-paper-light p-3">
                {messages.length ? (
                  messages.map((m: { id: string; sender_id: string; message: string; created_at: string }) => {
                    const mine = m.sender_id === currentUserId;
                    return (
                      <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs ${
                            mine ? 'bg-trust text-white shadow-xs' : 'bg-white text-slate-800 border border-slate-200/70 shadow-xs'
                          }`}
                        >
                          <p>{m.message}</p>
                          <p className={`mt-1 text-[9px] ${mine ? 'text-white/70' : 'text-slate-400'}`}>
                            {formatRelativeTime(m.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="py-6 text-center text-xs text-slate-400">No messages yet.</p>
                )}
              </div>

              <div className="mt-3">
                <DriverMessageComposer bidId={ownBid.id} orderId={order.id} />
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-[88px] xl:self-start">
          {order.status === 'pending' && !ownBid ? (
            <section className="native-card rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5">
              <h2 className="text-base font-bold text-slate-950">Place your bid</h2>
              <p className="mt-1 text-xs text-slate-500">
                Choose a fair delivery fee and tell the customer when you can collect the parcel.
              </p>
              <div className="mt-3.5">
                <BidForm orderId={order.id} />
              </div>
            </section>
          ) : null}

          {ownBid ? (
            <section className="native-card rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-trust">
                Your offer
              </p>
              <p className="mt-1.5 text-2xl font-bold text-slate-950">
                {formatCurrency(Number(ownBid.amount))}
              </p>
              {ownBid.message ? (
                <p className="mt-2 text-xs leading-5 text-slate-600">{ownBid.message}</p>
              ) : null}
              {ownBid.status === 'pending' ? (
                <div className="mt-3.5">
                  <WithdrawBidButton bidId={ownBid.id} orderId={order.id} />
                </div>
              ) : null}
            </section>
          ) : null}

          {active ? (
            <section className="native-card rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5">
              <DriverLocationTracker driverId={currentUserId} enabled={active} />
              <div className="mt-3">
                <DeliveryStatusControls orderId={order.id} status={order.status as OrderStatus} />
              </div>
            </section>
          ) : null}

          <section className="native-card rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5">
            <h2 className="text-sm font-bold text-slate-950">Status timeline</h2>
            <div className="mt-3 space-y-0">
              {history.length ? (
                history.map(
                  (
                    entry: { id: string; status: OrderStatus; created_at: string; notes: string | null },
                    index: number,
                  ) => (
                    <div key={entry.id} className="relative flex gap-3 pb-3.5 last:pb-0">
                      {index < history.length - 1 ? (
                        <span className="absolute left-[7px] top-3.5 h-full border-l border-slate-200" />
                      ) : null}
                      <span className="relative z-10 mt-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-trust shadow-xs" />
                      <div>
                        <StatusBadge kind="order" status={entry.status} />
                        <p className="mt-1 text-[11px] text-slate-400">{formatDate(entry.created_at)}</p>
                        {entry.notes ? (
                          <p className="mt-0.5 text-xs text-slate-600">{entry.notes}</p>
                        ) : null}
                      </div>
                    </div>
                  ),
                )
              ) : (
                <p className="text-xs text-slate-400">No status updates yet.</p>
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
    <div className="rounded-xl border border-slate-200/70 bg-paper-light/50 p-2.5 sm:p-3">
      <Icon className="h-3.5 w-3.5 text-trust" />
      <p className="mt-1.5 text-[10px] uppercase tracking-[0.06em] text-slate-400">{label}</p>
      <p className="mt-0.5 text-xs font-semibold text-slate-800">{value}</p>
    </div>
  );
}
