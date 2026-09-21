'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateDriverOrderStatus } from '@/lib/actions/driver-orders';
import type { OrderStatus } from '@/types/supabase';

type DriverProgressStatus = Extract<
  OrderStatus,
  'driver_en_route' | 'arrived' | 'loading' | 'picked_up' | 'in_transit' | 'delivered'
>;

const NEXT: Partial<Record<OrderStatus, { status: DriverProgressStatus; label: string; helper: string }>> = {
  assigned: { status: 'driver_en_route', label: 'Start journey to pickup', helper: 'Let the customer know you are on the way.' },
  driver_en_route: { status: 'arrived', label: 'Confirm arrival', helper: 'Confirm only after reaching the pickup point.' },
  arrived: { status: 'loading', label: 'Start loading', helper: 'Use this step while the goods are being checked and loaded.' },
  loading: { status: 'picked_up', label: 'Confirm pickup', helper: 'Confirm after the goods are secured in the vehicle.' },
  picked_up: { status: 'in_transit', label: 'Start delivery', helper: 'This is manual until automatic movement detection is enabled.' },
  in_transit: { status: 'delivered', label: 'Mark as delivered', helper: 'Confirm that the parcel reached the recipient safely.' },
};

export default function DeliveryStatusControls({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const config = NEXT[status];
  const router = useRouter();
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  if (!config) return null;

  return (
    <div className="rounded-2xl border border-trust/20 bg-trust-light/30 p-4">
      <p className="text-sm font-semibold text-slate-950">Next delivery step</p>
      <p className="mt-1 text-xs leading-5 text-slate-600">{config.helper}</p>
      {error ? <p className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p> : null}
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setError('');
          startTransition(async () => {
            const result = await updateDriverOrderStatus(orderId, config.status);
            if (!result.success) setError(result.error ?? 'Could not update delivery.');
            else router.refresh();
          });
        }}
        className="mt-3.5 w-full rounded-xl bg-trust px-4 py-3 text-sm font-semibold text-white shadow-md shadow-trust/20 transition hover:bg-trust-deep disabled:opacity-60 native-press"
      >
        {isPending ? 'Updating…' : config.label}
      </button>
    </div>
  );
}
