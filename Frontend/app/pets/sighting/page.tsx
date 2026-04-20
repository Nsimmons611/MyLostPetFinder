'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const InteractiveMap = dynamic(() => import('../../components/InteractiveMap'), { ssr: false });

interface LostPet {
  id: number;
  name: string;
  petType: string;
  locationLost: string;
}

export default function ReportSighting() {
  const router = useRouter();
  const [lostPets, setLostPets] = useState<LostPet[]>([]);
  const [formData, setFormData] = useState({
    lostPet: '',
    location: '',
    description: '',
    dateSighted: new Date().toISOString().split('T')[0],
    confidence: 50,
    latitude: null as number | null,
    longitude: null as number | null,
  });
  const [loading, setLoading] = useState(false);
  const [loadingPets, setLoadingPets] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch lost pets
    fetch('http://127.0.0.1:8000/api/lostpets/')
      .then(res => res.json())
      .then(data => {
        const activePets = Array.isArray(data) ? data.filter((pet: any) => !pet.isFound) : [];
        setLostPets(activePets);
        if (activePets.length > 0 && !formData.lostPet) {
          setFormData(prev => ({ ...prev, lostPet: activePets[0].id.toString() }));
        }
      })
      .catch(err => console.error('Failed to fetch lost pets:', err))
      .finally(() => setLoadingPets(false));
  }, []);

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'confidence' ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.latitude || !formData.longitude) {
      setError('Please select a location on the map');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('http://127.0.0.1:8000/api/sightings/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          lostPet: parseInt(formData.lostPet),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to report sighting');
      }

      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loadingPets) {
    return (
      <main className="min-h-screen bg-black text-white p-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4 mx-auto"></div>
          <p className="text-zinc-500">Loading lost pets...</p>
        </div>
      </main>
    );
  }

  if (lostPets.length === 0) {
    return (
      <main className="min-h-screen bg-black text-white p-12">
        <div className="max-w-2xl mx-auto">
          <Link href="/" className="text-zinc-400 hover:text-white mb-8 inline-block">
            ← Back to Map
          </Link>
          <div className="text-center py-20">
            <p className="text-zinc-400">No lost pets reported yet.</p>
            <Link href="/" className="text-blue-400 hover:text-blue-300">Return to home</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-12">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-zinc-400 hover:text-white mb-8 inline-block">
          ← Back to Map
        </Link>

        <h1 className="text-4xl font-black mb-8">Report a Sighting</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <InteractiveMap 
            onLocationSelect={handleLocationSelect}
            title="Mark where you saw the pet"
          />

          <div>
            <label className="block text-sm font-bold mb-2">Which pet did you see? *</label>
            <select
              value={formData.lostPet}
              onChange={handleInputChange}
              name="lostPet"
              required
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Select a pet...</option>
              {lostPets.map(pet => (
                <option key={pet.id} value={pet.id}>
                  {pet.name} ({pet.petType}) - Lost at {pet.locationLost}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Location Description *</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="e.g., Behind the grocery store"
              required
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe what you saw (condition, behavior, etc.)"
              required
              rows={4}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">
              Confidence Level: {formData.confidence}%
            </label>
            <input
              type="range"
              name="confidence"
              min="1"
              max="100"
              value={formData.confidence}
              onChange={handleInputChange}
              className="w-full"
            />
            <p className="text-xs text-zinc-400 mt-2">
              How confident are you this is the lost pet?
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Date Sighted *</label>
            <input
              type="date"
              name="dateSighted"
              value={formData.dateSighted}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {formData.latitude && formData.longitude && (
            <div className="p-4 bg-green-900/20 border border-green-600 rounded-lg">
              <p className="text-green-400 text-sm">
                Location selected: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-900/20 border border-red-600 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-600 text-white py-3 rounded-lg font-bold transition"
          >
            {loading ? 'Reporting...' : 'Report Sighting'}
          </button>
        </form>
      </div>
    </main>
  );
}
