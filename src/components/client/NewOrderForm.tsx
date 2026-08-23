'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState, useTransition } from 'react';

import {
  createClientOrder,
  type CreateClientOrderInput,
} from '@/lib/actions/client-orders';
import { VEHICLE_TYPE_LABELS } from '@/lib/format';

import type { PickedLocation } from './LocationPicker';

const LocationPicker = dynamic(
  () => import('./LocationPicker').then((module) => module.LocationPicker),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-[280px] place-items-center rounded-2xl border border-ink-400/15 bg-white text-sm text-ink-500 shadow-sm sm:h-[360px] lg:h-[480px]">
        Loading map…
      </div>
    ),
  },
);

type FieldErrors = Partial<Record<'pickupAddress' | 'dropoffAddress' | 'goodsDescription' | 'pickupPin' | 'dropoffPin', string>>;

export function NewOrderForm() {
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [goodsDescription, setGoodsDescription] = useState('');
  const [vehicleTypeRequired, setVehicleTypeRequired] = useState('');
  const [pickupLocation, setPickupLocation] = useState<PickedLocation | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<PickedLocation | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isFormComplete = useMemo(
    () =>
      Boolean(
        pickupAddress.trim() &&
          dropoffAddress.trim() &&
          goodsDescription.trim() &&
          pickupLocation &&
          dropoffLocation,
      ),
    [dropoffAddress, dropoffLocation, goodsDescription, pickupAddress, pickupLocation],
  );

  function validate(): FieldErrors {
    const nextErrors: FieldErrors = {};
    if (!pickupAddress.trim()) nextErrors.pickupAddress = 'Enter the pickup address.';
    if (!dropoffAddress.trim()) nextErrors.dropoffAddress = 'Enter the drop-off address.';
    if (!goodsDescription.trim()) nextErrors.goodsDescription = 'Describe the parcel or goods.';
    if (!pickupLocation) nextErrors.pickupPin = 'Place the pickup pin on the map.';
    if (!dropoffLocation) nextErrors.dropoffPin = 'Place the drop-off pin on the map.';
    return nextErrors;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !pickupLocation || !dropoffLocation) return;

    const input: CreateClientOrderInput = {
      pickupAddress,
      pickupLat: pickupLocation.lat,
      pickupLng: pickupLocation.lng,
      dropoffAddress,
      dropoffLat: dropoffLocation.lat,
      dropoffLng: dropoffLocation.lng,
      goodsDescription,
      vehicleTypeRequired: vehicleTypeRequired || null,
    };

    startTransition(async () => {
      const result = await createClientOrder(input);
      if (!result.ok) setServerError(result.error);
    });
  }

  const inputClassName =
    'w-full rounded-lg border border-ink-400/30 bg-white px-3.5 py-3 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-orange-600 focus:ring-2 focus:ring-orange-100';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {serverError ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {serverError}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(440px,1.08fr)] lg:items-start">
        <section className="rounded-2xl border border-ink-400/15 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-6">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">Order details</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink-900">Where should we deliver?</h2>
            <p className="mt-2 text-sm leading-6 text-ink-600">
              Add the route, parcel information, and the vehicle type you prefer. Drivers will send competitive bids.
            </p>
          </div>

          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink-700">Pickup address</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-600">●</span>
                <input
                  value={pickupAddress}
                  onChange={(event) => {
                    setPickupAddress(event.target.value);
                    setErrors((current) => ({ ...current, pickupAddress: undefined }));
                  }}
                  className={`${inputClassName} pl-9`}
                  placeholder="e.g. Westlands, Ojijo Road"
                  autoComplete="street-address"
                />
              </div>
              {errors.pickupAddress ? <p className="mt-2 text-xs text-red-700">{errors.pickupAddress}</p> : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink-700">Drop-off address</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-600">●</span>
                <input
                  value={dropoffAddress}
                  onChange={(event) => {
                    setDropoffAddress(event.target.value);
                    setErrors((current) => ({ ...current, dropoffAddress: undefined }));
                  }}
                  className={`${inputClassName} pl-9`}
                  placeholder="e.g. Nyali, Links Road"
                />
              </div>
              {errors.dropoffAddress ? <p className="mt-2 text-xs text-red-700">{errors.dropoffAddress}</p> : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink-700">What are you sending?</span>
              <textarea
                value={goodsDescription}
                onChange={(event) => {
                  setGoodsDescription(event.target.value);
                  setErrors((current) => ({ ...current, goodsDescription: undefined }));
                }}
                className={`${inputClassName} min-h-32 resize-y`}
                placeholder="Describe the parcel, quantity, approximate size, and handling needs."
              />
              {errors.goodsDescription ? <p className="mt-2 text-xs text-red-700">{errors.goodsDescription}</p> : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink-700">
                Preferred vehicle <span className="font-normal text-ink-400">(optional)</span>
              </span>
              <select
                value={vehicleTypeRequired}
                onChange={(event) => setVehicleTypeRequired(event.target.value)}
                className={inputClassName}
              >
                <option value="">Let drivers choose</option>
                {Object.entries(VEHICLE_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-6 rounded-xl border border-orange-100 bg-orange-50/70 p-4">
            <p className="text-sm font-semibold text-orange-700">How bidding works</p>
            <p className="mt-1 text-xs leading-5 text-ink-600">
              Your order becomes visible to approved drivers. Review their price and profile before accepting one bid.
            </p>
          </div>
        </section>

        <div className="space-y-6">
          <div>
            <LocationPicker
              label="Pickup pin"
              value={pickupLocation}
              onChange={(location) => {
                setPickupLocation(location);
                setErrors((current) => ({ ...current, pickupPin: undefined }));
              }}
            />
            {errors.pickupPin ? (
              <p className="mt-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">{errors.pickupPin}</p>
            ) : null}
          </div>

          <div>
            <LocationPicker
              label="Drop-off pin"
              value={dropoffLocation}
              onChange={(location) => {
                setDropoffLocation(location);
                setErrors((current) => ({ ...current, dropoffPin: undefined }));
              }}
            />
            {errors.dropoffPin ? (
              <p className="mt-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">{errors.dropoffPin}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="sticky bottom-3 z-20 rounded-2xl border border-ink-400/15 bg-white/95 p-3 shadow-[0_18px_50px_rgba(25,25,25,0.16)] backdrop-blur sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-4">
        <div className="mb-3 sm:mb-0">
          <p className="text-sm font-semibold text-ink-900">Ready to find drivers?</p>
          <p className="mt-0.5 text-xs text-ink-500">
            {isFormComplete ? 'Everything required is complete.' : 'Complete all required fields and place both pins.'}
          </p>
        </div>
        <button
          type="submit"
          disabled={!isFormComplete || isPending}
          className="w-full rounded-lg bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-48"
        >
          {isPending ? 'Posting order…' : 'Find Drivers'}
        </button>
      </div>
    </form>
  );
}
