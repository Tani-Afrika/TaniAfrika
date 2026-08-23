'use client';

import 'leaflet/dist/leaflet.css';

import L, { type LatLngExpression } from 'leaflet';
import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';

export type PickedLocation = {
  lat: number;
  lng: number;
};

type LocationPickerProps = {
  value: PickedLocation | null;
  onChange: (location: PickedLocation) => void;
  label: string;
  helperText?: string;
  defaultCenter?: LatLngExpression;
};

const markerIcon = L.divIcon({
  className: '',
  html: `
    <div style="width:34px;height:34px;border-radius:9999px 9999px 9999px 0;transform:rotate(-45deg);background:#ff5a1f;border:3px solid white;box-shadow:0 8px 20px rgba(20,20,20,.22);display:grid;place-items:center">
      <div style="width:10px;height:10px;border-radius:9999px;background:white"></div>
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 32],
});

function PinDrop({ value, onChange }: Pick<LocationPickerProps, 'value' | 'onChange'>) {
  const map = useMapEvents({
    click(event) {
      onChange({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });

  useEffect(() => {
    if (value) {
      map.flyTo([value.lat, value.lng], Math.max(map.getZoom(), 14), {
        duration: 0.5,
      });
    }
  }, [map, value]);

  return value ? <Marker position={[value.lat, value.lng]} icon={markerIcon} /> : null;
}

export function LocationPicker({
  value,
  onChange,
  label,
  helperText = 'Tap the map to place the pin.',
  defaultCenter = [-1.286389, 36.817223],
}: LocationPickerProps) {
  const center = useMemo<LatLngExpression>(() => {
    return value ? [value.lat, value.lng] : defaultCenter;
  }, [defaultCenter, value]);

  return (
    <section className="overflow-hidden rounded-2xl border border-ink-400/15 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-ink-200/60 px-4 py-3 sm:px-5">
        <div>
          <h3 className="text-sm font-semibold text-ink-900">{label}</h3>
          <p className="mt-0.5 text-xs text-ink-500">{helperText}</p>
        </div>
        {value ? (
          <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
            Pin placed
          </span>
        ) : (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
            Required
          </span>
        )}
      </div>

      <div className="h-[280px] sm:h-[360px] lg:h-[480px]">
        <MapContainer center={center} zoom={13} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <PinDrop value={value} onChange={onChange} />
        </MapContainer>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-ink-200/60 bg-white px-4 py-3 text-xs sm:px-5">
        <div>
          <span className="text-ink-400">Latitude</span>
          <p className="mt-0.5 font-medium text-ink-700">{value ? value.lat.toFixed(6) : 'Not set'}</p>
        </div>
        <div>
          <span className="text-ink-400">Longitude</span>
          <p className="mt-0.5 font-medium text-ink-700">{value ? value.lng.toFixed(6) : 'Not set'}</p>
        </div>
      </div>
    </section>
  );
}
