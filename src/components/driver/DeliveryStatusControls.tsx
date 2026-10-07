'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateDriverOrderStatus } from '@/lib/actions/driver-orders';
import type { OrderStatus } from '@/types/supabase';

type DriverProgressStatus = Extract<
  OrderStatus,
  'driver_en_route' | 'arrived' | 'loading' | 'picked_up' | 'in_transit' | 'delivered'
>;

const NEXT: Partial<
  Record<
    OrderStatus,
    {
      status: DriverProgressStatus;
      label: string;
      helper: string;
      requiresProof?: 'pickup_proof' | 'delivery_proof';
    }
  >
> = {
  assigned: {
    status: 'driver_en_route',
    label: 'Start journey to pickup',
    helper: 'Let the customer know you are on the way.',
  },
  driver_en_route: {
    status: 'arrived',
    label: 'Confirm arrival',
    helper: 'Confirm only after reaching the pickup point.',
  },
  arrived: {
    status: 'loading',
    label: 'Start loading',
    helper: 'Use this step while the goods are being checked and loaded.',
  },
  loading: {
    status: 'picked_up',
    label: 'Confirm pickup',
    helper: 'Upload a clear photo of the loaded goods, then confirm pickup.',
    requiresProof: 'pickup_proof',
  },
  picked_up: {
    status: 'in_transit',
    label: 'Start delivery',
    helper: 'This is manual until automatic movement detection is enabled.',
  },
  in_transit: {
    status: 'delivered',
    label: 'Mark as delivered',
    helper: 'Upload a delivery proof photo showing the goods at the drop-off.',
    requiresProof: 'delivery_proof',
  },
};

export default function DeliveryStatusControls({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const config = NEXT[status];
  const router = useRouter();
  const proofInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [proofName, setProofName] = useState('');
  const [isPending, startTransition] = useTransition();

  if (!config) return null;

  return (
    <div className="rounded-2xl border border-trust/20 bg-trust-light/30 p-4">
      <p className="text-sm font-semibold text-slate-950">Next delivery step</p>
      <p className="mt-1 text-xs leading-5 text-slate-600">{config.helper}</p>

      {config.requiresProof ? (
        <label className="mt-3 block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
            {config.requiresProof === 'pickup_proof' ? 'Pickup proof photo' : 'Delivery proof photo'}
          </span>
          <input
            ref={proofInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setProofName(file?.name ?? '');
              setError('');
            }}
            className="mt-1.5 block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold file:text-trust"
          />
          {proofName ? (
            <p className="mt-1.5 truncate text-[11px] text-slate-500">Selected: {proofName}</p>
          ) : null}
        </label>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
      ) : null}
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setError('');
          const proofFile = config.requiresProof ? proofInputRef.current?.files?.[0] ?? null : null;

          if (config.requiresProof && !proofFile) {
            setError(
              config.requiresProof === 'pickup_proof'
                ? 'Choose a pickup proof photo first.'
                : 'Choose a delivery proof photo first.',
            );
            return;
          }

          startTransition(async () => {
            const result = await updateDriverOrderStatus(orderId, config.status, proofFile);
            if (!result.success) {
              setError(result.error ?? 'Could not update delivery.');
              return;
            }
            setProofName('');
            if (proofInputRef.current) proofInputRef.current.value = '';
            router.refresh();
          });
        }}
        className="mt-3.5 w-full rounded-xl bg-trust px-4 py-3 text-sm font-semibold text-white shadow-md shadow-trust/20 transition hover:bg-trust-deep disabled:opacity-60 native-press"
      >
        {isPending ? 'Updating…' : config.label}
      </button>
    </div>
  );
}
