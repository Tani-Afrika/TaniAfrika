import Link from 'next/link';
import { notFound } from 'next/navigation';

import OrderMap from '@/components/OrderMap';
import StatusBadge from '@/components/StatusBadge';
import {
  formatCurrency,
  formatDate,
  VEHICLE_TYPE_LABELS,
} from '@/lib/format';
import { getOrderById } from '@/lib/queries';
import ConfirmPaymentButton from '@/components/admin/ConfirmPaymentButton';

export const dynamic = 'force-dynamic';

interface OrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const { id } = await params;

  let data: Awaited<ReturnType<typeof getOrderById>>;

  try {
    data = await getOrderById(id);
  } catch {
    notFound();
  }

  const {
    order,
    bids,
    history,
    driverLocation,
  } = data;

  if (!order) {
    notFound();
  }

  const driverMapLocation = driverLocation
    ? {
        lat: driverLocation.latitude,
        lng: driverLocation.longitude,
        updatedAt: driverLocation.updated_at,
      }
    : null;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1 rounded-md text-sm font-semibold text-trust hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-trust/20"
          >
            <span aria-hidden="true">←</span>
            Back to orders
          </Link>

          <h1 className="mt-2 font-display text-2xl font-semibold text-ink-900">
            Order details
          </h1>

          <p className="mt-1 break-all text-xs text-ink-400">
            Order ID: {order.id}
          </p>
        </div>

        <StatusBadge
          kind="order"
          status={order.status}
        />
      </header>

      {order.status === 'payment_pending' && (
        <ConfirmPaymentButton orderId={order.id} />
      )}

      <div className="grid gap-5 xl:grid-cols-3">
        <section className="space-y-5 xl:col-span-2">
          <article className="surface p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display font-semibold text-ink-900">
                Route and shipment
              </h2>

              <p className="text-sm font-bold text-trust">
                {formatCurrency(order.price_agreed)}
              </p>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <InfoItem
                label="Pickup location"
                value={order.pickup_address}
              />

              <InfoItem
                label="Drop-off location"
                value={order.dropoff_address}
              />

              <InfoItem
                label="Goods description"
                value={
                  order.goods_description ||
                  'No goods description provided'
                }
              />

              <InfoItem
                label="Required vehicle"
                value={
                  order.vehicle_type_required
                    ? VEHICLE_TYPE_LABELS[
                        order.vehicle_type_required
                      ]
                    : 'Not specified'
                }
              />

              <InfoItem
                label="Agreed price"
                value={formatCurrency(order.price_agreed)}
              />

              <InfoItem
                label="Created"
                value={formatDate(order.created_at)}
              />

              <InfoItem
                label="Picked up"
                value={formatDate(order.picked_up_at)}
              />

              <InfoItem
                label="Delivered"
                value={formatDate(order.delivered_at)}
              />
            </div>

            {order.cancellation_reason && (
              <div className="mt-5 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                <strong>Cancellation reason:</strong>{' '}
                {order.cancellation_reason}
              </div>
            )}
          </article>

          <OrderMap
            pickup={{
              lat: order.pickup_lat,
              lng: order.pickup_lng,
              label: order.pickup_address,
            }}
            dropoff={{
              lat: order.dropoff_lat,
              lng: order.dropoff_lng,
              label: order.dropoff_address,
            }}
            driver={driverMapLocation}
          />

          <article className="surface p-4 sm:p-5">
            <h2 className="font-display font-semibold text-ink-900">
              Status history
            </h2>

            {history.length > 0 ? (
              <ol className="mt-5 space-y-0">
                {history.map((historyItem, index) => {
                  const isLast =
                    index === history.length - 1;

                  return (
                    <li
                      key={historyItem.id}
                      className="flex gap-3"
                    >
                      <div className="flex flex-col items-center">
                        <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full border-2 border-white bg-trust ring-2 ring-trust/20" />

                        {!isLast && (
                          <span className="min-h-12 w-px flex-1 bg-ink-200" />
                        )}
                      </div>

                      <div className="pb-5">
                        <p className="text-sm font-semibold capitalize text-ink-900">
                          {historyItem.status.replaceAll(
                            '_',
                            ' '
                          )}
                        </p>

                        <p className="mt-0.5 text-xs text-ink-400">
                          {formatDate(
                            historyItem.created_at
                          )}
                        </p>

                        {historyItem.notes && (
                          <p className="mt-2 text-sm leading-6 text-ink-600">
                            {historyItem.notes}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="mt-4 text-sm text-ink-400">
                No status history has been recorded.
              </p>
            )}
          </article>
        </section>

        <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
          <article className="surface p-4 sm:p-5">
            <h2 className="font-display font-semibold text-ink-900">
              Client and driver
            </h2>

            <div className="mt-5 space-y-5">
              <InfoItem
                label="Client"
                value={
                  order.client?.full_name ??
                  'Unknown client'
                }
              />

              <InfoItem
                label="Client phone"
                value={
                  order.client?.phone ??
                  'No phone provided'
                }
              />

              <div className="border-t border-ink-200 pt-5">
                <InfoItem
                  label="Assigned driver"
                  value={
                    order.driver?.full_name ??
                    'No driver assigned'
                  }
                />
              </div>

              <InfoItem
                label="Driver phone"
                value={
                  order.driver?.phone ??
                  'No phone provided'
                }
              />

              {driverLocation && (
                <>
                  <InfoItem
                    label="Last driver location update"
                    value={formatDate(
                      driverLocation.updated_at
                    )}
                  />

                  <InfoItem
                    label="Current speed"
                    value={
                      driverLocation.speed !== null
                        ? `${Math.round(
                            driverLocation.speed
                          )} km/h`
                        : 'Not available'
                    }
                  />
                </>
              )}
            </div>
          </article>

          <article className="surface p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display font-semibold text-ink-900">
                Driver bids
              </h2>

              <span className="rounded-full bg-ink-900/[0.04] px-2.5 py-1 text-xs font-semibold text-ink-600">
                {bids.length}
              </span>
            </div>

            <div className="mt-4 space-y-2.5">
              {bids.map((bid) => {
                const driverInitial = (bid.driver?.full_name ?? '?').trim().charAt(0).toUpperCase();

                return (
                  <div
                    key={bid.id}
                    className="rounded-lg border border-ink-200 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-trust-light/60 text-xs font-semibold text-trust">
                          {driverInitial}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ink-900">
                            {bid.driver?.full_name ?? 'Unknown driver'}
                          </p>
                          <p className="truncate text-xs text-ink-400">
                            {bid.driver?.phone ?? 'No phone provided'}
                          </p>
                        </div>
                      </div>

                      <StatusBadge kind="bid" status={bid.status} />
                    </div>

                    <div className="mt-2.5 flex items-center justify-between gap-3">
                      <p className="font-display text-base font-bold text-trust">
                        {formatCurrency(bid.amount)}
                      </p>
                      <p className="text-xs text-ink-400">
                        {formatDate(bid.created_at)}
                      </p>
                    </div>

                    {bid.message && (
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-ink-600">
                        {bid.message}
                      </p>
                    )}
                  </div>
                );
              })}

              {bids.length === 0 && (
                <div className="flex flex-col items-center rounded-xl bg-ink-900/[0.02] px-4 py-8 text-center">
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-trust-light/60 text-trust">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-ink-400">
                    No driver bids have been submitted.
                  </p>
                </div>
              )}
            </div>
          </article>
        </aside>
      </div>
    </div>
  );
}

interface InfoItemProps {
  label: string;
  value: string;
}

function InfoItem({
  label,
  value,
}: InfoItemProps) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm leading-6 text-ink-900">
        {value}
      </p>
    </div>
  );
}