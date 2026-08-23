import { redirect } from 'next/navigation';
import { getActiveDriverOrder } from '@/lib/actions/driver-orders';
import { EmptyState, PageHeading } from '@/components/driver/DriverUI';
import { TruckIcon } from '@/components/driver/DriverIcons';

export const dynamic = 'force-dynamic';

export default async function ActiveDeliveryPage() {
  const order = await getActiveDriverOrder();

  if (order) redirect(`/driver/orders/${order.id}`);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeading
        eyebrow="Current work"
        title="Active delivery"
        description="Your accepted delivery will be shown here with live status controls."
      />

      <EmptyState
        icon={TruckIcon}
        title="No active delivery"
        description="Once a customer accepts one of your bids, the assigned order will appear here."
        href="/driver/orders"
        actionLabel="Browse deliveries"
      />
    </div>
  );
}