'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { placeDriverBid, withdrawDriverBid } from '@/lib/actions/driver-orders';
import { VEHICLE_TYPE_LABELS } from '@/lib/format';
import type { VehicleType } from '@/types/supabase';

export type BidVehicleOption = {
  id: string;
  plate_number: string;
  vehicle_type: VehicleType;
  make: string | null;
  model: string | null;
};

function defaultPickupLocalValue() {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  date.setMinutes(Math.ceil(date.getMinutes() / 5) * 5, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function BidForm({
  orderId,
  vehicles,
}: {
  orderId: string;
  vehicles: BidVehicleOption[];
}) {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? '');
  const [estimatedPickupAt, setEstimatedPickupAt] = useState(defaultPickupLocalValue);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const vehicleLabel = useMemo(() => {
    return (vehicle: BidVehicleOption) => {
      const typeLabel = VEHICLE_TYPE_LABELS[vehicle.vehicle_type] ?? vehicle.vehicle_type;
      const name = [vehicle.make, vehicle.model].filter(Boolean).join(' ');
      return name
        ? `${typeLabel} · ${vehicle.plate_number} · ${name}`
        : `${typeLabel} · ${vehicle.plate_number}`;
    };
  }, []);

  if (!vehicles.length) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-5 text-amber-900">
        You need at least one verified, active vehicle before you can bid. Finish vehicle verification in your profile.
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setError('');
        startTransition(async () => {
          const result = await placeDriverBid({
            orderId,
            amount: Number(amount),
            message,
            vehicleId,
            estimatedPickupAt: new Date(estimatedPickupAt).toISOString(),
          });
          if (!result.success) {
            setError(result.error ?? 'Could not submit bid.');
            return;
          }
          router.refresh();
        });
      }}
      className="space-y-4"
    >
      <label className="block">
        <span className="text-xs font-semibold text-slate-800">Vehicle for this delivery</span>
        <select
          value={vehicleId}
          onChange={(event) => setVehicleId(event.target.value)}
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-trust focus:ring-4 focus:ring-trust/15"
          required
        >
          {vehicles.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicleLabel(vehicle)}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-xs font-semibold text-slate-800">Your delivery fee (KES)</span>
        <input
          type="number"
          min="1"
          step="1"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="e.g. 1,450"
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-trust focus:ring-4 focus:ring-trust/15"
          required
        />
        <div className="mt-2 flex items-center gap-1.5">
          <span className="text-[10px] font-medium text-slate-400">Quick add:</span>
          {[500, 1000, 1500, 2500].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                const current = Number(amount) || 0;
                setAmount(String(current + preset));
              }}
              className="native-press rounded-lg border border-slate-200 bg-paper-light px-2 py-1 text-[11px] font-semibold text-trust hover:border-trust/40 hover:bg-trust-light/40"
            >
              +{preset.toLocaleString()}
            </button>
          ))}
          {amount ? (
            <button
              type="button"
              onClick={() => setAmount('')}
              className="ml-auto text-[10px] text-slate-400 underline hover:text-slate-600"
            >
              Clear
            </button>
          ) : null}
        </div>
      </label>

      <label className="block">
        <span className="text-xs font-semibold text-slate-800">Estimated pickup time</span>
        <input
          type="datetime-local"
          value={estimatedPickupAt}
          onChange={(event) => setEstimatedPickupAt(event.target.value)}
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-trust focus:ring-4 focus:ring-trust/15"
          required
        />
      </label>

      <label className="block">
        <span className="text-xs font-semibold text-slate-800">
          Message to customer <span className="font-normal text-slate-400">(optional)</span>
        </span>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={3}
          placeholder="Confirm access notes, helpers, or anything the customer should know."
          className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-trust focus:ring-4 focus:ring-trust/15"
        />
      </label>
      {error ? <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={isPending || !amount || !vehicleId || !estimatedPickupAt}
        className="w-full rounded-xl bg-trust px-4 py-3 text-sm font-semibold text-white shadow-md shadow-trust/20 transition hover:bg-trust-deep disabled:cursor-not-allowed disabled:opacity-60 native-press"
      >
        {isPending ? 'Submitting bid…' : 'Submit bid'}
      </button>
    </form>
  );
}

export function WithdrawBidButton({ bidId, orderId }: { bidId: string; orderId: string }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setError('');
          startTransition(async () => {
            const result = await withdrawDriverBid(bidId, orderId);
            if (!result.success) setError(result.error ?? 'Could not withdraw bid.');
            else router.refresh();
          });
        }}
        className="min-h-11 rounded-xl border border-red-100 bg-white px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
      >
        {isPending ? 'Withdrawing…' : 'Withdraw bid'}
      </button>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
