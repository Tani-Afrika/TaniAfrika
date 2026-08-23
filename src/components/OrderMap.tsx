'use client';

import dynamic from 'next/dynamic';

interface MapPoint {
  lat: number;
  lng: number;
  label: string;
}

interface DriverMapPoint {
  lat: number;
  lng: number;
  updatedAt: string;
}

interface OrderMapProps {
  pickup: MapPoint;
  dropoff: MapPoint;
  driver: DriverMapPoint | null;
}

const LiveOrderMap = dynamic(
  () => import('./LiveOrderMap'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-72 items-center justify-center bg-ink-200/30 sm:h-80 lg:h-[380px]">
        <div className="text-center">
          <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-ink-200 border-t-maroon-600" />

          <p className="mt-3 text-sm text-ink-400">
            Loading order map...
          </p>
        </div>
      </div>
    ),
  }
);

export default function OrderMap({
  pickup,
  dropoff,
  driver,
}: OrderMapProps) {
  const hasValidCoordinates =
    Number.isFinite(pickup.lat) &&
    Number.isFinite(pickup.lng) &&
    Number.isFinite(dropoff.lat) &&
    Number.isFinite(dropoff.lng);

  if (!hasValidCoordinates) {
    return (
      <section className="surface p-5">
        <h2 className="font-display font-semibold text-ink-900">
          Order map
        </h2>

        <p className="mt-2 text-sm text-ink-400">
          This order does not contain valid location
          coordinates.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden surface">
      <div className="border-b border-ink-200 px-4 py-4 sm:px-5">
        <h2 className="font-display font-semibold text-ink-900">
          Order map
        </h2>

        <p className="mt-0.5 text-xs text-ink-400">
          Green shows the pickup, red shows the destination,
          and blue shows the latest driver location.
        </p>
      </div>

      <LiveOrderMap
        pickup={pickup}
        dropoff={dropoff}
        driver={driver}
      />
    </section>
  );
}