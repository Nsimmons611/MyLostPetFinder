'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface PetLocation {
  id: number;
  name: string;
  pet_type: string;
  location_lost: string;
  lat: number;
  lng: number;
}

interface MapProps {
  pets: PetLocation[];
}

// Fix for default Leaflet icon issue
const defaultIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.setIcon(defaultIcon);

export default function Map({ pets }: MapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  console.log('Map component rendered with pets:', pets);

  if (!mounted) return <div className="h-96 bg-zinc-800 rounded-lg animate-pulse" />;
  
  if (!pets || pets.length === 0) {
    console.log('No pets provided to map');
    return null;
  }

  // Calculate map center from pet locations
  const validPets = pets.filter(p => p.lat && p.lng);
  if (validPets.length === 0) {
    console.log('No pets with valid coordinates');
    return null;
  }

  // Center on Georgia (approximate geographic center)
  const centerLat = 33.0;
  const centerLng = -83.6;

  console.log('Map center:', { centerLat, centerLng }, 'Valid pets:', validPets.length);

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold mb-4">Lost Pets Map</h2>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={7}
          style={{ height: '400px', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {validPets.map((pet) => (
            <Marker key={pet.id} position={[pet.lat, pet.lng]} icon={defaultIcon}>
              <Popup>
                <div className="flex flex-col gap-2">
                  <h3 className="font-bold text-blue-600">{pet.name}</h3>
                  <p className="text-sm">{pet.pet_type.toUpperCase()}</p>
                  <p className="text-xs text-zinc-600">{pet.location_lost}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
