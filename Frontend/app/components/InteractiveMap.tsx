'use client';

import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

interface InteractiveMapProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
  title?: string;
}

const defaultIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.setIcon(defaultIcon);

export default function InteractiveMap({ 
  onLocationSelect, 
  initialLat = 33.0, 
  initialLng = -83.6,
  title = "Click on map to place pin"
}: InteractiveMapProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setSelectedLat(lat);
      setSelectedLng(lng);
      onLocationSelect(lat, lng);
    };

    mapRef.current.on('click', handleMapClick);

    return () => {
      if (mapRef.current) {
        mapRef.current.off('click', handleMapClick);
      }
    };
  }, [onLocationSelect]);

  if (!mounted) {
    return <div className="h-96 bg-zinc-800 rounded-lg animate-pulse" />;
  }

  return (
    <div className="mb-8">
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-zinc-400 text-sm mb-4">Click anywhere on the map to mark the location</p>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <MapContainer
          center={[initialLat, initialLng]}
          zoom={7}
          style={{ height: '400px', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {selectedLat && selectedLng && (
            <Marker position={[selectedLat, selectedLng]} icon={defaultIcon}>
              <Popup>
                <div className="text-sm">
                  <p className="font-bold">Selected Location</p>
                  <p className="text-xs">Lat: {selectedLat.toFixed(4)}</p>
                  <p className="text-xs">Lng: {selectedLng.toFixed(4)}</p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
      {selectedLat && selectedLng && (
        <div className="mt-4 p-4 bg-zinc-800 rounded-lg border border-zinc-700">
          <p className="text-sm text-zinc-300">
            <span className="font-bold">Location Selected:</span> {selectedLat.toFixed(4)}, {selectedLng.toFixed(4)}
          </p>
        </div>
      )}
    </div>
  );
}
