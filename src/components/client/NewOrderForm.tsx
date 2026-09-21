'use client';

import dynamic from 'next/dynamic';
import { Suspense, useMemo, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';

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

type ScheduleMode = 'asap' | 'scheduled';
type FieldErrors = Partial<
  Record<
    | 'pickupAddress'
    | 'dropoffAddress'
    | 'goodsDescription'
    | 'pickupPin'
    | 'dropoffPin'
    | 'scheduledFor'
    | 'photo',
    string
  >
>;

const PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

const padDatePart = (value: number) => String(value).padStart(2, '0');

const localDateTimeValue = (date: Date) =>
  `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}T${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`;

export function NewOrderForm() {
  return (
    <Suspense fallback={null}>
      <NewOrderFormInner />
    </Suspense>
  );
}

function NewOrderFormInner() {
  // Carries over the pickup/drop-off/parcel/vehicle details a guest
  // entered in the public "Get an instant quote" widget on the homepage,
  // so signing up to confirm a delivery doesn't mean retyping everything.
  const searchParams = useSearchParams();
  const [pickupAddress, setPickupAddress] = useState(searchParams.get('pickup') ?? '');
  const [dropoffAddress, setDropoffAddress] = useState(searchParams.get('dropoff') ?? '');
  const [pickupAccessNotes, setPickupAccessNotes] = useState('');
  const [goodsDescription, setGoodsDescription] = useState(searchParams.get('goods') ?? '');
  const [vehicleTypeRequired, setVehicleTypeRequired] = useState(searchParams.get('vehicle') ?? '');
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('asap');
  const [scheduledFor, setScheduledFor] = useState('');
  const [fragile, setFragile] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const arrivedFromQuote = Boolean(
    searchParams.get('pickup') || searchParams.get('dropoff'),
  );
  const [pickupLocation, setPickupLocation] = useState<PickedLocation | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<PickedLocation | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const minSchedule = localDateTimeValue(new Date());

  const isFormComplete = useMemo(
    () =>
      Boolean(
        pickupAddress.trim() &&
          dropoffAddress.trim() &&
          goodsDescription.trim() &&
          pickupLocation &&
          dropoffLocation &&
          (scheduleMode === 'asap' || scheduledFor),
      ),
    [
      dropoffAddress,
      dropoffLocation,
      goodsDescription,
      pickupAddress,
      pickupLocation,
      scheduleMode,
      scheduledFor,
    ],
  );

  const validate = (): FieldErrors => {
    const nextErrors: FieldErrors = {};
    if (!pickupAddress.trim()) nextErrors.pickupAddress = 'Enter the pickup address.';
    if (!dropoffAddress.trim()) nextErrors.dropoffAddress = 'Enter the drop-off address.';
    if (!goodsDescription.trim()) nextErrors.goodsDescription = 'Describe what you are moving.';
    if (!pickupLocation) nextErrors.pickupPin = 'Place the pickup pin on the map.';
    if (!dropoffLocation) nextErrors.dropoffPin = 'Place the drop-off pin on the map.';
    if (scheduleMode === 'scheduled') {
      if (!scheduledFor) nextErrors.scheduledFor = 'Choose a pickup date and time, or switch to as soon as possible.';
      else if (new Date(scheduledFor).getTime() < Date.now() - 60_000) {
        nextErrors.scheduledFor = 'Scheduled pickup must be in the future.';
      }
    }
    if (photo && !PHOTO_ACCEPT.split(',').includes(photo.type)) {
      nextErrors.photo = 'Photos must be JPEG, PNG, or WebP.';
    }
    if (photo && photo.size > MAX_PHOTO_BYTES) {
      nextErrors.photo = 'Photos must be 15 MB or smaller.';
    }
    return nextErrors;
  };

  const handleScheduleAsap = () => {
    setScheduleMode('asap');
    setScheduledFor('');
    setErrors((current) => ({ ...current, scheduledFor: undefined }));
  };

  const handleScheduleLater = () => {
    setScheduleMode('scheduled');
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setPhoto(file);
    setErrors((current) => ({ ...current, photo: undefined }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !pickupLocation || !dropoffLocation) return;

    const input: CreateClientOrderInput = {
      pickupAddress,
      pickupLat: pickupLocation.lat,
      pickupLng: pickupLocation.lng,
      pickupAccessNotes: pickupAccessNotes.trim() || null,
      dropoffAddress,
      dropoffLat: dropoffLocation.lat,
      dropoffLng: dropoffLocation.lng,
      goodsDescription,
      vehicleTypeRequired: vehicleTypeRequired || null,
      scheduledForIso: scheduleMode === 'scheduled' ? new Date(scheduledFor).toISOString() : null,
      fragile,
    };

    startTransition(async () => {
      const result = await createClientOrder(input, photo);
      if (!result.ok) setServerError(result.error);
    });
  };

  const inputClassName =
    'w-full rounded-lg border border-ink-400/30 bg-white px-3.5 py-3 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-trust-600 focus:ring-2 focus:ring-trust-100';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {serverError ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {serverError}
        </div>
      ) : null}

      {arrivedFromQuote ? (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-[#1F5F3F]" role="status">
          We&apos;ve carried over the route from your quote — just drop the exact pickup and drop-off pins on the map below to confirm.
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(440px,1.08fr)] lg:items-start">
        <section className="rounded-2xl border border-ink-400/15 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-6">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-trust-600">Order details</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink-900">Where should we pick up and drop off?</h2>
            <p className="mt-2 text-sm leading-6 text-ink-600">
              Add the route, what you are moving, and the truck size you need. Drivers will send competitive bids.
            </p>
          </div>

          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink-700">Pickup address</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-trust-600">●</span>
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
              <span className="mb-2 block text-sm font-medium text-ink-700">
                Landmark note <span className="font-normal text-ink-400">(optional)</span>
              </span>
              <textarea
                value={pickupAccessNotes}
                onChange={(event) => setPickupAccessNotes(event.target.value)}
                className={`${inputClassName} min-h-20 resize-y`}
                maxLength={500}
                placeholder="e.g. Blue gate next to the chemist, call on arrival"
                aria-label="Pickup landmark note"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink-700">Drop-off address</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-trust-600">●</span>
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
              <span className="mb-2 block text-sm font-medium text-ink-700">What are you moving?</span>
              <textarea
                value={goodsDescription}
                onChange={(event) => {
                  setGoodsDescription(event.target.value);
                  setErrors((current) => ({ ...current, goodsDescription: undefined }));
                }}
                className={`${inputClassName} min-h-32 resize-y`}
                placeholder="e.g. Sofa, fridge, 8 gunias of clothes. Two people will help load."
              />
              {errors.goodsDescription ? <p className="mt-2 text-xs text-red-700">{errors.goodsDescription}</p> : null}
            </label>

            <label className="flex items-start gap-3 rounded-lg border border-ink-400/20 bg-white px-3.5 py-3">
              <input
                type="checkbox"
                checked={fragile}
                onChange={(event) => setFragile(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-ink-400/40 text-trust-600 focus:ring-trust-100"
              />
              <span>
                <span className="block text-sm font-medium text-ink-700">Fragile items</span>
                <span className="mt-0.5 block text-xs text-ink-500">
                  Tick this if anything can break (glass, electronics, crockery).
                </span>
              </span>
            </label>

            <fieldset className="space-y-3">
              <legend className="mb-1 text-sm font-medium text-ink-700">When do you need the truck?</legend>
              <label className="flex items-center gap-3 text-sm text-ink-700">
                <input
                  type="radio"
                  name="schedule-mode"
                  checked={scheduleMode === 'asap'}
                  onChange={handleScheduleAsap}
                  className="h-4 w-4 border-ink-400/40 text-trust-600 focus:ring-trust-100"
                />
                As soon as possible
              </label>
              <label className="flex items-center gap-3 text-sm text-ink-700">
                <input
                  type="radio"
                  name="schedule-mode"
                  checked={scheduleMode === 'scheduled'}
                  onChange={handleScheduleLater}
                  className="h-4 w-4 border-ink-400/40 text-trust-600 focus:ring-trust-100"
                />
                Schedule for later
              </label>
              {scheduleMode === 'scheduled' ? (
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-ink-700">Pickup date and time</span>
                  <input
                    type="datetime-local"
                    value={scheduledFor}
                    min={minSchedule}
                    onChange={(event) => {
                      setScheduledFor(event.target.value);
                      setErrors((current) => ({ ...current, scheduledFor: undefined }));
                    }}
                    className={inputClassName}
                    aria-label="Scheduled pickup date and time"
                  />
                  {errors.scheduledFor ? <p className="mt-2 text-xs text-red-700">{errors.scheduledFor}</p> : null}
                </label>
              ) : null}
            </fieldset>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink-700">
                Photo of items <span className="font-normal text-ink-400">(optional)</span>
              </span>
              <input
                type="file"
                accept={PHOTO_ACCEPT}
                onChange={handlePhotoChange}
                className="block w-full text-sm text-ink-700 file:mr-3 file:rounded-lg file:border-0 file:bg-trust-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-trust-700"
                aria-label="Photo of items to move"
              />
              {photo ? <p className="mt-2 text-xs text-ink-500">{photo.name}</p> : null}
              {errors.photo ? <p className="mt-2 text-xs text-red-700">{errors.photo}</p> : null}
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

          <div className="mt-6 rounded-xl border border-trust-100 bg-trust-50/70 p-4">
            <p className="text-sm font-semibold text-trust-700">How bidding works</p>
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
          className="w-full rounded-lg bg-trust-600 px-6 py-3 text-sm font-semibold text-white transition-[background-color,transform] duration-160 ease-out hover:bg-trust-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-48"
        >
          {isPending ? 'Posting order…' : 'Find Drivers'}
        </button>
      </div>
    </form>
  );
}
