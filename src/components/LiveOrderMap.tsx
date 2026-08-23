'use client';

import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import {
  MapContainer,
  Marker,
  Popup,
  Polyline,
  TileLayer,
  useMap,
} from 'react-leaflet';

import 'leaflet/dist/leaflet.css';

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

interface LiveOrderMapProps {
  pickup: MapPoint;
  dropoff: MapPoint;
  driver: DriverMapPoint | null;
}

function createMarkerIcon(
  backgroundColor: string
) {
  return L.divIcon({
    className: '',
    html: `
      <div
        style="
          width: 20px;
          height: 20px;
          border-radius: 9999px;
          background: ${backgroundColor};
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
        "
      ></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -12],
  });
}

const pickupIcon = createMarkerIcon('#16A34A');
const dropoffIcon = createMarkerIcon('#DC2626');
const driverIcon = createMarkerIcon('#2563EB');

function FitMapBounds({
  points,
}: {
  points: [number, number][];
}) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) {
      return;
    }

    const bounds = L.latLngBounds(points);

    map.fitBounds(bounds, {
      padding: [35, 35],
      maxZoom: 14,
    });
  }, [map, points]);

  return null;
}

export default function LiveOrderMap({
  pickup,
  dropoff,
  driver,
}: LiveOrderMapProps) {
  const points = useMemo<[number, number][]>(() => {
    const mapPoints: [number, number][] = [
      [pickup.lat, pickup.lng],
      [dropoff.lat, dropoff.lng],
    ];

    if (driver) {
      mapPoints.push([driver.lat, driver.lng]);
    }

    return mapPoints;
  }, [
    pickup.lat,
    pickup.lng,
    dropoff.lat,
    dropoff.lng,
    driver,
  ]);

  const routePoints: [number, number][] = [
    [pickup.lat, pickup.lng],
    [dropoff.lat, dropoff.lng],
  ];

  return (
    <div className="surface overflow-hidden p-0">
      <div className="h-72 w-full sm:h-80 lg:h-[380px]">
        <MapContainer
          center={[pickup.lat, pickup.lng]}
          zoom={11}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitMapBounds points={points} />

          <Polyline
            positions={routePoints}
            pathOptions={{
              color: '#8B1A2F',
              weight: 4,
              dashArray: '8 8',
            }}
          />

          <Marker
            position={[pickup.lat, pickup.lng]}
            icon={pickupIcon}
          >
            <Popup>
              <strong>Pickup location</strong>
              <br />
              {pickup.label}
            </Popup>
          </Marker>

          <Marker
            position={[dropoff.lat, dropoff.lng]}
            icon={dropoffIcon}
          >
            <Popup>
              <strong>Drop-off location</strong>
              <br />
              {dropoff.label}
            </Popup>
          </Marker>

          {driver && (
            <Marker
              position={[driver.lat, driver.lng]}
              icon={driverIcon}
            >
              <Popup>
                <strong>Latest driver location</strong>
                <br />
                Updated:{' '}
                {new Intl.DateTimeFormat('en-KE', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(driver.updatedAt))}
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}