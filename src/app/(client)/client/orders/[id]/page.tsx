import Link from 'next/link';
import { notFound } from 'next/navigation';

import StatusBadge from '@/components/StatusBadge';
import { formatCurrency, formatDate, VEHICLE_TYPE_LABELS } from '@/lib/format';
import { createClient } from '@/lib/supabase/server';
import { getClientOrderDetail } from '@/lib/actions/client-order-detail';
import type { VehicleType } from '@/types/supabase';

import BidsList from '@/components/client/BidsList';
import CancelOrderControl from '@/components/client/CancelOrderControl';
import DeliveryConfirmNotice from '@/components/client/DeliveryConfirmNotice';
import DisputeControl from '@/components/client/DisputeControl';
import OrderLiveRefresh from '@/components/client/OrderLiveRefresh';
import OrderReceipt from '@/components/client/OrderReceipt';
import PaymentHoldPanel from '@/components/client/PaymentHoldPanel';
import OrderStatusTimeline from '@/components/client/OrderStatusTimeline';
import OrderTrackingMap from '@/components/client/OrderTrackingMap';
import ReviewForm from '@/components/client/ReviewForm';
import TripStatusLine from '@/components/client/TripStatusLine';

import { getDevSession } from '@/lib/auth/dev-session';

export const dynamic = 'force-dynamic';

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

const CANCELLABLE_STATUSES = new Set(['pending', 'payment_pending']);

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;

  const devSession = await getDevSession();
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const user = devSession ? { id: devSession.id, email: devSession.email } : authUser;
  if (!user) notFound();

  const detail = await getClientOrderDetail(id);
  if (!detail) notFound();

  const { order, orderNumber, bids, history, driver, driverLocation, paymentHold, mpesaPaymentsEnabled, review } =
    detail;
  const isAssigned = Boolean(order.driver_id);
  const canCancel = CANCELLABLE_STATUSES.has(order.status);
  const isPostTrip = order.status === 'delivered' || order.status === 'completed' || order.status === 'disputed';
  const canRate = order.status === 'delivered' || order.status === 'completed';
  const orderLabel = orderNumber != null ? `Order #${orderNumber}` : `Order #${order.id.slice(0, 8)}`;

  return (
    <div>
      <OrderLiveRefresh orderId={order.id} />
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-6 flex items-center gap-4 sm:mb-8">
          <Link href="/client" aria-label="Back to client home" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gray-200 bg-white text-xl text-gray-700 shadow-sm transition hover:border-trust-200 hover:text-trust-600">
            {String.fromCharCode(8592)}
          </Link>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-trust-600">TaniAfrika delivery</p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
              Track Order
            </h1>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(440px,1.08fr)] lg:items-start">
          <div className="space-y-6">
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-trust-600">
                    {orderLabel}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">Placed {formatDate(order.created_at)}</p>
                </div>
                <StatusBadge kind="order" status={order.status} />
              </div>

              <TripStatusLine status={order.status} driverName={driver?.full_name} />

              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex gap-3">
                  <span className="mt-0.5 text-trust-600">{String.fromCharCode(9679)}</span>
                  <div>
                    <dt className="text-xs text-gray-400">Pickup</dt>
                    <dd className="text-gray-800">{order.pickup_address}</dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="mt-0.5 text-gray-800">{String.fromCharCode(9679)}</span>
                  <div>
                    <dt className="text-xs text-gray-400">Drop-off</dt>
                    <dd className="text-gray-800">{order.dropoff_address}</dd>
                  </div>
                </div>
              </dl>

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Goods</p>
                  <p className="mt-0.5 text-gray-700">{order.goods_description}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Preferred vehicle</p>
                  <p className="mt-0.5 text-gray-700">
                    {order.vehicle_type_required ? VEHICLE_TYPE_LABELS[order.vehicle_type_required] : 'Any'}
                  </p>
                </div>
                {order.price_agreed ? (
                  <div>
                    <p className="text-xs text-gray-400">Agreed price</p>
                    <p className="mt-0.5 font-semibold text-trust-600">{formatCurrency(order.price_agreed)}</p>
                  </div>
                ) : null}
              </div>

              {canCancel ? (
                <div className="mt-5 border-t border-gray-100 pt-4">
                  <CancelOrderControl orderId={order.id} />
                </div>
              ) : null}
            </section>

            {order.status === 'payment_pending' ? (
              <PaymentHoldPanel orderId={order.id} hold={paymentHold} mpesaEnabled={mpesaPaymentsEnabled} />
            ) : null}

            {order.status === 'delivered' ? <DeliveryConfirmNotice driverName={driver?.full_name ?? null} /> : null}

            {isPostTrip ? (
              <OrderReceipt
                orderNumber={orderNumber}
                pickupAddress={order.pickup_address}
                dropoffAddress={order.dropoff_address}
                hold={paymentHold}
                driverName={driver?.full_name ?? null}
              />
            ) : null}

            {canRate ? (
              <ReviewForm
                orderId={order.id}
                existingReview={review}
                orderCompleted={order.status === 'completed'}
              />
            ) : null}

            {order.status === 'delivered' ? (
              <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-trust-600">Something wrong?</p>
                <p className="mt-2 text-sm leading-6 text-ink-600">
                  Dispute only if the delivery is not what you agreed. This does not complete the trip.
                </p>
                <div className="mt-3">
                  <DisputeControl orderId={order.id} />
                </div>
              </section>
            ) : null}

            {isAssigned && driver ? (
              <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-trust-600">Your driver</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-trust-50 text-base font-semibold text-trust-600">
                    {driver.avatar_url ? (
                      <img src={driver.avatar_url} alt={driver.full_name} className="h-full w-full object-cover" />
                    ) : (
                      driver.full_name.slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{driver.full_name}</p>
                    <p className="text-xs text-gray-500">
                      {driver.vehicle_type ? VEHICLE_TYPE_LABELS[driver.vehicle_type as VehicleType] : ''}
                      {driver.plate_number ? ` ${String.fromCharCode(183)} ${driver.plate_number}` : ''}
                    </p>
                  </div>
                </div>
                {driver.phone ? (
                  <a
                    href={`tel:${driver.phone}`}
                    aria-label={`Call ${driver.full_name} at ${driver.phone}`}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3.5 py-2 text-xs font-semibold text-gray-700 transition hover:border-trust-200 hover:text-trust-600"
                  >
                    Call {driver.phone}
                  </a>
                ) : (
                  <p className="mt-4 text-xs text-gray-500">Phone number is not on file yet.</p>
                )}
              </section>
            ) : null}

            {order.status === 'pending' ? (
              <section>
                <h2 className="mb-3 text-sm font-semibold text-gray-900">Bids received</h2>
                <BidsList orderId={order.id} currentUserId={user.id} bids={bids} />
              </section>
            ) : null}

            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-trust-600">Status timeline</p>
              <OrderStatusTimeline history={history} />
            </section>
          </div>

          <div className="lg:sticky lg:top-6">
            <OrderTrackingMap
              pickup={{ lat: order.pickup_lat, lng: order.pickup_lng, label: order.pickup_address }}
              dropoff={{ lat: order.dropoff_lat, lng: order.dropoff_lng, label: order.dropoff_address }}
              driverId={order.driver_id}
              initialDriverLocation={driverLocation}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
