'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { VEHICLE_TYPE_LABELS } from '@/lib/format';

// Rough, illustrative fare bands per vehicle type so a guest gets a sense of
// price before ever creating an account. This is NOT the real fare engine —
// actual price discovery happens through driver bids once an order exists
// (see createClientOrder in lib/actions/client-orders.ts). Swap these for a
// real distance/rate lookup (e.g. a pricing Edge Function) when available.
const ESTIMATE_BANDS_KES: Record<string, [number, number]> = {
  motorcycle: [250, 600],
  tuktuk: [350, 800],
  pickup: [800, 2000],
  van: [1200, 3000],
  truck_small: [2500, 6000],
  truck_large: [5000, 15000],
};

export function GuestQuoteWidget() {
  const router = useRouter();
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [goods, setGoods] = useState('');
  const [vehicle, setVehicle] = useState('pickup');

  const estimate = useMemo(() => ESTIMATE_BANDS_KES[vehicle] ?? ESTIMATE_BANDS_KES.pickup, [vehicle]);
  const canQuote = pickup.trim().length > 0 && dropoff.trim().length > 0;

  function goToAuth(destination: '/login' | '/signup') {
    const orderParams = new URLSearchParams();
    if (pickup.trim()) orderParams.set('pickup', pickup.trim());
    if (dropoff.trim()) orderParams.set('dropoff', dropoff.trim());
    if (goods.trim()) orderParams.set('goods', goods.trim());
    if (vehicle) orderParams.set('vehicle', vehicle);

    const redirectTo = `/client/orders/new?${orderParams.toString()}`;

    const authParams = new URLSearchParams();
    authParams.set('redirectTo', redirectTo);
    authParams.set('intent', 'order');
    if (destination === '/signup') authParams.set('role', 'client');

    router.push(`${destination}?${authParams.toString()}`);
  }

  return (
    <div className="w-full rounded-2xl border border-emerald-950/10 bg-white p-5 shadow-xl shadow-emerald-950/5 sm:p-6">
      <h2 className="font-display text-lg font-bold text-slate-950">Get a quote</h2>

      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="text-xs font-semibold text-slate-700">Pickup location</span>
          <input
            value={pickup}
            onChange={(e) => setPickup(e.target.value)}
            placeholder="e.g. Westlands, Nairobi"
            className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1F5F3F] focus:ring-4 focus:ring-emerald-100"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-700">Drop-off location</span>
          <input
            value={dropoff}
            onChange={(e) => setDropoff(e.target.value)}
            placeholder="e.g. Thika Road, Ruiru"
            className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1F5F3F] focus:ring-4 focus:ring-emerald-100"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-700">
            What are you sending? <span className="font-normal text-slate-400">(optional)</span>
          </span>
          <input
            value={goods}
            onChange={(e) => setGoods(e.target.value)}
            placeholder="e.g. 3 boxes of documents"
            className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1F5F3F] focus:ring-4 focus:ring-emerald-100"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-700">Vehicle type</span>
          <select
            value={vehicle}
            onChange={(e) => setVehicle(e.target.value)}
            className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#1F5F3F] focus:ring-4 focus:ring-emerald-100"
          >
            {Object.entries(VEHICLE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
          <p className="text-xs font-semibold text-[#1F5F3F]">Estimated fare</p>
          <p className="mt-0.5 text-lg font-bold text-slate-950">
            KES {estimate[0].toLocaleString()} – {estimate[1].toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Rough range only — final price is set by driver bids once you post the order.
          </p>
        </div>

        <button
          type="button"
          disabled={!canQuote}
          onClick={() => goToAuth('/signup')}
          className="w-full rounded-xl bg-[#1F5F3F] py-3 text-sm font-semibold text-white shadow-md shadow-emerald-950/10 transition hover:bg-[#14422B] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Book this delivery →
        </button>

        <p className="text-center text-xs text-slate-500">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => goToAuth('/login')}
            className="font-semibold text-[#1F5F3F] hover:underline"
          >
            Log in to continue
          </button>
        </p>
      </div>
    </div>
  );
}
