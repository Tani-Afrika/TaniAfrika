'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function DriverLocationTracker({ driverId, enabled }: { driverId: string; enabled: boolean }) {
  const [state, setState] = useState<'idle' | 'watching' | 'error'>('idle');

  useEffect(() => {
    if (!enabled || !navigator.geolocation) return;
    const supabase = createClient();

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const updatedAt = new Date().toISOString();

        const locationResult = await supabase.from('driver_locations').upsert({
          driver_id: driverId,
          latitude,
          longitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          updated_at: updatedAt,
        }, { onConflict: 'driver_id' });

        const profileResult = await supabase.from('profiles').update({
          current_lat: latitude,
          current_lng: longitude,
          location_updated_at: updatedAt,
          is_online: true,
        }).eq('id', driverId);

        if (locationResult.error || profileResult.error) setState('error');
        else setState('watching');
      },
      () => setState('error'),
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      void supabase.from('profiles').update({ is_online: false }).eq('id', driverId);
    };
  }, [driverId, enabled]);

  if (!enabled) return null;
  return (
    <div className={`rounded-xl border px-3 py-2 text-xs ${state === 'error' ? 'border-red-100 bg-red-50 text-red-700' : 'border-emerald-100 bg-emerald-50 text-emerald-700'}`}>
      {state === 'error' ? 'Location sharing is unavailable. Check browser permission and try again.' : 'Live location sharing is active while this page remains open.'}
    </div>
  );
}
