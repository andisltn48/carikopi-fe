'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
}

export default function MapPicker({ latitude, longitude, onChange }: MapPickerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Default center: Indonesia
  const defaultLat = latitude ?? -2.5;
  const defaultLng = longitude ?? 118.0;
  const defaultZoom = latitude ? 15 : 5;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView([defaultLat, defaultLng], defaultZoom);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Place initial marker if coordinates exist
    if (latitude && longitude) {
      const marker = L.marker([latitude, longitude], { icon: defaultIcon }).addTo(map);
      markerRef.current = marker;
    } else {
      // Get user's current location if no coordinates provided
      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude: userLat, longitude: userLng } = position.coords;
            map.flyTo([userLat, userLng], 15);
            
            // Auto-place marker at user's current location
            if (!markerRef.current) {
              markerRef.current = L.marker([userLat, userLng], { icon: defaultIcon }).addTo(map);
            } else {
              markerRef.current.setLatLng([userLat, userLng]);
            }
            onChange(userLat, userLng);
          },
          (error) => {
            console.error('Error getting geolocation:', error);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      }
    }

    // Click handler
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { icon: defaultIcon }).addTo(map);
      }

      onChange(lat, lng);
    });

    // Fix map size on load
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="w-full h-[300px] rounded-xl overflow-hidden border border-input"
        style={{ zIndex: 0 }}
      />
      <p className="text-xs text-muted-foreground">
        Klik pada peta untuk menentukan lokasi coffee shop Anda
      </p>
    </div>
  );
}
