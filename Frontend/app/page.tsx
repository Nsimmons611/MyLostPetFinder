"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const Map = dynamic(() => import("./components/Map"), { ssr: false });

interface LostPet {
  id: number;
  name: string;
  petType: string;
  description: string;
  locationLost: string;
  isFound: boolean;
  photo?: string;
  latitude?: number;
  longitude?: number;
}

interface Sighting {
  id: number;
  lostPet: number;
  lostPetName: string;
  location: string;
  description: string;
  photo?: string;
  latitude?: number;
  longitude?: number;
}

interface MapPin {
  id: number;
  name: string;
  petType: string;
  locationLost: string;
  lat: number;
  lng: number;
}

export default function Home() {
  const [lostPets, setLostPets] = useState<LostPet[]>([]);
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [mapPins, setMapPins] = useState<MapPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPet, setModalPet] = useState<LostPet | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);

    // Fetch lost pets
    fetch("http://127.0.0.1:8000/api/lostpets/", {
      headers: token ? { "Authorization": `Bearer ${token}` } : {},
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Filter out pets marked as found
          const activePets = data.filter((pet: LostPet) => !pet.isFound);
          setLostPets(activePets);
        }
      })
      .catch((err) => console.error("Failed to fetch lost pets:", err));

    // Fetch sightings
    fetch("http://127.0.0.1:8000/api/sightings/", {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSightings(data);
        }
      })
      .catch((err) => console.error("Failed to fetch sightings:", err))
      .finally(() => setLoading(false));
  }, []);

  // Build map pins from lost pets and sightings
  useEffect(() => {
    const pins: MapPin[] = [];

    // Add lost pets with coordinates
    lostPets.forEach((pet) => {
      if (pet.latitude && pet.longitude) {
        pins.push({
          id: pet.id,
          name: pet.name,
          petType: pet.petType,
          locationLost: pet.locationLost,
          lat: pet.latitude,
          lng: pet.longitude,
        });
      }
    });

    // Add sightings with coordinates
    sightings.forEach((sighting) => {
      if (sighting.latitude && sighting.longitude) {
        pins.push({
          id: sighting.id,
          name: sighting.lostPetName,
          petType: 'sighting',
          locationLost: `Sighting: ${sighting.location}`,
          lat: sighting.latitude,
          lng: sighting.longitude,
        });
      }
    });

    setMapPins(pins);
  }, [lostPets, sightings]);

  // Close modal on Escape
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalOpen]);

  return (
    <main className="min-h-screen bg-black text-white p-12">
      <div className="max-w-3xl mx-auto">
        
        {/* --- HEADER SECTION (This will NEVER disappear now) --- */}
        <div className="flex justify-between items-center mb-12 border-b border-zinc-900 pb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tighter">Lost Pet Tracker</h1>
            <p className="text-zinc-500 text-sm mt-1">Rome, Georgia Presence</p>
          </div>
          
          <div className="flex gap-4">
            {isLoggedIn ? (
              <>
                <Link href="/pets/my-pets" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-bold transition shadow-lg shadow-purple-900/20">
                  My Pets
                </Link>
                <Link href="/pets/register" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold transition shadow-lg shadow-green-900/20">
                  + Register Pet
                </Link>
                <Link href="/report" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition shadow-lg shadow-blue-900/20">
                  Report Sighting
                </Link>
                <Link href="/login" className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2.5 rounded-xl text-sm font-medium transition text-zinc-300">
                  Switch User
                </Link>
              </>
            ) : (
              <>
                <Link href="/report" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition shadow-lg shadow-blue-900/20">
                  Report Sighting
                </Link>
                <Link href="/login" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-bold transition shadow-lg shadow-purple-900/20">
                  Sign In
                </Link>
                <Link href="/signup" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold transition shadow-lg shadow-green-900/20">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>

        {/* --- MAP SECTION --- */}
        {mapPins.length > 0 && (
          <Map pets={mapPins} />
        )}

        {/* --- LIST SECTION --- */}
        <div className="grid gap-6">
          {loading ? (
            <div className="flex flex-col items-center py-20">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
               <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">Scanning Database...</p>
            </div>
          ) : lostPets.length > 0 ? (
            lostPets.map((pet) => (
              <Link href={`/pets/${pet.id}`} key={pet.id} className="group">
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-blue-500/50 transition-all hover:scale-[1.01] shadow-2xl">
                  <div className="flex items-start gap-4">
                    {pet.photo ? (
                      <img
                        src={pet.photo}
                        alt={pet.name}
                        className="w-20 h-20 rounded-full object-cover cursor-pointer border-2 border-zinc-800"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setModalPet(pet);
                          setModalOpen(true);
                        }}
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold">No
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h2 className="text-2xl font-bold group-hover:text-blue-400 transition">{pet.name}</h2>
                        <span className="bg-zinc-800 text-zinc-500 text-[10px] font-black px-2 py-1 rounded uppercase tracking-tighter">
                          {pet.petType}
                        </span>
                      </div>
                      <p className="mt-4 text-zinc-400 font-medium">{pet.locationLost}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="py-24 border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center bg-zinc-900/10">
               <p className="text-zinc-500 text-lg">No pets reported in your area yet.</p>
               <p className="text-zinc-600 text-sm mt-2">Click the blue button above to create the first listing.</p>
            </div>
          )}
        </div>
      </div>

      {modalOpen && modalPet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setModalOpen(false)}>
          <div className="bg-zinc-900 rounded-xl p-6 max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col md:flex-row gap-6">
              {modalPet.photo ? (
                <img src={modalPet.photo} alt={modalPet.name} className="w-full md:w-48 h-48 object-cover rounded-lg" />
              ) : (
                <div className="w-full md:w-48 h-48 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500">No Photo</div>
              )}

              <div className="flex-1">
                <h2 className="text-3xl font-bold">{modalPet.name}</h2>
                <p className="text-zinc-400 mt-2">{modalPet.petType} • {modalPet.locationLost}</p>
                <p className="mt-4 text-zinc-300">{modalPet.description}</p>
              </div>
            </div>

            <div className="mt-6 text-right">
              <button onClick={() => setModalOpen(false)} className="bg-blue-600 px-4 py-2 rounded-lg">Close</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
