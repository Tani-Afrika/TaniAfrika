'use client';

import { useEffect, useState } from 'react';

import OrderMap from '@/components/OrderMap';
import { createClient } from '@/lib/supabase/client';

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

interface OrderTrackingMapProps {
  pickup: MapPoint;
  dropoff: MapPoint;
  driverId: string | null;
  initialDriverLocation: DriverMapPoint | null;
}

export default function OrderTrackingMap({
  pickup,
  dropoff,
  driverId,
  initialDriverLocation,
}: OrderTrackingMapProps) {
  const [driver, setDriver] = useState<DriverMapPoint | null>(initialDriverLocation);

  useEffect(() => {
    if (!driverId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`driver-location-${driverId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_locations',
          filter: `driver_id=eq.${driverId}`,
        },
        (payload) => {
          const next = payload.new as { latitude: number; longitude: number; updated_at: string } | undefined;
          if (next) {
            setDriver({ lat: next.latitude, lng: next.longitude, updatedAt: next.updated_at });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId]);

  return <OrderMap pickup={pickup} dropoff={dropoff} driver={driver} />;
}